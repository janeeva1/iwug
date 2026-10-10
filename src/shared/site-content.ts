/**
 * Site content model shared by the server (seed + validation) and the client
 * (fallbacks + rendering). All editorial copy shown on the public site is
 * described here and stored in the `site_content` table so it can be managed
 * from the CMS.
 *
 * Scalar copy is keyed by its original English source string: the `t()`
 * helper in the client looks up an override by the English literal passed at
 * the call site, so no call site needs to change when a translation is edited.
 */
import { scalarContentDefaults } from "./site-content.generated";

export interface LocalizedText {
  en: string;
  ig: string;
}

/** A single editable, bilingual string. */
export interface SiteContentField {
  id: string;
  /** Group id (see `contentGroupLabels`), used to organise the CMS editor. */
  group: string;
  /** Original English literal; the runtime lookup key on the client. */
  source: string;
  en: string;
  ig: string;
}

export interface CollectionColumn {
  key: string;
  label: string;
  multiline?: boolean;
}

/** A repeatable, bilingual list of items (projects, photos, timeline…). */
export interface SiteCollection {
  id: string;
  group: string;
  label: string;
  itemLabel: string;
  columns: CollectionColumn[];
  items: Record<string, string>[];
}

export const contentGroupLabels: Record<string, LocalizedText> = {
  SiteHeader: { en: "Header", ig: "Isi" },
  SiteFooter: { en: "Footer", ig: "Ụkwụ" },
  HomePage: { en: "Home page", ig: "Peeji ụlọ" },
  CommonsStory: { en: "Home · Culture", ig: "Ụlọ · Ọdịbendị" },
  ProjectsPage: { en: "Projects page", ig: "Peeji ọrụ" },
  EventsPage: { en: "Events page", ig: "Peeji mmemme" },
  CommunityPage: { en: "Contributors page", ig: "Peeji ndị nyere aka" },
  GalleryPage: { en: "Gallery page", ig: "Peeji ọba foto" },
  DictionaryPage: { en: "Dictionary page", ig: "Peeji nkọwa okwu" },
  JoinPage: { en: "Join page", ig: "Peeji isonye" },
  DonatePage: { en: "Donate page", ig: "Peeji onyinye" },
  SignInForm: { en: "Sign in", ig: "Nbanye" },
  SignUpForm: { en: "Sign up", ig: "Ndebanye aha" },
  SignInPage: { en: "Sign-in screen", ig: "Ihu nbata" },
  SignUpPage: { en: "Sign-up screen", ig: "Ihu ndebanye" },
  CompleteProfilePage: { en: "Complete profile", ig: "Mezue profaịlụ" },
  MemberPage: { en: "Member space", ig: "Oghere ndị otu" },
  Protected: { en: "Members only", ig: "Naanị ndị otu" },
  NotFoundView: { en: "Not found", ig: "Ahụghị" },
  ProviderButtons: { en: "Sign-in providers", ig: "Ndị na-enye nbata" },
  WikimediaRefreshButton: { en: "Wikimedia refresh", ig: "Megharịa Wikimedia" },
  Wordmark: { en: "Wordmark", ig: "Akara okwu" },
  General: { en: "General", ig: "N'ozuzu" },
};

export const collectionGroupLabels: Record<string, LocalizedText> = {
  Projects: { en: "Wikimedia projects", ig: "Ọrụ Wikimedia" },
  Home: { en: "Home page", ig: "Peeji ụlọ" },
};

const projectColumns: CollectionColumn[] = [
  { key: "id", label: "ID (slug)" },
  { key: "label_en", label: "Short label · English" },
  { key: "label_ig", label: "Short label · Igbo" },
  { key: "name", label: "Full name" },
  { key: "mark", label: "Glyph / mark" },
  { key: "url", label: "Project URL" },
  { key: "user_base", label: "User page URL prefix" },
  { key: "detail_en", label: "Description · English", multiline: true },
  { key: "detail_ig", label: "Description · Igbo", multiline: true },
];

const photoColumns: CollectionColumn[] = [
  { key: "src", label: "Image URL" },
  { key: "title_en", label: "Title · English" },
  { key: "title_ig", label: "Title · Igbo" },
  { key: "alt_en", label: "Alt text · English", multiline: true },
  { key: "alt_ig", label: "Alt text · Igbo", multiline: true },
  { key: "author", label: "Author / credit" },
  { key: "file", label: "Commons file page URL" },
];

const timelineColumns: CollectionColumn[] = [
  { key: "year", label: "Year" },
  { key: "title_en", label: "Title · English" },
  { key: "title_ig", label: "Title · Igbo" },
  { key: "body_en", label: "Text · English", multiline: true },
  { key: "body_ig", label: "Text · Igbo", multiline: true },
];

