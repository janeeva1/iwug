import {
  cmsPagesTable,
  communityEventsTable,
  db,
  membershipTiersTable,
} from "@workspace/db";

const starterPages = [
  {
    slug: "home",
    titleEn: "Knowledge in Igbo, shared freely",
    titleIg: "Ihe ọmụma n’asụsụ Igbo, nke a na-ekekọrịta n’efu",
    summaryEn:
      "We are volunteers making Igbo language, history and culture easier to find across Wikipedia and the Wikimedia projects.",
    summaryIg:
      "Anyị bụ ndị ọrụ afọ ofufo na-eme ka asụsụ, akụkọ ihe mere eme na ọdịbendị Igbo dị mfe ịchọta na Wikipedia na ọrụ Wikimedia ndị ọzọ.",
    bodyEn:
      "Igbo Wikimedians User Group is a community of volunteers building open knowledge in and about Igbo. Take part by writing, translating, photographing, recording, or helping others learn.",
    bodyIg:
      "Otu Ndị Igbo Na-ede Ihe Ọmụma bụ obodo ndị ọrụ afọ ofufo na-ewu ihe ọmụma efu n’asụsụ Igbo nakwa gbasara ndị Igbo. Soro n’ọrụ site n’ide, ịtụgharị asụsụ, ịse foto, ịdekọ ụda, ma ọ bụ inyere ndị ọzọ aka ịmụ ihe.",
    published: true,
  },
  {
    slug: "about",
    titleEn: "About the community",
    titleIg: "Banyere obodo a",
    summaryEn:
      "A volunteer community connecting Igbo language, culture, and open knowledge.",
    summaryIg:
      "Obodo ndị ọrụ afọ ofufo na-ejikọta asụsụ Igbo, ọdịbendị, na ihe ọmụma efu.",
    bodyEn:
      "The Igbo Wikimedians User Group is a volunteer community that contributes to Wikimedia projects in Igbo and documents knowledge about Igbo people, language and culture. The group’s research dossier reports organized community work beginning in 2016 and Wikimedia user-group recognition in 2018. These dates are reported history, not live account statistics.",
    bodyIg:
      "Otu Ndị Igbo Na-ede Ihe Ọmụma bụ obodo ndị ọrụ afọ ofufo na-enye aka n’ọrụ Wikimedia n’asụsụ Igbo ma na-edekọ ihe ọmụma gbasara ndị Igbo, asụsụ ha na ọdịbendị ha. Akwụkwọ nyocha otu a kwuru na ọrụ obodo haziri nke ọma malitere n’afọ 2016, nakwa na Wikimedia nyere otu a nkwenye dịka user group n’afọ 2018. Nke a bụ akụkọ e kwuru, ọ bụghị ọnụ ọgụgụ ndekọ dị ndụ.",
    published: true,
  },
  {
    slug: "our-work",
    titleEn: "Where we contribute",
    titleIg: "Ebe anyị na-enye aka",
    summaryEn:
      "Our work spans Igbo-language projects and shared Wikimedia platforms.",
    summaryIg:
      "Ọrụ anyị metụtara ọrụ Wikimedia n’asụsụ Igbo na ebe ndị ọzọ na-ekekọrịta ihe ọmụma.",
    bodyEn:
      "Community members write and improve the Igbo Wikipedia and Wiktionary, add structured knowledge to Wikidata, share freely licensed media on Wikimedia Commons, and collect notable sayings on Igbo Wikiquote. Project availability can change; links on this site are checked against live Wikimedia APIs.",
    bodyIg:
      "Ndị obodo na-ede ma na-emezi Wikipedia Igbo na Wiktionary, na-etinye ihe ọmụma ahaziri n’ime Wikidata, na-ekesa onyonyo nwere ikike efu na Wikimedia Commons, ma na-anakọta okwu a ma ama na Wikiquote. Ọrụ dị iche iche nwere ike ịgbanwe; a na-enyocha njikọ ndị dị na saịtị a site na Wikimedia API dị ndụ.",
    published: true,
  },
  {
    slug: "by-laws",
    titleEn: "By-laws of the Igbo Wikimedians User Group",
    titleIg: "Iwu nke Otu Ndị Igbo Na-ede Ihe Ọmụma",
    summaryEn:
      "The rules that guide how our community is named, run, funded and changed.",
    summaryIg:
      "Iwu na-eduzi otú e si akpọ obodo anyị aha, otú o si arụ ọrụ, otú e si enweta ego na otú e si agbanwe ya.",
    bodyEn:
      "Article 1 · Name\nThe name of the group is the Igbo Wikimedians User Group.\nArticle 2 · Purpose\nThe group promotes the use of the Igbo language across Wikimedia projects and documents the culture, history and heritage of Igbo people as open knowledge.\nArticle 3 · Membership\nMembership is open to anyone who supports the aims of the group. It is free and voluntary, and members may leave at any time.\nArticle 4 · Leadership\nThe group is coordinated by volunteers who lead the programmes, communications, events and partnerships teams. Designated contacts represent the group to the Wikimedia Foundation.\nArticle 5 · Meetings\nGeneral meetings are held regularly, online and in person. Decisions are taken by consensus wherever possible.\nArticle 6 · Finances\nFunds and grants are used only for the activities of the group and are accounted for in the annual reports.\nArticle 7 · Amendments\nThese by-laws may be amended by a decision of the members at a general meeting.\nArticle 8 · Dissolution\nOn dissolution, remaining assets are handled in line with Wikimedia movement and affiliate rules.",
    bodyIg:
      "Nkeji 1 · Aha\nAha otu a bụ Otu Ndị Igbo Na-ede Ihe Ọmụma.\nNkeji 2 · Ebumnuche\nOtu a na-akwalite ojiji asụsụ Igbo n’ọrụ Wikimedia niile ma na-edekọ ọdịbendị, akụkọ ihe mere eme na ihe nketa ndị Igbo dịka ihe ọmụma efu.\nNkeji 3 · Ịbụ onye otu\nOnye ọ bụla na-akwado ebumnuche otu a nwere ike ịbụ onye otu. Ọ bụ n’efu na nke afọ ofufo, onye otu nwekwara ike ịpụ mgbe ọ bụla.\nNkeji 4 · Ndị na-edu ọrụ\nNdị ọrụ afọ ofufo na-edu otu mmemme, nzikọrịta ozi, mmemme na kalenda, na mmekọ. Ndị nnọchite anya na-anọchite otu a n’ihu Wikimedia Foundation.\nNkeji 5 · Nzukọ\nA na-enwe nzukọ izugbe mgbe niile, n’ịntanetị na n’ihu. A na-ekpebi ihe site na nkwekọrịta ebe o kwere omume.\nNkeji 6 · Ego\nA na-eji ego na onyinye eme naanị ọrụ otu a, a na-edekwara ha na akụkọ kwa afọ.\nNkeji 7 · Mgbanwe\nNdị otu nwere ike ịgbanwe iwu ndị a na nzukọ izugbe.\nNkeji 8 · Mgbasa\nMgbe a gbasasịrị otu a, a ga-ejikwa ihe ndị fọdụrụ mee ihe dịka iwu Wikimedia na ndị mmekọ si dị.",
    published: true,
  },
];

