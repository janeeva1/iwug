import { asc, count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { requireAdmin, requireUser } from "../middlewares/auth";
import {
  CreateEventBody,
  CreateEventResponse,
  CreateMembershipTierBody,
  CreateMembershipTierResponse,
  CreatePageBody,
  CreatePageResponse,
  DeleteEventParams,
  DeleteMembershipTierParams,
  DeletePageParams,
  GetCommunitySummaryResponse,
  GetCommunityContributorsResponse,
  GetMyMembershipResponse,
  GetPageParams,
  GetPageResponse,
  GetSiteSettingsResponse,
  GetWikimediaStatsResponse,
  ListAdminPagesResponse,
  ListEventsResponse,
  ListMembersResponse,
  ListMembershipTiersResponse,
  ListPagesResponse,
  RegisterMemberBody,
  RegisterMemberResponse,
  UpdateEventBody,
  UpdateEventParams,
  UpdateEventResponse,
  UpdateMemberBody,
  UpdateMemberParams,
  UpdateMemberResponse,
  UpdateMembershipTierBody,
  UpdateMembershipTierParams,
  UpdateMembershipTierResponse,
  UpdatePageBody,
  UpdatePageParams,
  UpdatePageResponse,
  UpdateSiteSettingsBody,
  UpdateSiteSettingsResponse,
} from "@workspace/api-zod";
import {
  cmsPagesTable,
  communityEventsTable,
  db,
  membersTable,
  membershipTiersTable,
  siteSettingsTable,
  type WikimediaAccount,
} from "@workspace/db";
import { ensureCommunitySeed } from "../lib/seedCommunity";
import {
  cacheDel,
  cacheGet,
  cacheKeys,
  cacheSet,
  cacheTtl,
  withCache,
} from "../lib/cache";

const router: IRouter = Router();

router.use(async (_req, _res, next) => {
  try {
    await ensureCommunitySeed();
    next();
  } catch (error) {
    next(error);
  }
});

const WIKIMEDIA_PROJECTS = [
  {
    id: "igwiki",
    labelEn: "Igbo Wikipedia",
    labelIg: "Wikipedia Igbo",
    url: "https://ig.wikipedia.org/",
    api: "https://ig.wikipedia.org/w/api.php",
  },
  {
    id: "igwikt",
    labelEn: "Igbo Wiktionary",
    labelIg: "Wiktionary Igbo",
    url: "https://ig.wiktionary.org/",
    api: "https://ig.wiktionary.org/w/api.php",
  },
  {
    id: "igwikiquote",
    labelEn: "Igbo Wikiquote",
    labelIg: "Wikiquote Igbo",
    url: "https://ig.wikiquote.org/",
    api: "https://ig.wikiquote.org/w/api.php",
  },
  {
    id: "wikidata",
    labelEn: "Wikidata",
    labelIg: "Wikidata",
    url: "https://www.wikidata.org/",
    api: "https://www.wikidata.org/w/api.php",
  },
  {
    id: "commons",
    labelEn: "Wikimedia Commons",
    labelIg: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/",
    api: "https://commons.wikimedia.org/w/api.php",
  },
  {
    id: "wikifunctions",
    labelEn: "Wikifunctions",
    labelIg: "Wikifunctions",
    url: "https://www.wikifunctions.org/",
    api: "https://www.wikifunctions.org/w/api.php",
  },
  {
    id: "enwiki",
    labelEn: "English Wikipedia",
    labelIg: "Wikipedia Bekee",
    url: "https://en.wikipedia.org/",
    api: "https://en.wikipedia.org/w/api.php",
  },
  {
    id: "wikisource",
    labelEn: "Wikisource",
    labelIg: "Wikisource",
    url: "https://wikisource.org/",
    api: "https://wikisource.org/w/api.php",
  },
  {
    id: "meta",
    labelEn: "Meta-Wiki",
    labelIg: "Meta-Wiki",
    url: "https://meta.wikimedia.org/",
    api: "https://meta.wikimedia.org/w/api.php",
  },
] as const;

function pageForApi(page: typeof cmsPagesTable.$inferSelect) {
  return { ...page, updatedAt: page.updatedAt.toISOString() };
}

function eventForApi(event: typeof communityEventsTable.$inferSelect) {
  return { ...event, startsAt: event.startsAt.toISOString() };
}

function memberForApi(member: typeof membersTable.$inferSelect) {
  return { ...member, createdAt: member.createdAt.toISOString() };
}

function isSafeHttpUrl(value: string | null): boolean {
  if (value === null) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function getSiteSettings() {
  const [existing] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, "default"));
  if (existing) return existing;

  await db
    .insert(siteSettingsTable)
    .values({ id: "default" })
    .onConflictDoNothing();

  const [created] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, "default"));
  if (!created) throw new Error("Could not initialize site settings.");
  return created;
}

