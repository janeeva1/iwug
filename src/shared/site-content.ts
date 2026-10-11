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
  Organisation: { en: "Organisation", ig: "Ọgbakọ" },
  Links: { en: "Links & social", ig: "Njikọ na soshal" },
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

const teamColumns: CollectionColumn[] = [
  { key: "name", label: "Name" },
  { key: "role_en", label: "Role · English" },
  { key: "role_ig", label: "Role · Igbo" },
  { key: "group_en", label: "Group · English" },
  { key: "group_ig", label: "Group · Igbo" },
  { key: "profile_url", label: "Profile URL" },
];

const socialColumns: CollectionColumn[] = [
  { key: "label", label: "Label" },
  { key: "url", label: "URL" },
];

const partnerColumns: CollectionColumn[] = [
  { key: "name", label: "Name" },
  { key: "url", label: "Website URL" },
  { key: "description_en", label: "Note · English", multiline: true },
  { key: "description_ig", label: "Note · Igbo", multiline: true },
];

const reportColumns: CollectionColumn[] = [
  { key: "label_en", label: "Label · English" },
  { key: "label_ig", label: "Label · Igbo" },
  { key: "url", label: "URL" },
];

const grantColumns: CollectionColumn[] = [
  { key: "label_en", label: "Label · English" },
  { key: "label_ig", label: "Label · Igbo" },
  { key: "period", label: "Period / note" },
  { key: "url", label: "URL" },
];