const starterTiers = [
  {
    id: "community-contributor",
    nameEn: "Community contributor",
    nameIg: "Onye na-enye obodo aka",
    descriptionEn:
      "Open volunteer membership with no fee. Suitable for contributors getting started.",
    descriptionIg:
      "Otu afọ ofufo mepere emepe n’enweghị ụgwọ. Ọ dị mma maka ndị na-amalite isonye.",
    priceNgn: 0,
    interval: "free" as const,
    active: true,
    benefitsEn: ["Participate in community activities", "Learn with other contributors"],
    benefitsIg: ["Soro na mmemme obodo", "Soro ndị ọzọ mụta ihe"],
  },
  {
    id: "project-contributor",
    nameEn: "Project contributor",
    nameIg: "Onye so n’ọrụ",
    descriptionEn:
      "A tier template. Confirm the fee and benefits with the community before activation.",
    descriptionIg:
      "Ụdị ọkwa otu. Kwenye ụgwọ na uru ya na obodo tupu i mee ka ọ rụọ ọrụ.",
    priceNgn: 0,
    interval: "annual" as const,
    active: false,
    benefitsEn: [],
    benefitsIg: [],
  },
  {
    id: "sustaining-supporter",
    nameEn: "Sustaining supporter",
    nameIg: "Onye nkwado na-adịgide adịgide",
    descriptionEn:
      "A tier template. Confirm the fee and benefits with the community before activation.",
    descriptionIg:
      "Ụdị ọkwa otu. Kwenye ụgwọ na uru ya na obodo tupu i mee ka ọ rụọ ọrụ.",
    priceNgn: 0,
    interval: "annual" as const,
    active: false,
    benefitsEn: [],
    benefitsIg: [],
  },
];