router.get("/cms/pages", async (_req, res): Promise<void> => {
  const pages = await withCache(cacheKeys.publishedPages, cacheTtl.medium, async () => {
    const rows = await db
      .select()
      .from(cmsPagesTable)
      .where(eq(cmsPagesTable.published, true))
      .orderBy(asc(cmsPagesTable.updatedAt));
    return ListPagesResponse.parse(rows.map(pageForApi));
  });
  res.json(pages);
});

router.get("/admin/pages", requireAdmin, async (_req, res): Promise<void> => {
  const pages = await db
    .select()
    .from(cmsPagesTable)
    .orderBy(asc(cmsPagesTable.updatedAt));
  res.json(ListAdminPagesResponse.parse(pages.map(pageForApi)));
});

router.post("/cms/pages", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreatePageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;
  const slug = input.slug.trim().toLowerCase();

  const [existing] = await db
    .select({ slug: cmsPagesTable.slug })
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.slug, slug));
  if (existing) {
    res.status(409).json({ error: "A page with this URL slug already exists." });
    return;
  }

  await db.insert(cmsPagesTable).values({
    ...input,
    slug,
    heroImage: input.heroImage ?? null,
  });

  const [page] = await db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.slug, slug));
  if (!page) {
    res.status(500).json({ error: "The page could not be created." });
    return;
  }

  await cacheDel(cacheKeys.publishedPages);
  res.status(201).json(CreatePageResponse.parse(pageForApi(page)));
});

router.get("/cms/pages/:slug", async (req, res): Promise<void> => {
  const params = GetPageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const key = cacheKeys.page(params.data.slug);
  const cached = await cacheGet<ReturnType<typeof pageForApi>>(key);
  if (cached) {
    res.json(GetPageResponse.parse(cached));
    return;
  }

  const [page] = await db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.slug, params.data.slug));
  if (!page || !page.published) {
    res.status(404).json({ error: "Page not found." });
    return;
  }

  const payload = GetPageResponse.parse(pageForApi(page));
  await cacheSet(key, payload, cacheTtl.medium);
  res.json(payload);
});

router.patch("/cms/pages/:slug", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdatePageParams.safeParse(req.params);
  const parsed = UpdatePageBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select({ slug: cmsPagesTable.slug })
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.slug, params.data.slug));
  if (!existing) {
    res.status(404).json({ error: "Page not found." });
    return;
  }

  await db
    .update(cmsPagesTable)
    .set({
      ...parsed.data,
      slug: params.data.slug,
      heroImage: parsed.data.heroImage ?? null,
    })
    .where(eq(cmsPagesTable.slug, params.data.slug));

  const [page] = await db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.slug, params.data.slug));
  if (!page) {
    res.status(404).json({ error: "Page not found." });
    return;
  }

  await cacheDel(cacheKeys.publishedPages, cacheKeys.page(params.data.slug));
  res.json(UpdatePageResponse.parse(pageForApi(page)));
});

router.delete("/cms/pages/:slug", requireAdmin, async (req, res): Promise<void> => {
  const params = DeletePageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({ slug: cmsPagesTable.slug })
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.slug, params.data.slug));
  if (!existing) {
    res.status(404).json({ error: "Page not found." });
    return;
  }

  await db.delete(cmsPagesTable).where(eq(cmsPagesTable.slug, params.data.slug));
  await cacheDel(cacheKeys.publishedPages, cacheKeys.page(params.data.slug));
  res.status(204).end();
});

