import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthMe, logoutAccount } from '@workspace/api-client-react';
import type { AuthUser } from '@workspace/api-client-react';

export type { AuthUser } from '@workspace/api-client-react';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  refresh: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback(
    (next: AuthUser | null) => {
      setUserState((prev) => {
        if ((prev?.id ?? null) !== (next?.id ?? null)) client.clear();
        return next;
      });
    },
    [client],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await getAuthMe();
      applyUser(data.user ?? null);
      return data.user ?? null;
    } catch {
      applyUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // Ignore network errors on logout; clear locally regardless.
    }
    applyUser(null);
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isSignedIn: !!user,
      isAdmin: user?.role === 'admin',
      refresh,
      setUser: applyUser,
      signOut,
    }),
    [user, loading, refresh, applyUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

/**
 * Administrator sign-in for the footer Admin button. Only succeeds for the
 * single provisioned admin; a member account receives a 403 which the caller
 * uses to fall back to the normal member sign-in.
 */
export async function adminLogin(identifier: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${base}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ identifier, password }),
  });
  const data = (await res.json().catch(() => null)) as { user?: AuthUser; error?: string } | null;
  if (!res.ok) {
    const error = new Error(data?.error ?? 'Sign-in failed') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  if (!data?.user) throw new Error('Sign-in failed');
  return data.user;
}