const starterEvents = [
  {
    id: "wikidata-14th-birthday-igbo-2026",
    titleEn: "Wikidata turns 14 — let’s celebrate together",
    titleIg: "Wikidata gbara afọ 14 — ka anyị na-eme emume ọnụ",
    descriptionEn:
      "The Igbo Wikimedians User Group joins the global Wikidata 14th birthday celebration. We will vibe, connect, learn and share our Wikidata stories — recognising the achievements of our volunteers and welcoming new contributors. Virtual session: Friday, 16 October 2026 at 5:00 PM WAT. In-person celebration: Saturday, 17 October 2026 from 10:00 AM WAT, with introductions, a workshop, birthday quiz and games, cake cutting, and a closing group photo. Venues: Abuja (Enspire Hub, Merit House, Maitama) and Awka (Godwin Art Gallery, 9 Bishop Obiefuna Avenue). Languages: Igbo and English. Organised by the Igbo Wikimedians User Group.",
    descriptionIg:
      "Otu Ndị Igbo na-ede Ihe Ọmụma na-eso emume ncheta afọ 14 nke Wikidata n’ụwa niile. Anyị ga-ezukọ, jikọọ, mụta ihe ma kọọ akụkọ Wikidata anyị — na-ekele ndị ọrụ afọ ofufo anyị ma na-anabata ndị ọhụrụ. Nzukọ n’ịntanetị: Fraịde, 16 Ọktoba 2026 n’elekere 5:00 nke mgbede WAT. Emume n’ihu: Satọde, 17 Ọktoba 2026 malite n’elekere 10:00 nke ụtụtụ WAT, gụnyere iwebata onwe, klaasị ọrụ, ajụjụ na egwuregwu ncheta ọmụmụ, igbu achịcha, na foto otu na mmechi. Ebe: Abuja (Enspire Hub, Merit House, Maitama) na Awka (Godwin Art Gallery, 9 Bishop Obiefuna Avenue). Asụsụ: Igbo na Bekee. Ọ bụ Otu Ndị Igbo na-ede Ihe Ọmụma haziri ya.",
    startsAt: new Date("2026-10-17T10:00:00+01:00"),
    endsAt: new Date("2026-10-17T15:00:00+01:00"),
    location: "Abuja & Awka, Nigeria · Online",
    venue: "Enspire Hub, Merit House, Maitama, Abuja",
    latitude: 9.0765,
    longitude: 7.3986,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/A_community_celebration_3.jpg/1280px-A_community_celebration_3.jpg",
    project: "Wikidata",
    status: "upcoming" as const,
    published: true,
    reportUrl: null,
  },
  {
    id: "content-creation-drive-2026",
    titleEn: "2026 Igbo content creation drive",
    titleIg: "Mgbasa ide ọdịnaya Igbo 2026",
    descriptionEn:
      "A year-long drive to create and improve Igbo-language articles and structured data across Wikipedia, Wikidata and Wikimedia Commons. Join the edit-a-thons, translate, add references, or upload photos.",
    descriptionIg:
      "Mgbasa otu afọ iji mepụta ma meziwanye akụkọ n’asụsụ Igbo na data ahaziri na Wikipedia, Wikidata na Wikimedia Commons. Soro na edit-a-thon, tụgharịa asụsụ, tinye ntụaka, ma ọ bụ bulite foto.",
    startsAt: new Date("2026-03-01T09:00:00+01:00"),
    endsAt: new Date("2026-12-31T18:00:00+01:00"),
    location: "Online",
    venue: null,
    latitude: null,
    longitude: null,
    imageUrl: null,
    project: "Wikipedia",
    status: "upcoming" as const,
    published: true,
    reportUrl: null,
  },
  {
    id: "igbo-wikidata-monthly-2026-10",
    titleEn: "Igbo Wikidata monthly meet-up",
    titleIg: "Nzukọ Wikidata Igbo kwa ọnwa",
    descriptionEn:
      "Our monthly online meet-up for Wikidata contributors. Beginners welcome — we cover one small skill each month and answer your questions.",
    descriptionIg:
      "Nzukọ anyị kwa ọnwa n’ịntanetị maka ndị na-enye Wikidata aka. Ndị mbido nabatara — anyị na-amụ otu nkà nta kwa ọnwa ma zaa ajụjụ gị.",
    startsAt: new Date("2026-10-24T16:00:00+01:00"),
    endsAt: new Date("2026-10-24T17:30:00+01:00"),
    location: "Online",
    venue: null,
    latitude: null,
    longitude: null,
    imageUrl: null,
    project: "Wikidata",
    status: "upcoming" as const,
    published: true,
    reportUrl: null,
  },
  {
    id: "igbo-editathon-abuja-2026-11",
    titleEn: "Igbo edit-a-thon in Abuja",
    titleIg: "Edit-a-thon Igbo na Abuja",
    descriptionEn:
      "An in-person edit-a-thon for new and experienced editors. Bring a laptop; we provide internet, guidance and a friendly room.",
    descriptionIg:
      "Edit-a-thon n’ihu maka ndị mbido na ndị nwere ahụmahụ. Weta laptọọpụ; anyị na-enye ịntanetị, ntuziaka na ebe enyi.",
    startsAt: new Date("2026-11-14T10:00:00+01:00"),
    endsAt: new Date("2026-11-14T15:00:00+01:00"),
    location: "Abuja, Nigeria",
    venue: "Cavic Nigeria, Wuse 2, Abuja",
    latitude: 9.0765,
    longitude: 7.3986,
    imageUrl: null,
    project: "Wikipedia",
    status: "upcoming" as const,
    published: true,
    reportUrl: null,
  },
  {
    id: "igbo-women-editathon-2016",
    titleEn: "Igbo Women Edit-a-thon",
    titleIg: "Edit-a-thon Ụmụ nwanyị Igbo",
    descriptionEn:
      "The drive that started it all — a 2016 edit-a-thon bringing more Igbo women and Igbo-language knowledge onto Wikimedia projects.",
    descriptionIg:
      "Mmemme malitere ihe niile — edit-a-thon nke 2016 wetara ọtụtụ ụmụ nwanyị Igbo na ihe ọmụma n’asụsụ Igbo n’ọrụ Wikimedia.",
    startsAt: new Date("2016-03-05T10:00:00+01:00"),
    endsAt: null,
    location: "Abuja, Nigeria",
    venue: null,
    latitude: null,
    longitude: null,
    imageUrl: null,
    project: "Wikipedia",
    status: "completed" as const,
    published: true,
    reportUrl: null,
  },
  {
    id: "wiki-20-igbo-2021",
    titleEn: "Wikipedia at 20 — Igbo community meet-up",
    titleIg: "Wikipedia gbara afọ 20 — nzukọ obodo Igbo",
    descriptionEn:
      "We marked Wikipedia’s 20th birthday with an online meet-up celebrating Igbo contributions and the people behind them.",
    descriptionIg:
      "Anyị mere emume ncheta afọ 20 Wikipedia site na nzukọ n’ịntanetị na-ekele onyinye Igbo na ndị kpatara ha.",
    startsAt: new Date("2021-01-15T15:00:00+01:00"),
    endsAt: null,
    location: "Online",
    venue: null,
    latitude: null,
    longitude: null,
    imageUrl: null,
    project: "Wikipedia",
    status: "completed" as const,
    published: true,
    reportUrl: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group_2021_Report",
  },
  {
    id: "1lib1ref-igbo-2024",
    titleEn: "1Lib1Ref 2024 in Igbo",
    titleIg: "1Lib1Ref 2024 n’asụsụ Igbo",
    descriptionEn:
      "Librarians and editors added citations to Igbo articles during the global #1Lib1Ref campaign.",
    descriptionIg:
      "Ndị ọba akwụkwọ na ndị nchịkọta tinyere ntụaka na akụkọ Igbo n’oge mgbasa #1Lib1Ref zuru ụwa ọnụ.",
    startsAt: new Date("2024-02-20T09:00:00+01:00"),
    endsAt: null,
    location: "Online",
    venue: null,
    latitude: null,
    longitude: null,
    imageUrl: null,
    project: "Wikipedia",
    status: "completed" as const,
    published: true,
    reportUrl: "https://meta.wikimedia.org/wiki/Igbo_Wikimedians_User_Group_-_Annual_Report_2023/2024",
  },
];