router.get("/events", async (_req, res): Promise<void> => {
  const events = await withCache(cacheKeys.publishedEvents, cacheTtl.short, async () => {
    const rows = await db
      .select()
      .from(communityEventsTable)
      .where(eq(communityEventsTable.published, true))
      .orderBy(asc(communityEventsTable.startsAt));
    return ListEventsResponse.parse(rows.map(eventForApi));
  });
  res.json(events);
});

router.post("/events", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;
  if (!isSafeHttpUrl(input.reportUrl ?? null)) {
    res.status(400).json({ error: "Report links must use HTTP or HTTPS." });
    return;
  }
  const id = randomUUID();
  await db.insert(communityEventsTable).values({
    ...input,
    id,
    startsAt: new Date(input.startsAt),
    reportUrl: input.reportUrl ?? null,
  });

  const [event] = await db
    .select()
    .from(communityEventsTable)
    .where(eq(communityEventsTable.id, id));
  if (!event) {
    res.status(500).json({ error: "The event could not be created." });
    return;
  }

  await cacheDel(cacheKeys.publishedEvents, cacheKeys.communitySummary);
  res.status(201).json(CreateEventResponse.parse(eventForApi(event)));
});

router.patch("/events/:eventId", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;
  if (!isSafeHttpUrl(input.reportUrl ?? null)) {
    res.status(400).json({ error: "Report links must use HTTP or HTTPS." });
    return;
  }

  const [existing] = await db
    .select({ id: communityEventsTable.id })
    .from(communityEventsTable)
    .where(eq(communityEventsTable.id, params.data.eventId));
  if (!existing) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  await db
    .update(communityEventsTable)
    .set({
      ...input,
      startsAt: new Date(input.startsAt),
      reportUrl: input.reportUrl ?? null,
    })
    .where(eq(communityEventsTable.id, params.data.eventId));

  const [event] = await db
    .select()
    .from(communityEventsTable)
    .where(eq(communityEventsTable.id, params.data.eventId));
  if (!event) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  await cacheDel(cacheKeys.publishedEvents, cacheKeys.communitySummary);
  res.json(UpdateEventResponse.parse(eventForApi(event)));
});

router.delete("/events/:eventId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({ id: communityEventsTable.id })
    .from(communityEventsTable)
    .where(eq(communityEventsTable.id, params.data.eventId));
  if (!existing) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  await db
    .delete(communityEventsTable)
    .where(eq(communityEventsTable.id, params.data.eventId));
  await cacheDel(cacheKeys.publishedEvents, cacheKeys.communitySummary);
  res.status(204).end();
});

router.get("/membership/tiers", async (_req, res): Promise<void> => {
  const tiers = await withCache(cacheKeys.membershipTiers, cacheTtl.medium, async () => {
    const rows = await db
      .select()
      .from(membershipTiersTable)
      .orderBy(asc(membershipTiersTable.createdAt));
    return ListMembershipTiersResponse.parse(rows);
  });
  res.json(tiers);
});

router.post("/membership/tiers", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateMembershipTierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = randomUUID();
  await db.insert(membershipTiersTable).values({ ...parsed.data, id });

  const [tier] = await db
    .select()
    .from(membershipTiersTable)
    .where(eq(membershipTiersTable.id, id));
  if (!tier) {
    res.status(500).json({ error: "The membership tier could not be created." });
    return;
  }

  await cacheDel(cacheKeys.membershipTiers);
  res.status(201).json(CreateMembershipTierResponse.parse(tier));
});

router.patch(
  "/membership/tiers/:tierId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateMembershipTierParams.safeParse(req.params);
    const parsed = UpdateMembershipTierBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select({ id: membershipTiersTable.id })
      .from(membershipTiersTable)
      .where(eq(membershipTiersTable.id, params.data.tierId));
    if (!existing) {
      res.status(404).json({ error: "Membership tier not found." });
      return;
    }

    await db
      .update(membershipTiersTable)
      .set(parsed.data)
      .where(eq(membershipTiersTable.id, params.data.tierId));

    const [tier] = await db
      .select()
      .from(membershipTiersTable)
      .where(eq(membershipTiersTable.id, params.data.tierId));
    if (!tier) {
      res.status(404).json({ error: "Membership tier not found." });
      return;
    }

    await cacheDel(cacheKeys.membershipTiers);
    res.json(UpdateMembershipTierResponse.parse(tier));
  },
);