export const siteCollections: SiteCollection[] = [
  {
    id: "projects",
    group: "Projects",
    label: "Wikimedia projects",
    itemLabel: "project",
    columns: projectColumns,
    items: [
      { id: "igwiki", label_en: "Wikipedia", label_ig: "Wikipedia", name: "Igbo Wikipedia", mark: "W", url: "https://ig.wikipedia.org", user_base: "https://ig.wikipedia.org/wiki/User:", detail_en: "Build a free encyclopedia in Igbo.", detail_ig: "Wepụta ihe ọmụma n’asụsụ Igbo." },
      { id: "igwikt", label_en: "Wiktionary", label_ig: "Wiktionary", name: "Igbo Wiktionary", mark: "D", url: "https://ig.wiktionary.org", user_base: "https://ig.wiktionary.org/wiki/User:", detail_en: "Document words, meanings and how they are used.", detail_ig: "Chekwaa okwu, nkọwa na otú e si eji ha." },
      { id: "wikidata", label_en: "Wikidata", label_ig: "Wikidata", name: "Wikidata", mark: "Q", url: "https://www.wikidata.org", user_base: "https://www.wikidata.org/wiki/User:", detail_en: "Structure knowledge about Igbo people and the world.", detail_ig: "Hazie ihe ọmụma gbasara ndị Igbo na ụwa ha." },
      { id: "commons", label_en: "Commons", label_ig: "Commons", name: "Wikimedia Commons", mark: "C", url: "https://commons.wikimedia.org", user_base: "https://commons.wikimedia.org/wiki/User:", detail_en: "Share freely licensed photographs, audio and media.", detail_ig: "Kesaa foto, ụda na ihe onyonyo nwere ikike efu." },
      { id: "igwikiquote", label_en: "Wikiquote", label_ig: "Wikiquote", name: "Igbo Wikiquote", mark: "“", url: "https://ig.wikiquote.org", user_base: "https://ig.wikiquote.org/wiki/User:", detail_en: "Collect notable quotations and sayings.", detail_ig: "Kpọkọta okwu amamihe na nkwupụta ndị ama ama." },
      { id: "wikifunctions", label_en: "Wikifunctions", label_ig: "Wikifunctions", name: "Wikifunctions", mark: "ƒ", url: "https://www.wikifunctions.org", user_base: "https://www.wikifunctions.org/wiki/User:", detail_en: "Build a library of functions anyone can use.", detail_ig: "Wuo ọrụ koodu nke asụsụ niile na-eji." },
      { id: "enwiki", label_en: "English Wikipedia", label_ig: "Wikipedia Bekee", name: "English Wikipedia", mark: "W", url: "https://en.wikipedia.org", user_base: "https://en.wikipedia.org/wiki/User:", detail_en: "Improve and expand knowledge about Igbo people in English.", detail_ig: "Mezi ma gbasaa ihe ọmụma gbasara ndị Igbo n’Bekee." },
      { id: "wikisource", label_en: "Wikisource", label_ig: "Wikisource", name: "Wikisource", mark: "S", url: "https://wikisource.org", user_base: "https://wikisource.org/wiki/User:", detail_en: "Preserve free books and source texts.", detail_ig: "Chekwaa akwụkwọ na ederede n’efu." },
      { id: "meta", label_en: "Meta-Wiki", label_ig: "Meta-Wiki", name: "Meta-Wiki", mark: "M", url: "https://meta.wikimedia.org", user_base: "https://meta.wikimedia.org/wiki/User:", detail_en: "Coordinate Wikimedia projects and community work.", detail_ig: "Hazie ọrụ Wikimedia na mmekọrịta obodo." },
    ],
  },
  {
    id: "home_photos",
    group: "HomePage",
    label: "Culture photos",
    itemLabel: "photo",
    columns: photoColumns,
    items: [
      { src: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Igbo_Masquerade_in_Ezeagu.jpg", title_en: "Igbo masquerade in Ezeagu", title_ig: "Mmanwụ ndị Igbo na Ezeagu", alt_en: "Igbo masquerade in Ezeagu", alt_ig: "Mmanwụ ndị Igbo na Ezeagu", author: "Chuks Zilo", file: "https://commons.wikimedia.org/wiki/File:Igbo_Masquerade_in_Ezeagu.jpg" },
      { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Lagos_Igbo_Hangout_3.0_at_Festac%2C_Lagos_52.jpg/1280px-Lagos_Igbo_Hangout_3.0_at_Festac%2C_Lagos_52.jpg", title_en: "Lagos Igbo Hangout in Festac", title_ig: "Nzukọ ndị Igbo na Festac, Lagos", alt_en: "Lagos Igbo Hangout 3.0 at Festac, Lagos", alt_ig: "Nzukọ ndị Igbo na Festac, Lagos", author: "MediaMOF", file: "https://commons.wikimedia.org/wiki/File:Lagos_Igbo_Hangout_3.0_at_Festac,_Lagos_52.jpg" },
    ],
  },
  {
    id: "home_timeline",
    group: "HomePage",
    label: "Timeline",
    itemLabel: "milestone",
    columns: timelineColumns,
    items: [
      { year: "2016", title_en: "Organized work began", title_ig: "Ọrụ haziri ahazi bidoro", body_en: "Volunteers came together to build Igbo-language content across Wikimedia.", body_ig: "Ndị ọrụ afọ ofufo jikọtara ọnụ iji wuo ọdịnaya Igbo na Wikimedia." },
      { year: "2018", title_en: "Recognized as a Wikimedia User Group", title_ig: "Nkwenye dịka Wikimedia User Group", body_en: "The community dossier records Wikimedia recognition in this year.", body_ig: "Akụkọ obodo kwuru na Wikimedia nyere otu a nkwenye n’afọ a." },
    ],
  },
];

/** Lookup from an English source literal to its current localized value. */
export type ContentLookup = Record<string, LocalizedText>;

export function buildContentLookup(
  fields: SiteContentField[],
  overrides: Record<string, { en: string; ig: string }> = {},
): ContentLookup {
  const lookup: ContentLookup = {};
  for (const field of fields) {
    const override = overrides[field.id];
    lookup[field.source] = override
      ? { en: override.en, ig: override.ig }
      : { en: field.en, ig: field.ig };
  }
  return lookup;
}

export function buildCollectionOverride(
  overrides: Record<string, { items?: Record<string, string>[] }>,
): Record<string, Record<string, string>[]> {
  const result: Record<string, Record<string, string>[]> = {};
  for (const collection of siteCollections) {
    const override = overrides[collection.id];
    result[collection.id] = override?.items ?? collection.items;
  }
  return result;
}

export { scalarContentDefaults };