let seedPromise: Promise<void> | undefined;

async function seedOnce(): Promise<void> {
  const [existingPages, existingTiers, existingEvents] = await Promise.all([
    db.select({ slug: cmsPagesTable.slug }).from(cmsPagesTable),
    db.select({ id: membershipTiersTable.id }).from(membershipTiersTable),
    db.select({ id: communityEventsTable.id }).from(communityEventsTable),
  ]);

  const pageSlugs = new Set(existingPages.map((row) => row.slug));
  const tierIds = new Set(existingTiers.map((row) => row.id));
  const eventIds = new Set(existingEvents.map((row) => row.id));

  const pages = starterPages.filter((page) => !pageSlugs.has(page.slug));
  const tiers = starterTiers.filter((tier) => !tierIds.has(tier.id));
  const events = starterEvents.filter((event) => !eventIds.has(event.id));

  const operations: Array<Promise<unknown>> = [];
  if (pages.length > 0) operations.push(db.insert(cmsPagesTable).values(pages));
  if (tiers.length > 0) operations.push(db.insert(membershipTiersTable).values(tiers));
  if (events.length > 0) operations.push(db.insert(communityEventsTable).values(events));

  await Promise.all(operations);
}

export function ensureCommunitySeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedOnce().catch((error: unknown) => {
      seedPromise = undefined;
      throw error;
    });
  }
  return seedPromise;
}