router.delete(
  "/membership/tiers/:tierId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteMembershipTierParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select({ id: membershipTiersTable.id })
      .from(membershipTiersTable)
      .where(eq(membershipTiersTable.id, params.data.tierId));
    if (!existing) {
      res.status(404).json({ error: "Membership tier not found." });
      return;
    }

    await db
      .update(membershipTiersTable)
      .set({ active: false })
      .where(eq(membershipTiersTable.id, params.data.tierId));

    await cacheDel(cacheKeys.membershipTiers);
    res.status(204).end();
  },
);

router.post(
  "/membership/register",
  requireUser,
  async (req, res): Promise<void> => {
    const parsed = RegisterMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const userId = req.user!.id;

    const [existing] = await db
      .select({ id: membersTable.id })
      .from(membersTable)
      .where(eq(membersTable.userId, userId));
    if (existing) {
      res.status(409).json({ error: "A membership registration already exists." });
      return;
    }

    const [tier] = await db
      .select()
      .from(membershipTiersTable)
      .where(eq(membershipTiersTable.id, parsed.data.tierId));
    if (!tier || !tier.active) {
      res.status(400).json({ error: "Choose an available membership tier." });
      return;
    }
    if (!parsed.data.displayName.trim()) {
      res.status(400).json({ error: "Enter a name for your membership profile." });
      return;
    }
    if (tier.priceNgn > 0) {
      res.status(409).json({
        error:
          "This tier requires online payment, which is not connected yet. Choose a free tier or try again after payment setup.",
      });
      return;
    }
    if (parsed.data.shareWikiStats && parsed.data.wikiAccounts.length === 0) {
      res.status(400).json({
        error: "Add at least one Wikimedia username to enable contribution statistics.",
      });
      return;
    }

    const accounts: WikimediaAccount[] = parsed.data.shareWikiStats
      ? parsed.data.wikiAccounts
      : [];
    const id = randomUUID();
    await db.insert(membersTable).values({
      id,
      userId,
      displayName: parsed.data.displayName.trim(),
      location: parsed.data.location.trim(),
      tierId: tier.id,
      status: "pending",
      wikiAccounts: accounts,
      shareWikiStats: parsed.data.shareWikiStats,
    });

    const [member] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, id));
    if (!member) {
      res.status(500).json({ error: "The registration could not be saved." });
      return;
    }

    await cacheDel(cacheKeys.communitySummary, cacheKeys.communityContributors);
    res.status(201).json(RegisterMemberResponse.parse(memberForApi(member)));
  },
);

router.get("/member/me", requireUser, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.userId, userId));
  if (!member) {
    res.status(404).json({ error: "No membership registration exists." });
    return;
  }
  res.json(GetMyMembershipResponse.parse(memberForApi(member)));
});

router.get("/admin/members", requireAdmin, async (_req, res): Promise<void> => {
  const members = await db
    .select()
    .from(membersTable)
    .orderBy(asc(membersTable.createdAt));
  res.json(ListMembersResponse.parse(members.map(memberForApi)));
});

router.patch(
  "/admin/members/:memberId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateMemberParams.safeParse(req.params);
    const parsed = UpdateMemberBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (parsed.data.shareWikiStats === true) {
      res.status(400).json({ error: "A member must provide their own consent." });
      return;
    }

    const [existing] = await db
      .select({ id: membersTable.id })
      .from(membersTable)
      .where(eq(membersTable.id, params.data.memberId));
    if (!existing) {
      res.status(404).json({ error: "Member not found." });
      return;
    }

    const update =
      parsed.data.shareWikiStats === false
        ? { ...parsed.data, wikiAccounts: [] }
        : parsed.data;

    await db
      .update(membersTable)
      .set(update)
      .where(eq(membersTable.id, params.data.memberId));

    const [member] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, params.data.memberId));
    if (!member) {
      res.status(404).json({ error: "Member not found." });
      return;
    }

    await cacheDel(
      cacheKeys.communitySummary,
      cacheKeys.communityContributors,
      cacheKeys.memberStats(params.data.memberId),
    );
    res.json(UpdateMemberResponse.parse(memberForApi(member)));
  },
);