const hubColumns: CollectionColumn[] = [
  { key: "name", label: "Name" },
  { key: "location_en", label: "Location · English" },
  { key: "location_ig", label: "Location · Igbo" },
  { key: "url", label: "URL" },
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
      { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Lagos_Igbo_Hangout_3.0_at_Festac%2C_Lagos_52.jpg/1280px-Lagos_Igbo_Hangout_3.0_at_Festac%2C_Lagos_52.jpg", title_en: "Lagos Igbo Hangout in Festac", title_ig: "Nzukọ ndị Igbo na Festac, Lagos", alt_en: "Lagos Igbo Hangout 3.0 at Festac, Lagos", alt_ig: "Nzukọ ndị Igbo na Festac, Lagos", author: "MediaMOF", file: "https://commons.wikimedia.org/wiki/File:Lagos_Igbo_Hangout_3.0_at_Festac,_Lagos_52.jpg" },
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
  {
    id: "team",
    group: "Organisation",
    label: "Community leads & members",
    itemLabel: "person",
    columns: teamColumns,
    items: [
      { name: "Ozurumba Uzoma", role_en: "Founding member", role_ig: "Onye guzobere", group_en: "Founding members", group_ig: "Ndị guzobere", profile_url: "https://meta.wikimedia.org/wiki/User:Uzoma_Ozurumba" },
      { name: "Tochi Precious", role_en: "Founding member", role_ig: "Onye guzobere", group_en: "Founding members", group_ig: "Ndị guzobere", profile_url: "https://meta.wikimedia.org/wiki/User:Tochiprecious" },
      { name: "Blossom Ozurumba", role_en: "Founding member", role_ig: "Onye guzobere", group_en: "Founding members", group_ig: "Ndị guzobere", profile_url: "https://meta.wikimedia.org/wiki/User:Blossom_Ozurumba" },
      { name: "Oby Ezeilo", role_en: "Founding member", role_ig: "Onye guzobere", group_en: "Founding members", group_ig: "Ndị guzobere", profile_url: "https://meta.wikimedia.org/wiki/User:Oby_Ezeilo" },
      { name: "Tochi Precious", role_en: "Designated contact for the Wikimedia Foundation", role_ig: "Onye nnọchite anya Wikimedia Foundation", group_en: "Designated contacts", group_ig: "Ndị nnọchite anya", profile_url: "https://meta.wikimedia.org/wiki/User:Tochiprecious" },
      { name: "Blossom Ozurumba", role_en: "Designated contact for the Wikimedia Foundation", role_ig: "Onye nnọchite anya Wikimedia Foundation", group_en: "Designated contacts", group_ig: "Ndị nnọchite anya", profile_url: "https://meta.wikimedia.org/wiki/User:Blossom_Ozurumba" },
      { name: "Lucy Iwuala", role_en: "Lead", role_ig: "Onye ndu", group_en: "Programs team", group_ig: "Otu mmemme", profile_url: "https://meta.wikimedia.org/wiki/User:Lucy_Iwuala" },
      { name: "Tochi Precious", role_en: "Member", role_ig: "Onye otu", group_en: "Programs team", group_ig: "Otu mmemme", profile_url: "https://meta.wikimedia.org/wiki/User:Tochiprecious" },
      { name: "Hilary Ogali", role_en: "Member", role_ig: "Onye otu", group_en: "Programs team", group_ig: "Otu mmemme", profile_url: "https://meta.wikimedia.org/wiki/User:Ogalihillary" },
      { name: "Mark Lapang", role_en: "Member", role_ig: "Onye otu", group_en: "Programs team", group_ig: "Otu mmemme", profile_url: "https://meta.wikimedia.org/wiki/User:Macocobovi" },
      { name: "Chikerenma Ndubuka", role_en: "Lead", role_ig: "Onye ndu", group_en: "Communications team", group_ig: "Otu nzikọrịta ozi", profile_url: "https://meta.wikimedia.org/wiki/User:Keremzy" },
      { name: "Christian Martins", role_en: "Member", role_ig: "Onye otu", group_en: "Communications team", group_ig: "Otu nzikọrịta ozi", profile_url: "https://meta.wikimedia.org/wiki/User:Matino183" },
      { name: "Amarachi Doris", role_en: "Member", role_ig: "Onye otu", group_en: "Communications team", group_ig: "Otu nzikọrịta ozi", profile_url: "https://meta.wikimedia.org/wiki/User:Aminwa_21" },
      { name: "Senator Choko", role_en: "Lead", role_ig: "Onye ndu", group_en: "Events & calendar team", group_ig: "Otu mmemme na kalenda", profile_url: "https://meta.wikimedia.org/wiki/User:Senator_Choko" },
      { name: "Agnes Abah", role_en: "Member", role_ig: "Onye otu", group_en: "Events & calendar team", group_ig: "Otu mmemme na kalenda", profile_url: "https://meta.wikimedia.org/wiki/User:AgnesAbah" },
      { name: "Ceslause Ogbonnaya", role_en: "Lead", role_ig: "Onye ndu", group_en: "Partnerships team", group_ig: "Otu mmekọ", profile_url: "https://meta.wikimedia.org/wiki/User:Ceslause" },
      { name: "Sayvhior", role_en: "Member", role_ig: "Onye otu", group_en: "Partnerships team", group_ig: "Otu mmekọ", profile_url: "https://meta.wikimedia.org/wiki/User:Sayvhior" },
      { name: "Accuratecy051", role_en: "Member", role_ig: "Onye otu", group_en: "Partnerships team", group_ig: "Otu mmekọ", profile_url: "https://meta.wikimedia.org/wiki/User:Accuratecy051" },
    ],
  },
  {
    id: "social_links",
    group: "Links",
    label: "Social media & website",
    itemLabel: "link",
    columns: socialColumns,
    items: [
      { label: "Website", url: "http://www.wikimediaigbo.org/" },
      { label: "Email", url: "mailto:ndewo@wikimediaigbo.org" },
      { label: "Facebook", url: "https://www.facebook.com/wikimediaigbo/" },
      { label: "X (Twitter)", url: "http://twitter.com/wikimediaigbo/" },
      { label: "Instagram", url: "http://www.instagram.com/wikimediaigbo/" },
      { label: "LinkedIn", url: "https://www.linkedin.com/company/wikimediaigbo/" },
      { label: "Telegram", url: "https://t.me/+ghpV_xCNGlQ4ZTlk/" },
      { label: "WhatsApp", url: "https://chat.whatsapp.com/HVzLpLjIYmiE3v5uPLgEqP/" },
    ],
  },
  {
    id: "partners",
    group: "Organisation",
    label: "Partners & collaborators",
    itemLabel: "partner",
    columns: partnerColumns,
    items: [
      { name: "Global GLAM Calls", url: "https://meta.wikimedia.org/wiki/Global_GLAM_calls", description_en: "International galleries, libraries, archives and museums community.", description_ig: "Obodo mba ụwa nke ụlọ ngosi, ọba akwụkwọ, ebe nchekwa na ụlọ ihe ngosi nka." },
      { name: "CapX", url: "https://capx.toolforge.org/home", description_en: "Capacity-building exchange for Wikimedia communities.", description_ig: "Ebe mmụta na ike inweta maka obodo Wikimedia." },
      { name: "Rising Voices", url: "https://rising.globalvoices.org/", description_en: "Supporting citizen media in under-represented languages.", description_ig: "Na-akwado mgbasa ozi ụmụ amaala n’asụsụ ndị a na-adịghị ahụkarị." },
      { name: "Global Voices", url: "https://globalvoices.org/", description_en: "A borderless community of writers, translators and researchers.", description_ig: "Obodo ndị ode akwụkwọ, ndị ntụgharị na ndị nyocha na-enweghị oke." },
      { name: "Wikimedia Deutschland", url: "https://www.wikimedia.de", description_en: "Wikimedia chapter in Germany.", description_ig: "Ngalaba Wikimedia dị na Germany." },
      { name: "Mira Foundation", url: "", description_en: "Community partner.", description_ig: "Mmekọ obodo." },
      { name: "Cavic Nigeria", url: "", description_en: "Community partner and host of our Abuja space.", description_ig: "Mmekọ obodo na ebe anyị na Abuja." },
      { name: "Adandiigbo Cultural Pageant", url: "", description_en: "Igbo cultural heritage partner.", description_ig: "Mmekọ ihe nketa ọdịbendị Igbo." },
      { name: "Anambra State Ministry of Information and Public Enlightenment", url: "", description_en: "Government partner in Anambra State.", description_ig: "Mmekọ gọọmentị nke Anambra Steeti." },
      { name: "Digipreneur Hub", url: "", description_en: "Digital skills partner.", description_ig: "Mmekọ nkà dijitalụ." },
      { name: "Centre for Memories", url: "", description_en: "Igbo heritage and archive partner.", description_ig: "Mmekọ ihe nketa na ebe nchekwa Igbo." },
      { name: "Equity Watch Initiative", url: "", description_en: "Civic partner.", description_ig: "Mmekọ obodo na ikike mmadụ." },
    ],
  },
  {
    id: "reports",
    group: "Organisation",
    label: "Annual reports",
    itemLabel: "report",
    columns: reportColumns,
    items: [
      { label_en: "2024/2025 report", label_ig: "Akụkọ 2024/2025", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group_-_Annual_Report_2024/2025" },
      { label_en: "2023/2024 report", label_ig: "Akụkọ 2023/2024", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group_-_Annual_Report_2023/2024" },
      { label_en: "2022/2023 report", label_ig: "Akụkọ 2022/2023", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group_-_Annual_Report_2022/2023" },
      { label_en: "2021/2022 report", label_ig: "Akụkọ 2021/2022", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group_2021_Report" },
      { label_en: "2020 report", label_ig: "Akụkọ 2020", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group/2020_Report" },
      { label_en: "2019 report", label_ig: "Akụkọ 2019", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group/2019_Report" },
      { label_en: "2020 community survey", label_ig: "Nnyocha obodo 2020", url: "https://meta.wikimedia.org/wiki/File:Igbo_Wikimedians_Community_Survey_report_2020.pdf" },
    ],
  },
  {
    id: "grants",
    group: "Organisation",
    label: "Internal grants",
    itemLabel: "resource",
    columns: grantColumns,
    items: [
      { label_en: "Apply for a micro-grant", label_ig: "Rịọ maka obere onyinye", period: "Up to 500 USD", url: "https://docs.google.com/forms/d/e/1FAIpQLSf4FHYwD3gmIyDYIgPYYq-yNCsl-tpKriDDAtrDVKu1678-Ow/viewform" },
      { label_en: "Grant guidelines", label_ig: "Ntuziaka onyinye", period: "Eligibility & selection", url: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group/Projects/Proposals/Internal_Grant_Applications" },
      { label_en: "Report your project", label_ig: "Kọọ ọrụ gị", period: "Micro-grant report form", url: "https://docs.google.com/forms/d/e/1FAIpQLSf4FHYwD3gmIyDYIgPYYq-yNCsl-tpKriDDAtrDVKu1678-Ow/viewform" },
      { label_en: "2026 content drive dashboard", label_ig: "Ebe nlekọta ọrụ 2026", period: "Outreach Dashboard", url: "https://outreachdashboard.wmflabs.org/campaigns/igbo_wikimedians_user_group_2026_content_creation_drive/programs" },
    ],
  },
  {
    id: "hubs",
    group: "Organisation",
    label: "Hubs & fan clubs",
    itemLabel: "hub",
    columns: hubColumns,
    items: [
      { name: "Ig Wikidata Hub", location_en: "Online", location_ig: "N’ịntanetị", url: "https://meta.wikimedia.org/wiki/Ig_Wikidata_Hub" },
      { name: "Ig Wiki Librarians Hub", location_en: "Online", location_ig: "N’ịntanetị", url: "https://meta.wikimedia.org/wiki/Ig_Wiki_Librarians_Hub" },
      { name: "Ig Wiki Commons Hub", location_en: "Wikimedia Commons", location_ig: "Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/Commons:IG_Commons_Hub" },
      { name: "IG Wiki Hub Enugu", location_en: "Enugu, Nigeria", location_ig: "Enugu, Naịjirịa", url: "https://meta.wikimedia.org/wiki/IG_Wiki_Hub_Enugu" },
      { name: "Igbo Wiki Fan Club, Alvan", location_en: "Alvan Ikoku, Owerri", location_ig: "Alvan Ikoku, Owerri", url: "https://meta.wikimedia.org/wiki/Igbo_Wiki_Fan_Club,_Alvan" },
      { name: "EBSU IG Wiki Fan Club", location_en: "Ebonyi State University", location_ig: "Mahadum Ebonyi Steeti", url: "https://meta.wikimedia.org/wiki/Ebonyi_State_University_(EBSU)_IG_Wiki_Fan_Club" },
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
