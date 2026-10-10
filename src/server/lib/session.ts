import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, sessionsTable, usersTable, type User } from "@workspace/db";

export const SESSION_COOKIE = "iwug_session";
export const OAUTH_STATE_COOKIE = "iwug_oauth_state";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type AuthUserRole = "member" | "admin";

export interface AuthUser {
  id: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
  role: AuthUserRole;
  wikimediaVerified: boolean;
  wikimediaEditCount: number;
  profileComplete: boolean;
  createdAt: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | null;
    }
  }
}

const adminEmails = new Set(
  (process.env.IWUG_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);
const adminUsernames = new Set(
  (process.env.IWUG_ADMIN_WIKIMEDIA_USERNAMES ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

/** Admins are configured by env: allowlisted emails and/or Wikimedia usernames. */
export function resolveRole(
  email: string | null | undefined,
  username: string | null | undefined,
): AuthUserRole {
  if (email && adminEmails.has(email.toLowerCase())) return "admin";
  if (username && adminUsernames.has(username.toLowerCase())) return "admin";
  return "member";
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || resolveRole(user.email, user.username) === "admin";
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    role:
      user.role === "admin" || resolveRole(user.email, user.username) === "admin"
        ? "admin"
        : "member",
    wikimediaVerified: user.wikimediaVerified,
    wikimediaEditCount: user.wikimediaEditCount,
    profileComplete: Boolean(user.username),
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : String(user.createdAt),
  };
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(",")[0]?.trim() || req.socket.remoteAddress || "").slice(0, 64);
}

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(0, maxAgeMs),
  };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE, token, cookieOptions(expiresAt.getTime() - Date.now()));
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function setOAuthStateCookie(res: Response, value: string) {
  res.cookie(OAUTH_STATE_COOKIE, value, cookieOptions(1000 * 60 * 10));
}

export function clearOAuthStateCookie(res: Response) {
  res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });
}

export function getSessionToken(req: Request): string | null {
  return readCookie(req, SESSION_COOKIE);
}

export async function createSession(
  userId: string,
  req: Request,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionsTable).values({
    id: token,
    userId,
    userAgent: String(req.headers["user-agent"] ?? "").slice(0, 255),
    ip: clientIp(req),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function getSessionUser(
  token: string | null,
): Promise<AuthUser | null> {
  if (!token) return null;
  const rows = await db
    .select({ user: usersTable, expiresAt: sessionsTable.expiresAt })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.id, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await deleteSession(token);
    return null;
  }
  return toAuthUser(row.user);
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, token));
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
}