router.get("/community/summary", async (_req, res): Promise<void> => {
  const summary = await withCache(cacheKeys.communitySummary, cacheTtl.short, async () => {
    const [[memberCount], [eventCount]] = await Promise.all([
      db.select({ value: count() }).from(membersTable),
      db
        .select({ value: count() })
        .from(communityEventsTable)
        .where(eq(communityEventsTable.published, true)),
    ]);
    return GetCommunitySummaryResponse.parse({
      registeredMembers: memberCount?.value ?? 0,
      publishedEvents: eventCount?.value ?? 0,
      activeProjects: WIKIMEDIA_PROJECTS.length,
      projects: WIKIMEDIA_PROJECTS.map(({ id, labelEn, labelIg, url }) => ({
        id,
        labelEn,
        labelIg,
        url,
      })),
    });
  });
  res.json(summary);
});

router.get("/community/contributors", async (_req, res): Promise<void> => {
  const contributors = await withCache(
    cacheKeys.communityContributors,
    cacheTtl.short,
    async () => {
      const members = await db
        .select({
          id: membersTable.id,
          displayName: membersTable.displayName,
          wikiAccounts: membersTable.wikiAccounts,
        })
        .from(membersTable)
        .where(eq(membersTable.shareWikiStats, true))
        .orderBy(asc(membersTable.createdAt));

      const rows = await mapConcurrent(members, 3, async (member) => {
        const projects = await mapConcurrent(
          member.wikiAccounts,
          4,
          getProjectEditCount,
        );

        const byProjectMap = new Map<
          string,
          {
            project: string;
            contributions: number;
            available: boolean;
            accounts: string[];
          }
        >();
        for (const entry of projects) {
          const current = byProjectMap.get(entry.project) ?? {
            project: entry.project,
            contributions: 0,
            available: false,
            accounts: [],
          };
          current.contributions += entry.contributions;
          current.available = current.available || entry.available;
          current.accounts.push(entry.username);
          byProjectMap.set(entry.project, current);
        }

        return {
          memberId: member.id,
          displayName: member.displayName,
          projects,
          byProject: Array.from(byProjectMap.values()),
          totalContributions: projects.reduce(
            (total, project) => total + project.contributions,
            0,
          ),
        };
      });

      return GetCommunityContributorsResponse.parse(rows);
    },
  );
  res.json(contributors);
});

const editCountCache = new Map<
  string,
  { value: { contributions: number; available: boolean }; expiresAt: number }
>();
const EDIT_COUNT_CACHE_MS = 15 * 60 * 1000;
const UNAVAILABLE_CACHE_MS = 60 * 1000;

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workerCount = Math.min(items.length, Math.max(1, concurrency));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await mapper(items[index] as T);
      }
    }),
  );
  return results;
}

