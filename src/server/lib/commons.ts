const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

function userAgent(): string {
  return (
    process.env.WIKIMEDIA_USER_AGENT ??
    "IgboWikimediansCommunitySite/1.0 (Commons gallery)"
  );
}

interface CommonsImageInfo {
  url?: string;
  descriptionurl?: string;
  thumburl?: string;
  width?: number;
  height?: number;
  mime?: string;
  extmetadata?: Record<string, { value?: unknown } | undefined>;
}

interface CommonsPage {
  pageid?: number;
  title?: string;
  imageinfo?: CommonsImageInfo[];
  categoryinfo?: { files?: number };
}

interface CommonsQueryResponse {
  query?: { pages?: CommonsPage[] };
  continue?: { gcmcontinue?: string };
}

async function commonsGet(
  params: Record<string, string>,
): Promise<CommonsQueryResponse> {
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({ format: "json", formatversion: "2", ...params }).toString();
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent(), Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Commons API responded ${response.status}`);
  return (await response.json()) as CommonsQueryResponse;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
};

function stripHtml(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
  return text.length ? text : null;
}

export interface GalleryCategory {
  id: string;
  category: string;
  titleEn: string;
  titleIg: string;
  descriptionEn: string;
  descriptionIg: string;
  featured: boolean;
  files: number;
}

type GalleryCategoryDef = Omit<GalleryCategory, "files">;

export const GALLERY_CATEGORY_DEFS: GalleryCategoryDef[] = [
  { id: "user-group", category: "Igbo Wikimedians User Group", titleEn: "Igbo Wikimedians User Group", titleIg: "Otu Ndị Igbo Wikimedians", descriptionEn: "The whole body of work by the user group.", descriptionIg: "Ọrụ niile nke otu a.", featured: true },
  { id: "media-files", category: "Igbo Wikimedians User Group Media Files", titleEn: "Media files", titleIg: "Faịlụ mgbasa ozi", descriptionEn: "Photographs, audio and video contributed by members.", descriptionIg: "Foto, ụda na vidiyo ndị otu nyere.", featured: true },
  { id: "say-it-right-phrasebook", category: "Say it right 2025 (Igbo phrasebook edition)", titleEn: "Say It Right — Igbo phrasebook", titleIg: "Kwuo Ya Ziri Ezi — akwụkwọ nkịtị Igbo", descriptionEn: "Pronunciation recordings for an Igbo phrasebook.", descriptionIg: "Ndekọ ụda maka akwụkwọ nkịtị Igbo.", featured: true },
  { id: "say-it-right", category: "Say It Right 2025", titleEn: "Say It Right 2025", titleIg: "Kwuo Ya Ziri Ezi 2025", descriptionEn: "The community pronunciation drive.", descriptionIg: "Mgbasa ozi ịkpọ okwu nke obodo.", featured: true },
  { id: "fan-club-imsu", category: "Igbo Wiki Fan Club Imo State University", titleEn: "Igbo Wiki Fan Club, IMSU", titleIg: "Igbo Wiki Fan Club, IMSU", descriptionEn: "Campus activities at Imo State University.", descriptionIg: "Ihe omume ụlọ akwụkwọ na IMSU.", featured: false },
  { id: "meet-up", category: "Igbo Wikimedians User Group Meet-up", titleEn: "Meet-ups", titleIg: "Nzukọ", descriptionEn: "Community meet-ups and gatherings.", descriptionIg: "Nzukọ na mkpakọrịta obodo.", featured: false },
  { id: "launch", category: "Igbo Wikimedians User Group Launch", titleEn: "Launch", titleIg: "Mmalite", descriptionEn: "The official launch of the user group.", descriptionIg: "Mmalite gọọmenti nke otu a.", featured: false },
  { id: "shutterbug", category: "IG Commons Shutterbug Project", titleEn: "IG Commons Shutterbug", titleIg: "IG Commons Shutterbug", descriptionEn: "Photography training and photowalks.", descriptionIg: "Ọzụzụ foto na njegharị foto.", featured: false },
  { id: "challenge", category: "Igbo Wikipedia Challenge", titleEn: "Igbo Wikipedia Challenge", titleIg: "Mkpọkụta Wikipedia Igbo", descriptionEn: "Editing challenges on Igbo Wikipedia.", descriptionIg: "Mkpọkụta idezi na Wikipedia Igbo.", featured: false },
  { id: "wm22", category: "Wikimania22 in Nigeria", titleEn: "Wikimania 2022 in Nigeria", titleIg: "Wikimania 2022 na Naịjirịa", descriptionEn: "Wikimedia's global gathering, locally.", descriptionIg: "Nnukwu nzukọ Wikimedia n'òtù obodo.", featured: false },
  { id: "wikidata-10", category: "Wikidata's 10th birthday Igwikidatahub", titleEn: "Wikidata 10th birthday", titleIg: "Ụbọchị ọmụmụ Wikidata nke iri", descriptionEn: "The Wikidata anniversary edit-a-thon.", descriptionIg: "Emume ncheta Wikidata.", featured: false },
  { id: "storytelling", category: "Igbo Storytelling Project", titleEn: "Igbo storytelling", titleIg: "Ịkọ akụkọ Igbo", descriptionEn: "Recorded Igbo stories and folklore.", descriptionIg: "Akụkọ na akụkọ ifo Igbo e dekọrọ.", featured: false },
  { id: "love-folklore", category: "Wiki Loves Folklore in the Igbo Community", titleEn: "Wiki Loves Folklore", titleIg: "Wiki Loves Folklore", descriptionEn: "Igbo folklore documented for the contest.", descriptionIg: "Akụkọ ifo Igbo e dekọrọ maka asọmpi.", featured: false },
  { id: "igbo-culture", category: "Igbo culture", titleEn: "Igbo culture", titleIg: "Ọdịbendị Igbo", descriptionEn: "Traditions, ceremony and daily life.", descriptionIg: "Omenala, emume na ndụ ụbọchị.", featured: true },
  { id: "igbo-people", category: "Igbo people", titleEn: "Igbo people", titleIg: "Ndị Igbo", descriptionEn: "Portraits and communities of Igbo people.", descriptionIg: "Foto na obodo ndị Igbo.", featured: false },
  { id: "igbo-language", category: "Igbo language", titleEn: "Igbo language", titleIg: "Asụsụ Igbo", descriptionEn: "Writing, signage and language materials.", descriptionIg: "Ederede na ihe gbasara asụsụ Igbo.", featured: false },
  { id: "igbo-cuisine", category: "Igbo cuisine", titleEn: "Igbo cuisine", titleIg: "Nri Igbo", descriptionEn: "Food, preparation and dishes.", descriptionIg: "Nri, nkwadebe na efere.", featured: false },
];

const CATEGORY_BY_ID = new Map(GALLERY_CATEGORY_DEFS.map((entry) => [entry.id, entry]));

export function galleryCategoryById(id: string): GalleryCategoryDef | undefined {
  return CATEGORY_BY_ID.get(id);
}

export interface CommonsMediaItem {
  pageId: number;
  title: string;
  descriptionUrl: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  mime: string;
  artist: string | null;
  credit: string | null;
  license: string | null;
  caption: string | null;
}

export interface GalleryMediaPage {
  category: string;
  items: CommonsMediaItem[];
  nextCursor: string | null;
}

function cleanUploadUrl(raw: string): string {
  return raw.split("?")[0] ?? raw;
}

function toMediaItem(page: CommonsPage): CommonsMediaItem | null {
  const info = page.imageinfo?.[0];
  if (!info?.url) return null;
  const mime = String(info.mime ?? "");
  // The gallery is an image carousel; skip audio/video/documents (e.g. .ogg, .webm).
  if (!mime.startsWith("image/")) return null;
  if (!info.thumburl && !info.url) return null;
  const meta = info.extmetadata ?? {};
  return {
    pageId: Number(page.pageid ?? 0),
    title: String(page.title ?? "").replace(/^File:/, ""),
    descriptionUrl: String(info.descriptionurl ?? ""),
    url: String(info.url),
    thumbUrl: cleanUploadUrl(String(info.thumburl ?? info.url)),
    width: Number(info.width ?? 0),
    height: Number(info.height ?? 0),
    mime,
    artist: stripHtml(meta.Artist?.value),
    credit: stripHtml(meta.Credit?.value),
    license: stripHtml(meta.LicenseShortName?.value),
    caption: stripHtml(meta.ImageDescription?.value ?? meta.ObjectName?.value),
  };
}

/** Curated categories, annotated with file counts from a single Commons request. */
export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  const counts = new Map<string, number>();
  try {
    const data = await commonsGet({
      action: "query",
      prop: "categoryinfo",
      titles: GALLERY_CATEGORY_DEFS.map((def) => `Category:${def.category}`).join("|"),
    });
    for (const page of data.query?.pages ?? []) {
      const name = String(page.title ?? "").replace(/^Category:/, "");
      counts.set(name, Number(page.categoryinfo?.files ?? 0));
    }
  } catch {
    // Categories still render without counts when the API is unreachable.
  }
  return GALLERY_CATEGORY_DEFS.map((def) => ({
    ...def,
    files: counts.get(def.category) ?? 0,
  }));
}

/** A page of media from a curated Commons category. */
export async function getCategoryMedia(
  category: string,
  cursor: string | undefined,
  limit: number,
): Promise<GalleryMediaPage> {
  const params: Record<string, string> = {
    action: "query",
    generator: "categorymembers",
    gcmtitle: `Category:${category}`,
    gcmtype: "file",
    gcmlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1280",
  };
  if (cursor) params.gcmcontinue = cursor;

  let data: CommonsQueryResponse;
  try {
    data = await commonsGet(params);
  } catch {
    return { category, items: [], nextCursor: null };
  }

  const pages = Array.isArray(data.query?.pages) ? data.query.pages : [];
  const items = pages
    .map((page) => toMediaItem(page))
    .filter((item): item is CommonsMediaItem => item !== null);

  return {
    category,
    items,
    nextCursor: data.continue?.gcmcontinue ?? null,
  };
}
