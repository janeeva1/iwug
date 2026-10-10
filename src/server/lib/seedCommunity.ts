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
    location: "Abuja & Awka, Nigeria · Online",
    project: "Wikidata",
    status: "upcoming" as const,
    published: true,
    reportUrl: null,
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