async function getProjectEditCount(
  account: WikimediaAccount,
): Promise<{
  project: string;
  username: string;
  contributions: number;
  available: boolean;
}> {
  const project = WIKIMEDIA_PROJECTS.find((candidate) => candidate.id === account.project);
  if (!project) {
    return {
      project: account.project,
      username: account.username,
      contributions: 0,
      available: false,
    };
  }
  const cacheKey = `${project.id}:${account.username.toLocaleLowerCase()}`;
  const now = Date.now();
  const cached = editCountCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { project: project.id, username: account.username, ...cached.value };
  }

  const search = new URLSearchParams({
    action: "query",
    list: "users",
    ususers: account.username,
    usprop: "editcount",
    format: "json",
    formatversion: "2",
  });
  try {
    const response = await fetch(`${project.api}?${search.toString()}`, {
      headers: {
        "User-Agent":
          process.env.WIKIMEDIA_USER_AGENT ??
          "IgboWikimediansCommunitySite/1.0 (Wikimedia community statistics)",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) {
      editCountCache.set(cacheKey, {
        value: { contributions: 0, available: false },
        expiresAt: now + UNAVAILABLE_CACHE_MS,
      });
      return {
        project: project.id,
        username: account.username,
        contributions: 0,
        available: false,
      };
    }
    const result = (await response.json()) as {
      query?: {
        users?: Array<{ name?: string; editcount?: number; missing?: boolean }>;
      };
    };
    const user = result.query?.users?.[0];
    const value = {
      contributions: user?.missing ? 0 : Number(user?.editcount ?? 0),
      available: Boolean(user && !user.missing),
    };
    editCountCache.set(cacheKey, {
      value,
      expiresAt: now + EDIT_COUNT_CACHE_MS,
    });
    return { project: project.id, username: account.username, ...value };
  } catch {
    editCountCache.set(cacheKey, {
      value: { contributions: 0, available: false },
      expiresAt: now + UNAVAILABLE_CACHE_MS,
    });
    return {
      project: project.id,
      username: account.username,
      contributions: 0,
      available: false,
    };
  }
}

router.get("/admin/wikimedia-stats", requireAdmin, async (_req, res): Promise<void> => {
  res.setHeader("Cache-Control", "private, no-store");
  const members = await db
    .select({
      id: membersTable.id,
      displayName: membersTable.displayName,
      wikiAccounts: membersTable.wikiAccounts,
    })
    .from(membersTable)
    .where(eq(membersTable.shareWikiStats, true))
    .orderBy(asc(membersTable.createdAt));

  const stats = await mapConcurrent(members, 3, async (member) => {
    const projects = await mapConcurrent(member.wikiAccounts, 4, getProjectEditCount);
    return {
      memberId: member.id,
      displayName: member.displayName,
      projects,
      totalContributions: projects.reduce(
        (total, project) => total + project.contributions,
        0,
      ),
    };
  });
  res.json(GetWikimediaStatsResponse.parse(stats));
});

router.get(
  "/member/wikimedia-stats",
  requireUser,
  async (req, res): Promise<void> => {
    const userId = req.user!.id;
    const [member] = await db
      .select({
        id: membersTable.id,
        displayName: membersTable.displayName,
        wikiAccounts: membersTable.wikiAccounts,
        shareWikiStats: membersTable.shareWikiStats,
      })
      .from(membersTable)
      .where(eq(membersTable.userId, userId));
    if (!member) {
      res.status(404).json({ error: "No membership registration exists." });
      return;
    }
    if (!member.shareWikiStats) {
      res.status(403).json({ error: "Contribution statistics are not enabled." });
      return;
    }

    res.setHeader("Cache-Control", "private, no-store");
    const stats = await withCache(
      cacheKeys.memberStats(member.id),
      cacheTtl.long,
      async () => {
        const projects = await Promise.all(member.wikiAccounts.map(getProjectEditCount));
        return GetWikimediaStatsResponse.parse([
          {
            memberId: member.id,
            displayName: member.displayName,
            projects,
            totalContributions: projects.reduce(
              (total, project) => total + project.contributions,
              0,
            ),
          },
        ]);
      },
    );
    res.json(stats);
  },
);

router.get("/site-settings", async (_req, res): Promise<void> => {
  const settings = await withCache(cacheKeys.siteSettings, cacheTtl.medium, async () => {
    const row = await getSiteSettings();
    return GetSiteSettingsResponse.parse(row);
  });
  res.json(settings);
});

router.patch("/site-settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;
  if (!isSafeHttpUrl(input.donationUrl ?? null)) {
    res.status(400).json({ error: "Donation links must use HTTP or HTTPS." });
    return;
  }

  const [existing] = await db
    .select({ id: siteSettingsTable.id })
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, "default"));

  if (existing) {
    await db
      .update(siteSettingsTable)
      .set({ ...input, donationUrl: input.donationUrl ?? null })
      .where(eq(siteSettingsTable.id, "default"));
  } else {
    await db
      .insert(siteSettingsTable)
      .values({ id: "default", ...input, donationUrl: input.donationUrl ?? null });
  }

  const [settings] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, "default"));
  if (!settings) {
    res.status(500).json({ error: "Site settings could not be saved." });
    return;
  }

  await cacheDel(cacheKeys.siteSettings);
  res.json(UpdateSiteSettingsResponse.parse(settings));
});

export default router;
