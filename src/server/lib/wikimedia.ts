const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ??
  "IgboWikimediansCommunitySite/1.0 (https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group)";

const META_API = "https://meta.wikimedia.org/w/api.php";

/** The minimum global edit count required to be considered a contributor. */
export const MIN_WIKIMEDIA_EDITS = 1;

async function mediaWikiGet(
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(META_API);
  url.search = new URLSearchParams({
    format: "json",
    formatversion: "2",
    ...params,
  }).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Wikimedia API responded ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export interface WikimediaUsernameSuggestion {
  name: string;
  id: number;
}

/**
 * Prefix-searches the Wikimedia global (CentralAuth) account directory.
 * This is how a member finds their own Wikimedia username while registering.
 */
export async function searchWikimediaUsernames(
  prefix: string,
  limit = 8,
): Promise<WikimediaUsernameSuggestion[]> {
  const query = prefix.trim();
  if (!query) return [];
  const capped = query.charAt(0).toUpperCase() + query.slice(1);
  const data = (await mediaWikiGet({
    action: "query",
    list: "globalallusers",
    aguprefix: capped,
    agulimit: String(Math.min(Math.max(limit, 1), 20)),
  })) as {
    query?: { globalallusers?: Array<{ id: number; name: string }> };
  };
  return (data.query?.globalallusers ?? []).map((user) => ({
    name: String(user.name),
    id: Number(user.id),
  }));
}

export interface WikimediaProjectContribution {
  wiki: string;
  url: string;
  editCount: number;
}

export interface WikimediaAccountInfo {
  username: string;
  exists: boolean;
  id: string | null;
  editCount: number;
  homeWiki: string | null;
  registration: string | null;
  projects: WikimediaProjectContribution[];
  verified: boolean;
}

const MISSING: WikimediaAccountInfo = {
  username: "",
  exists: false,
  id: null,
  editCount: 0,
  homeWiki: null,
  registration: null,
  projects: [],
  verified: false,
};

/**
 * Looks up a Wikimedia global account and returns its edit count and the
 * list of wikis it has edited. Used to verify that a registering member is a
 * real Wikimedia contributor.
 */
export async function getWikimediaAccount(
  username: string,
): Promise<WikimediaAccountInfo> {
  const clean = username.trim().replace(/^User:/i, "");
  if (!clean) return { ...MISSING };
  const data = (await mediaWikiGet({
    action: "query",
    meta: "globaluserinfo",
    guiuser: clean,
    guiprop: "merged|editcount|groups",
  })) as {
    query?: {
      globaluserinfo?: {
        name: string;
        id: number;
        home?: string;
        registration?: string;
        editcount?: number;
        merged?: Array<{
          wiki: string;
          url?: string;
          editcount?: number;
        }>;
      };
    };
  };

  const info = data.query?.globaluserinfo;
  if (!info) return { ...MISSING, username: clean };

  const projects: WikimediaProjectContribution[] = (info.merged ?? []).map(
    (entry) => ({
      wiki: String(entry.wiki),
      url: String(entry.url ?? ""),
      editCount: Number(entry.editcount ?? 0),
    }),
  );
  const editCount = Number(
    info.editcount ?? projects.reduce((sum, item) => sum + item.editCount, 0),
  );

  return {
    username: String(info.name),
    exists: true,
    id: String(info.id),
    editCount,
    homeWiki: info.home ? String(info.home) : null,
    registration: info.registration ? String(info.registration) : null,
    projects,
    verified: editCount >= MIN_WIKIMEDIA_EDITS,
  };
}
