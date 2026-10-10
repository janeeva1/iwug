import { createHash, randomBytes } from "node:crypto";

const WIKIMEDIA_USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ??
  "IgboWikimediansCommunitySite/1.0 (https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group)";
const WIKIMEDIA_OAUTH_BASE = "https://meta.wikimedia.org/w/rest.php/oauth2";

export type OAuthProvider = "google" | "wikimedia";

export function generateState(): string {
  return randomBytes(24).toString("base64url");
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function wikimediaEnabled(): boolean {
  return Boolean(
    process.env.WIKIMEDIA_OAUTH_CLIENT_ID && process.env.WIKIMEDIA_OAUTH_CLIENT_SECRET,
  );
}

export function googleAuthorizeUrl(opts: {
  state: string;
  challenge: string;
  redirectUri: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export interface GoogleProfile {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string;
  expiresAt: Date | null;
}

export async function exchangeGoogleCode(opts: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: opts.code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: opts.redirectUri,
      code_verifier: opts.verifier,
    }).toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed (${tokenRes.status})`);
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    expires_in?: number;
  };

  const profileRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  if (!profileRes.ok) {
    throw new Error(`Google profile fetch failed (${profileRes.status})`);
  }
  const profile = (await profileRes.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  return {
    providerAccountId: profile.sub,
    email: profile.email ?? null,
    emailVerified: Boolean(profile.email_verified),
    name: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
    accessToken: tokens.access_token,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
  };
}

export function wikimediaAuthorizeUrl(opts: {
  state: string;
  challenge: string;
  redirectUri: string;
}): string {
  const url = new URL(`${WIKIMEDIA_OAUTH_BASE}/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WIKIMEDIA_OAUTH_CLIENT_ID ?? "",
    redirect_uri: opts.redirectUri,
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

export interface WikimediaOAuthProfile {
  providerAccountId: string;
  username: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}

export async function exchangeWikimediaCode(opts: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<WikimediaOAuthProfile> {
  const tokenRes = await fetch(`${WIKIMEDIA_OAUTH_BASE}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": WIKIMEDIA_USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: opts.code,
      client_id: process.env.WIKIMEDIA_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.WIKIMEDIA_OAUTH_CLIENT_SECRET ?? "",
      redirect_uri: opts.redirectUri,
      code_verifier: opts.verifier,
    }).toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Wikimedia token exchange failed (${tokenRes.status})`);
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const profileRes = await fetch(`${WIKIMEDIA_OAUTH_BASE}/resource/profile`, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "User-Agent": WIKIMEDIA_USER_AGENT,
    },
  });
  if (!profileRes.ok) {
    throw new Error(`Wikimedia profile fetch failed (${profileRes.status})`);
  }
  const profile = (await profileRes.json()) as {
    sub?: string | number;
    username?: string;
  };

  return {
    providerAccountId: String(profile.sub ?? ""),
    username: profile.username ?? null,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
  };
}

/** Fetch the MediaWiki username for an existing OAuth access token. */
export async function fetchWikimediaUsername(
  accessToken: string,
): Promise<string | null> {
  const profileRes = await fetch(`${WIKIMEDIA_OAUTH_BASE}/resource/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": WIKIMEDIA_USER_AGENT,
    },
  });
  if (!profileRes.ok) {
    throw new Error(`Wikimedia profile fetch failed (${profileRes.status})`);
  }
  const profile = (await profileRes.json()) as { username?: string };
  return profile.username ?? null;
}
