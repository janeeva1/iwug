const IGBO_API_BASE = "https://igboapi.com/api/v2";
const WIKTIONARY_API = "https://ig.wiktionary.org/w/api.php";

function userAgent(): string {
  return (
    process.env.WIKIMEDIA_USER_AGENT ??
    "IgboWikimediansCommunitySite/1.0 (Igbo dictionary)"
  );
}

export interface DictionaryExample {
  igbo: string;
  english: string | null;
}

export interface DictionaryEntry {
  word: string;
  pronunciation: string | null;
  audioUrl: string | null;
  definitions: string[];
  examples: DictionaryExample[];
  url: string | null;
}

export type DictionaryProvider = "igbo-api" | "wiktionary" | "none";

export interface DictionarySearchResult {
  query: string;
  provider: DictionaryProvider;
  entries: DictionaryEntry[];
}

interface IgboApiWord {
  word?: string;
  definitions?: unknown;
  examples?: unknown;
  pronunciation?: unknown;
}

/**
 * The Igbo API groups definitions by word class:
 * `definitions: [{ wordClass, definitions: string[] }]`.
 */
function flattenDefinitions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      out.push(item);
      continue;
    }
    if (item && typeof item === "object") {
      const nested = (item as Record<string, unknown>).definitions;
      if (Array.isArray(nested)) {
        for (const entry of nested) {
          if (typeof entry === "string") out.push(entry);
          else if (entry && typeof entry === "object") {
            const word = (entry as Record<string, unknown>).word;
            if (typeof word === "string") out.push(word);
          }
        }
      }
    }
  }
  return out.map((item) => item.trim()).filter((item) => item.length > 0);
}

function toIgboApiEntry(raw: IgboApiWord): DictionaryEntry | null {
  const word = typeof raw.word === "string" ? raw.word.trim() : "";
  if (!word) return null;

  const audioUrl =
    typeof raw.pronunciation === "string" && /^https?:\/\//.test(raw.pronunciation)
      ? raw.pronunciation
      : null;

  const examples: DictionaryExample[] = [];
  if (Array.isArray(raw.examples)) {
    for (const item of raw.examples) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const igbo = typeof record.igbo === "string" ? record.igbo.trim() : "";
      if (!igbo) continue;
      examples.push({
        igbo,
        english: typeof record.english === "string" ? record.english.trim() : null,
      });
    }
  }

  return {
    word,
    pronunciation: null,
    audioUrl,
    definitions: flattenDefinitions(raw.definitions),
    examples,
    url: null,
  };
}

async function searchIgboApi(query: string): Promise<DictionaryEntry[]> {
  const key = process.env.IGBO_API_KEY;
  if (!key) return [];
  const url = new URL(`${IGBO_API_BASE}/words`);
  url.search = new URLSearchParams({ keyword: query, examples: "true" }).toString();
  const response = await fetch(url, {
    headers: { "X-API-Key": key, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Igbo API responded ${response.status}`);
  const json = (await response.json()) as unknown;
  const list = Array.isArray(json)
    ? json
    : ((json as { data?: unknown }).data as unknown[] | undefined) ?? [];
  return list
    .map((item) => toIgboApiEntry((item ?? {}) as IgboApiWord))
    .filter((entry): entry is DictionaryEntry => entry !== null);
}

interface WiktPage {
  title?: string;
  extract?: string;
}

function toWiktionaryEntry(page: WiktPage): DictionaryEntry | null {
  const title = typeof page.title === "string" ? page.title.trim() : "";
  if (!title) return null;
  const extract = typeof page.extract === "string" ? page.extract : "";
  const definitions = extract
    .split(/\n+/)
    .map((line) => line.replace(/^[*#:\s]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 8);
  return {
    word: title,
    pronunciation: null,
    audioUrl: null,
    definitions,
    examples: [],
    url: `https://ig.wiktionary.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

async function searchWiktionary(query: string): Promise<DictionaryEntry[]> {
  const url = new URL(WIKTIONARY_API);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "5",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
  }).toString();
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent(), Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Wiktionary responded ${response.status}`);
  const json = (await response.json()) as { query?: { pages?: WiktPage[] } };
  return (json.query?.pages ?? [])
    .map(toWiktionaryEntry)
    .filter((entry): entry is DictionaryEntry => entry !== null);
}

/**
 * Searches the Igbo API when a key is configured, otherwise the keyless Igbo
 * Wiktionary. Whichever provider answers is reported back to the client.
 */
export async function searchDictionary(
  query: string,
): Promise<DictionarySearchResult> {
  const clean = query.trim();
  if (!clean) return { query: clean, provider: "none", entries: [] };

  if (process.env.IGBO_API_KEY) {
    try {
      const entries = await searchIgboApi(clean);
      if (entries.length) {
        return { query: clean, provider: "igbo-api", entries };
      }
    } catch {
      // Fall through to the keyless provider.
    }
  }

  try {
    const entries = await searchWiktionary(clean);
    return { query: clean, provider: entries.length ? "wiktionary" : "none", entries };
  } catch {
    return { query: clean, provider: "none", entries: [] };
  }
}
