import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { and, eq, or } from "drizzle-orm";
import { db, oauthAccountsTable, usersTable, type User } from "@workspace/db";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/passwords";
import {
  getWikimediaAccount,
  searchWikimediaUsernames,
  MIN_WIKIMEDIA_EDITS,
} from "../lib/wikimedia";
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionToken,
  getSessionUser,
  OAUTH_STATE_COOKIE,
  readCookie,
  resolveRole,
  setOAuthStateCookie,
  setSessionCookie,
  toAuthUser,
} from "../lib/session";
import {
  exchangeGoogleCode,
  exchangeWikimediaCode,
  fetchWikimediaUsername,
  generatePkce,
  generateState,
  googleAuthorizeUrl,
  googleEnabled,
  wikimediaAuthorizeUrl,
  wikimediaEnabled,
} from "../lib/oauth";
import { requireUser } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const emailField = z.string().trim().toLowerCase().email().max(320);
const usernameField = z.string().trim().min(1).max(191);
const passwordField = z.string().min(8).max(200);

function apiOrigin(req: Request): string {
  const configured = process.env.OAUTH_REDIRECT_ORIGIN?.replace(/\/+$/, "");
  if (configured) return configured;
  const forwarded = req.headers["x-forwarded-proto"];
  const proto =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      ?.trim() || (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${req.headers.host ?? `localhost:${process.env.PORT ?? 5000}`}`;
}

function appOrigin(req: Request): string {
  const configured = process.env.APP_ORIGIN?.replace(/\/+$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? apiOrigin(req)
    : "http://localhost:5173";
}

interface OAuthState {
  provider: string;
  state: string;
  verifier: string;
}

function encodeState(value: OAuthState): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeState(raw: string | null): OAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Partial<OAuthState>;
    if (!parsed.provider || !parsed.state || !parsed.verifier) return null;
    return {
      provider: parsed.provider,
      state: parsed.state,
      verifier: parsed.verifier,
    };
  } catch {
    return null;
  }
}

interface OAuthUserInput {
  provider: "google" | "wikimedia";
  providerAccountId: string;
  email?: string | null;
  emailVerified?: boolean;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  editCount?: number;
  wikimediaUserId?: string | null;
}

async function findOrCreateOAuthUser(input: OAuthUserInput): Promise<User> {
  const link = await db
    .select()
    .from(oauthAccountsTable)
    .where(
      and(
        eq(oauthAccountsTable.provider, input.provider),
        eq(oauthAccountsTable.providerAccountId, input.providerAccountId),
      ),
    )
    .limit(1);

  let userId: string;
  if (link[0]) {
    userId = link[0].userId;
  } else {
    let existing: User | undefined;
    if (input.email) {
      existing = (
        await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, input.email.toLowerCase()))
          .limit(1)
      )[0];
    }
    if (!existing && input.username) {
      existing = (
        await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.username, input.username))
          .limit(1)
      )[0];
    }

    if (existing) {
      userId = existing.id;
      const patch: Partial<typeof usersTable.$inferInsert> = {};
      if (input.email && !existing.email) patch.email = input.email.toLowerCase();
      if (input.emailVerified && !existing.emailVerified) patch.emailVerified = true;
      if (input.username && !existing.username) patch.username = input.username;
      if (input.name && !existing.displayName) patch.displayName = input.name;
      if (input.avatarUrl && !existing.avatarUrl) patch.avatarUrl = input.avatarUrl;
      if (input.provider === "wikimedia") {
        patch.wikimediaUserId = input.wikimediaUserId ?? existing.wikimediaUserId;
        patch.wikimediaEditCount = input.editCount ?? existing.wikimediaEditCount;
        patch.wikimediaVerified = true;
      }
      patch.role = resolveRole(
        patch.email ?? existing.email,
        patch.username ?? existing.username,
      );
      await db.update(usersTable).set(patch).where(eq(usersTable.id, userId));
    } else {
      userId = randomUUID();
      await db.insert(usersTable).values({
        id: userId,
        username: input.username ?? null,
        displayName: input.name ?? input.username ?? null,
        email: input.email ? input.email.toLowerCase() : null,
        emailVerified: Boolean(input.emailVerified),
        avatarUrl: input.avatarUrl ?? null,
        role: resolveRole(input.email, input.username),
        wikimediaUserId: input.wikimediaUserId ?? null,
        wikimediaEditCount: input.editCount ?? 0,
        wikimediaVerified: input.provider === "wikimedia",
      });
    }
  }

  if (link[0]) {
    await db
      .update(oauthAccountsTable)
      .set({
        email: input.email ?? null,
        username: input.username ?? null,
        accessToken: input.accessToken ?? null,
        refreshToken: input.refreshToken ?? null,
        expiresAt: input.expiresAt ?? null,
      })
      .where(eq(oauthAccountsTable.id, link[0].id));
  } else {
    await db.insert(oauthAccountsTable).values({
      id: randomUUID(),
      userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      email: input.email ?? null,
      username: input.username ?? null,
      accessToken: input.accessToken ?? null,
      refreshToken: input.refreshToken ?? null,
      expiresAt: input.expiresAt ?? null,
    });
  }

  return (
    await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)
  )[0];
}

/** Which sign-in methods are enabled, so the client only shows usable buttons. */
router.get("/providers", (_req, res) => {
  res.json({
    password: true,
    google: googleEnabled(),
    wikimedia: wikimediaEnabled(),
  });
});

/** Current session user (or null). */
router.get("/me", async (req, res, next) => {
  try {
    const user = await getSessionUser(getSessionToken(req));
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/** Wikimedia global-username prefix search for the registration autocomplete. */
router.get("/wikimedia/usernames", async (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    res.json({ suggestions: [] });
    return;
  }
  try {
    const suggestions = await searchWikimediaUsernames(query, 8);
    res.json({ suggestions });
  } catch (err) {
    logger.warn({ err }, "Wikimedia username search failed");
    res.status(502).json({ error: "Wikimedia search is unavailable right now." });
  }
});

/** Verify a specific Wikimedia username and report its contribution totals. */
router.get("/wikimedia/verify", async (req, res, next) => {
  const username = String(req.query.username ?? "").trim();
  if (!username) {
    res.status(400).json({ error: "A username is required." });
    return;
  }
  try {
    const info = await getWikimediaAccount(username);
    res.json(info);
  } catch (err) {
    next(err);
  }
});

/** Email + optional Wikimedia-username + password registration. */
router.post("/register", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        email: emailField,
        username: z.string().trim().max(191).optional().or(z.literal("")),
        password: passwordField,
        displayName: z.string().trim().max(191).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Enter a valid email and a password of at least 8 characters.",
      });
      return;
    }

    const rawUsername = parsed.data.username?.trim() ?? "";
    let wiki: Awaited<ReturnType<typeof getWikimediaAccount>> | null = null;
    if (rawUsername) {
      const info = await getWikimediaAccount(rawUsername);
      if (!info.exists) {
        res.status(400).json({
          error:
            "We couldn't find that Wikimedia username. Leave it blank to add it later, or pick it from the suggestions.",
        });
        return;
      }
      if (info.editCount < MIN_WIKIMEDIA_EDITS) {
        res.status(400).json({
          error:
            "That Wikimedia account has no recorded contributions yet. Leave the username blank to continue.",
        });
        return;
      }
      wiki = info;
    }

    const conditions = [eq(usersTable.email, parsed.data.email)];
    if (wiki) conditions.push(eq(usersTable.username, wiki.username));
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(or(...conditions))
      .limit(1);
    if (existing[0]) {
      res.status(409).json({
        error: wiki
          ? "An account with that email or Wikimedia username already exists."
          : "An account with that email already exists.",
      });
      return;
    }

    const id = randomUUID();
    await db.insert(usersTable).values({
      id,
      username: wiki ? wiki.username : null,
      displayName:
        parsed.data.displayName?.trim() ||
        (wiki ? wiki.username : parsed.data.email.split("@")[0]),
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: resolveRole(parsed.data.email, wiki?.username ?? null),
      wikimediaUserId: wiki?.id ?? null,
      wikimediaEditCount: wiki?.editCount ?? 0,
      wikimediaVerified: Boolean(wiki),
    });

    const user = (
      await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1)
    )[0];
    const { token, expiresAt } = await createSession(id, req);
    setSessionCookie(res, token, expiresAt);
    res.status(201).json({ user: toAuthUser(user) });
  } catch (err) {
    next(err);
  }
});

/** Email-or-username + password login. */
router.post("/login", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        identifier: z.string().trim().min(1).max(320),
        password: z.string().min(1).max(200),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter your email or username and password." });
      return;
    }

    const identifier = parsed.data.identifier;
    const user = (
      await db
        .select()
        .from(usersTable)
        .where(
          or(
            eq(usersTable.email, identifier.toLowerCase()),
            eq(usersTable.username, identifier),
          ),
        )
        .limit(1)
    )[0];

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Incorrect email/username or password." });
      return;
    }
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect email/username or password." });
      return;
    }

    const { token, expiresAt } = await createSession(user.id, req);
    setSessionCookie(res, token, expiresAt);
    res.json({ user: toAuthUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const token = getSessionToken(req);
    if (token) await deleteSession(token);
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Attach a verified Wikimedia username (used after Google sign-in). */
router.post("/complete-profile", requireUser, async (req, res, next) => {
  try {
    const parsed = z
      .object({
        username: usernameField,
        displayName: z.string().trim().max(191).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter the Wikimedia username you want to use." });
      return;
    }

    const info = await getWikimediaAccount(parsed.data.username);
    if (!info.exists) {
      res.status(400).json({ error: "We couldn't find that Wikimedia username." });
      return;
    }
    if (info.editCount < MIN_WIKIMEDIA_EDITS) {
      res.status(400).json({
        error: "That Wikimedia account has no recorded contributions yet.",
      });
      return;
    }

    const userId = req.user!.id;
    const taken = (
      await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, info.username))
        .limit(1)
    )[0];
    if (taken && taken.id !== userId) {
      res.status(409).json({
        error: "That Wikimedia username is already linked to another account.",
      });
      return;
    }

    const patch: Partial<typeof usersTable.$inferInsert> = {
      username: info.username,
      wikimediaUserId: info.id,
      wikimediaEditCount: info.editCount,
      wikimediaVerified: true,
      role: resolveRole(req.user!.email, info.username),
    };
    if (parsed.data.displayName?.trim()) {
      patch.displayName = parsed.data.displayName.trim();
    }
    await db.update(usersTable).set(patch).where(eq(usersTable.id, userId));

    const user = (
      await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)
    )[0];
    res.json({ user: toAuthUser(user) });
  } catch (err) {
    next(err);
  }
});

/** Re-fetch the linked Wikimedia username once OAuth is configured. */
router.post("/refresh", requireUser, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const link = (
      await db
        .select()
        .from(oauthAccountsTable)
        .where(
          and(
            eq(oauthAccountsTable.userId, userId),
            eq(oauthAccountsTable.provider, "wikimedia"),
          ),
        )
        .limit(1)
    )[0];

    if (link?.accessToken) {
      try {
        const linkedUsername = await fetchWikimediaUsername(link.accessToken);
        if (linkedUsername) {
          const info = await getWikimediaAccount(linkedUsername);
          const finalName = info.exists ? info.username : linkedUsername;
          const taken = (
            await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(eq(usersTable.username, finalName))
              .limit(1)
          )[0];
          if (!taken || taken.id === userId) {
            await db
              .update(usersTable)
              .set({
                username: finalName,
                wikimediaUserId: info.exists ? info.id : null,
                wikimediaEditCount: info.exists ? info.editCount : req.user!.wikimediaEditCount,
                wikimediaVerified: true,
                role: resolveRole(req.user!.email, finalName),
              })
              .where(eq(usersTable.id, userId));
          }
        }
      } catch (err) {
        logger.warn({ err }, "Wikimedia username refresh failed");
      }
    }

    const user = (
      await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)
    )[0];
    res.json({ user: toAuthUser(user) });
  } catch (err) {
    next(err);
  }
});

/** Start Google OAuth. */
router.get("/google", (req, res) => {
  if (!googleEnabled()) {
    res.status(503).json({ error: "Google sign-in is not configured." });
    return;
  }
  const state = generateState();
  const { verifier, challenge } = generatePkce();
  const redirectUri = `${apiOrigin(req)}/api/auth/google/callback`;
  setOAuthStateCookie(res, encodeState({ provider: "google", state, verifier }));
  res.redirect(googleAuthorizeUrl({ state, challenge, redirectUri }));
});

router.get("/google/callback", async (req, res) => {
  const fallback = `${appOrigin(req)}/sign-in?error=oauth_failed`;
  try {
    const stored = decodeState(readCookie(req, OAUTH_STATE_COOKIE));
    clearOAuthStateCookie(res);
    const state = String(req.query.state ?? "");
    const code = String(req.query.code ?? "");
    if (!stored || stored.provider !== "google" || stored.state !== state || !code) {
      res.redirect(`${appOrigin(req)}/sign-in?error=oauth_state`);
      return;
    }
    const redirectUri = `${apiOrigin(req)}/api/auth/google/callback`;
    const profile = await exchangeGoogleCode({
      code,
      verifier: stored.verifier,
      redirectUri,
    });
    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      accessToken: profile.accessToken,
      expiresAt: profile.expiresAt,
    });
    const { token, expiresAt } = await createSession(user.id, req);
    setSessionCookie(res, token, expiresAt);
    res.redirect(`${appOrigin(req)}${user.username ? "/member" : "/complete-profile"}`);
  } catch (err) {
    logger.error({ err }, "Google OAuth callback failed");
    res.redirect(fallback);
  }
});

/** Start Wikimedia (MediaWiki) OAuth 2.0. */
router.get("/wikimedia", (req, res) => {
  if (!wikimediaEnabled()) {
    res.status(503).json({ error: "Wikimedia sign-in is not configured." });
    return;
  }
  const state = generateState();
  const { verifier, challenge } = generatePkce();
  const redirectUri = `${apiOrigin(req)}/api/auth/wikimedia/callback`;
  setOAuthStateCookie(res, encodeState({ provider: "wikimedia", state, verifier }));
  res.redirect(wikimediaAuthorizeUrl({ state, challenge, redirectUri }));
});

router.get("/wikimedia/callback", async (req, res) => {
  const fallback = `${appOrigin(req)}/sign-in?error=oauth_failed`;
  try {
    const stored = decodeState(readCookie(req, OAUTH_STATE_COOKIE));
    clearOAuthStateCookie(res);
    const state = String(req.query.state ?? "");
    const code = String(req.query.code ?? "");
    if (!stored || stored.provider !== "wikimedia" || stored.state !== state || !code) {
      res.redirect(`${appOrigin(req)}/sign-in?error=oauth_state`);
      return;
    }
    const redirectUri = `${apiOrigin(req)}/api/auth/wikimedia/callback`;
    const profile = await exchangeWikimediaCode({
      code,
      verifier: stored.verifier,
      redirectUri,
    });
    if (!profile.username) {
      res.redirect(`${appOrigin(req)}/sign-in?error=oauth_profile`);
      return;
    }
    const info = await getWikimediaAccount(profile.username);
    const user = await findOrCreateOAuthUser({
      provider: "wikimedia",
      providerAccountId: profile.providerAccountId,
      username: info.exists ? info.username : profile.username,
      name: info.exists ? info.username : profile.username,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      expiresAt: profile.expiresAt,
      editCount: info.editCount,
      wikimediaUserId: info.id,
    });
    const { token, expiresAt } = await createSession(user.id, req);
    setSessionCookie(res, token, expiresAt);
    res.redirect(`${appOrigin(req)}/member`);
  } catch (err) {
    logger.error({ err }, "Wikimedia OAuth callback failed");
    res.redirect(fallback);
  }
});

export default router;
