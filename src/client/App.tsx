import './site.css';
import './auth-notice.css';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useIsFetching, useIsMutating, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth, type AuthUser } from './auth';
import { AdminContentPanel, SiteContentContextProvider, SITE_CONTENT_QUERY_KEY, buildSiteContentValue, fetchSiteContent, getContentValue, setContentLookup } from './site-content';
import { AdminPaymentsPanel, MEMBER_BILLING_QUERY_KEY, formatNgn, initializePayment, useMemberBilling, usePaymentConfig, useVerifyPayment } from './payments';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown,
  ChevronRight, ChevronLeft, Heart, Languages, LogOut, Menu, ShieldCheck,
  Sparkles, UsersRound, X, CalendarDays, MapPin, ExternalLink, CircleHelp,
  LoaderCircle, Plus, Save, Trash2, Pencil, Settings2, ChartNoAxesColumn,
  Images, Search, Sun, Moon, RotateCw, Home, CreditCard, Play, Pause, Clock,
} from 'lucide-react';
import {
  useListPages, getListPagesQueryKey, useListAdminPages, getListAdminPagesQueryKey,
  useGetPage, getGetPageQueryKey, useCreatePage,
  useUpdatePage, useDeletePage, useListEvents, getListEventsQueryKey, useCreateEvent,
  useUpdateEvent, useDeleteEvent, useListMembershipTiers, getListMembershipTiersQueryKey,
  useCreateMembershipTier, useUpdateMembershipTier, useDeleteMembershipTier,
  useRegisterMember, useGetMyMembership, getGetMyMembershipQueryKey, useListMembers,
  getListMembersQueryKey, useUpdateMember, useGetCommunitySummary,
  getGetCommunitySummaryQueryKey, useGetWikimediaStats, getGetWikimediaStatsQueryKey,
  useGetMyWikimediaStats, getGetMyWikimediaStatsQueryKey,
  useGetCommunityContributors, getGetCommunityContributorsQueryKey,
  useRefreshAccount,
  useGetSiteSettings, getGetSiteSettingsQueryKey, useUpdateSiteSettings,
  useGetGalleryCategories, useGetGalleryMedia, useSearchDictionary,
  useGetAuthProviders, useLoginAccount, useRegisterAccount, useCompleteProfile,
  useSearchWikimediaUsernames, verifyWikimediaUsername,
} from '@workspace/api-client-react';
import type {
  CmsPage, CmsPageInput, CommunityEvent, CommunityEventInput, MembershipTier,
  MembershipTierInput, Member, SiteSettings, SiteSettingsInput, WikimediaMemberStats,
  CommunityContributor, WikimediaAccount, GalleryCategory, GalleryMediaItem,
} from '@workspace/api-client-react';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

type Locale = 'ig' | 'en';
const LocaleContext = createContext<Locale>('ig');
const useLocale = () => useContext(LocaleContext);
type ProjectItem = { id: string; ig: string; en: string; name: string; url: string; userBase: string; mark: string; detailIg: string; detailEn: string };
const defaultProjects: ProjectItem[] = [
  { id: 'igwiki', ig: 'Wikipedia', en: 'Wikipedia', name: 'Igbo Wikipedia', url: 'https://ig.wikipedia.org', userBase: 'https://ig.wikipedia.org/wiki/User:', mark: 'W', detailIg: 'Wepụta ihe ọmụma n’asụsụ Igbo.', detailEn: 'Build a free encyclopedia in Igbo.' },
  { id: 'igwikt', ig: 'Wiktionary', en: 'Wiktionary', name: 'Igbo Wiktionary', url: 'https://ig.wiktionary.org', userBase: 'https://ig.wiktionary.org/wiki/User:', mark: 'D', detailIg: 'Chekwaa okwu, nkọwa na otú e si eji ha.', detailEn: 'Document words, meanings and how they are used.' },
  { id: 'wikidata', ig: 'Wikidata', en: 'Wikidata', name: 'Wikidata', url: 'https://www.wikidata.org', userBase: 'https://www.wikidata.org/wiki/User:', mark: 'Q', detailIg: 'Hazie ihe ọmụma gbasara ndị Igbo na ụwa ha.', detailEn: 'Structure knowledge about Igbo people and the world.' },
  { id: 'commons', ig: 'Commons', en: 'Commons', name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org', userBase: 'https://commons.wikimedia.org/wiki/User:', mark: 'C', detailIg: 'Kesaa foto, ụda na ihe onyonyo nwere ikike efu.', detailEn: 'Share freely licensed photographs, audio and media.' },
  { id: 'igwikiquote', ig: 'Wikiquote', en: 'Wikiquote', name: 'Igbo Wikiquote', url: 'https://ig.wikiquote.org', userBase: 'https://ig.wikiquote.org/wiki/User:', mark: '“', detailIg: 'Kpọkọta okwu amamihe na nkwupụta ndị ama ama.', detailEn: 'Collect notable quotations and sayings.' },
  { id: 'wikifunctions', ig: 'Wikifunctions', en: 'Wikifunctions', name: 'Wikifunctions', url: 'https://www.wikifunctions.org', userBase: 'https://www.wikifunctions.org/wiki/User:', mark: 'ƒ', detailIg: 'Wuo ọrụ koodu nke asụsụ niile na-eji.', detailEn: 'Build a library of functions anyone can use.' },
  { id: 'enwiki', ig: 'Wikipedia Bekee', en: 'English Wikipedia', name: 'English Wikipedia', url: 'https://en.wikipedia.org', userBase: 'https://en.wikipedia.org/wiki/User:', mark: 'W', detailIg: 'Mezi ma gbasaa ihe ọmụma gbasara ndị Igbo n’Bekee.', detailEn: 'Improve and expand knowledge about Igbo people in English.' },
  { id: 'wikisource', ig: 'Wikisource', en: 'Wikisource', name: 'Wikisource', url: 'https://wikisource.org', userBase: 'https://wikisource.org/wiki/User:', mark: 'S', detailIg: 'Chekwaa akwụkwọ na ederede n’efu.', detailEn: 'Preserve free books and source texts.' },
  { id: 'meta', ig: 'Meta-Wiki', en: 'Meta-Wiki', name: 'Meta-Wiki', url: 'https://meta.wikimedia.org', userBase: 'https://meta.wikimedia.org/wiki/User:', mark: 'M', detailIg: 'Hazie ọrụ Wikimedia na mmekọrịta obodo.', detailEn: 'Coordinate Wikimedia projects and community work.' },
];
let projects = defaultProjects;
const projectById = (id: string) => projects.find((p) => p.id === id);
const projectLabel = (id: string, locale: Locale) => { const p = projectById(id); return p ? (locale === 'ig' ? p.ig : p.en) : id; };
const projectFullName = (id: string, locale: Locale) => { const p = projectById(id); return p ? (locale === 'ig' ? p.ig : p.name) : id; };
const projectUserUrl = (id: string, username: string) => { const p = projectById(id); return p ? `${p.userBase}${encodeURIComponent(username)}` : undefined; };
const t = (locale: Locale, ig: string, en: string) => getContentValue(locale, ig, en).replace(/<br\s*\/?>/gi, '\n');
type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {} });
const useTheme = () => useContext(ThemeContext);
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('igbo-theme') : null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    try { localStorage.setItem('igbo-theme', theme); } catch { /* ignore */ }
  }, [theme]);
  const value = useMemo<ThemeContextValue>(() => ({ theme, toggle: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')) }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label} data-testid="button-theme-toggle">{theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}</button>;
}
function useScrollReveal() {
  const [pathname] = useLocation();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
}
const adminIg:Record<string,string>={
  'Overview':'Nchịkọta','Pages':'Peeji','Events':'Mmemme','Membership tiers':'Ọkwa otu','Members':'Ndị otu','Wiki statistics':'Stats Wiki','Settings':'Ntọala',
  'Community overview':'Nchịkọta obodo','CMS pages':'Peeji CMS','Community events':'Mmemme obodo','Member review':'Nyocha ndị otu','Wikimedia statistics':'Stats Wikimedia','Site settings':'Ntọala saịtị',
  'STEWARD DESK':'TEBỤL NDỊ NCHỊKWA','COMMUNITY CONTROL ROOM / NKE NDỊ NCHỊKWA':'NCHỊKWA OBODO','Stewardship.':'Ilekọta ọrụ obodo.','Content, gatherings and membership — managed by the people who keep the work moving.':'Ndị obodo na-elekọta ọdịnaya, mmemme na ndị otu ka ọrụ wee gaa n’ihu.','SIGNED-IN ADMIN AREA':'OGHERE NDỊ NCHỊKWA','REGISTERED MEMBERS':'NDỊ OTU EDEBANYERE','PUBLISHED EVENTS':'MMEMME E BIPỤTARA','ACTIVE PROJECTS':'ỌRỤ NA-ARỤ ỌRỤ','API STATUS':'ỌNỌDỤ API','Views are connected to the community API. Authorization and write permissions are enforced by the service.':'Ejikọtara peeji ndị a na API obodo. Ọrụ a na ikike ide ihe dị n’aka ọrụ API.','pages':'peeji','events':'mmemme','members':'ndị otu','settings':'ntọala',
  'Create page':'Mepụta peeji','Edit page':'Dezie peeji','Create event':'Mepụta mmemme','Edit event':'Dezie mmemme','Create membership tier':'Mepụta ọkwa otu','Edit membership tier':'Dezie ọkwa otu',
  'Slug':'Aha URL','Hero image URL (optional)':'URL foto nkọwa (nhọrọ)','Title · English':'Aha · Bekee','Title · Igbo':'Aha · Igbo','Summary · English':'Nchịkọta · Bekee','Summary · Igbo':'Nchịkọta · Igbo','Body · English':'Isi ederede · Bekee','Body · Igbo':'Isi ederede · Igbo','Published':'E bipụtara','Starts at':'Oge mmalite','Location':'Ebe','Project':'Ọrụ','Report URL':'URL akụkọ','Description · English':'Nkọwa · Bekee','Description · Igbo':'Nkọwa · Igbo','Status':'Ọnọdụ','Upcoming':'Na-abịa','Completed':'Emechara','Active and visible for registration':'Na-arụ ọrụ ma a na-ahụ ya n’akwụkwọ ndebanye','Name · English':'Aha · Bekee','Name · Igbo':'Aha · Igbo','Price (NGN)':'Ọnụahịa (NGN)','Interval':'Oge ugboro','Benefits · English (one per line)':'Uru · Bekee (otu n’ahịrị)','Benefits · Igbo (one per line)':'Uru · Igbo (otu n’ahịrị)',
  'Contact email':'Email kọntaktị','Contact address':'Adreesị kọntaktị','Donation URL (leave blank to disable)':'URL onyinye (hapụ oghere ka gbanyụọ)','Enable the configured donation destination':'Kwado ebe onyinye a haziri','Save settings':'Chekwaa ntọala','Settings saved':'E chekwara ntọala','Saving…':'A na-echekwa…','No member registrations yet':'Enweghị ndị otu debanyere aha','New membership requests will appear here for review.':'Arịrịọ otu ọhụrụ ga-apụta ebe a maka nyocha.','No consented statistics available':'Enweghị stats nkwenye dị ugbu a','Only explicit opt-in members can contribute to these totals.':'Naanị ndị otu nyere nkwenye doro anya ka a ga-agụ na stats ndị a.','Add new':'Tinye nke ọhụrụ','Save':'Chekwaa','Cancel':'Kagbuo','Delete this event?':'Hichapụ mmemme a?','Currency':'Ego','Donation links are public only when enabled and configured. The public site will show an unavailable state otherwise.':'A ga-egosi njikọ onyinye ọha naanị ma agbanyere ya ma hazie ya. Ma ọ bụghị ya, saịtị ga-egosi na ọ dịghị.',
  'Draft':'E debeghị ya','Hidden':'E zoro ezo','Active':'Na-arụ ọrụ','Inactive':'Adịghị arụ ọrụ','pending':'na-echere','active':'na-arụ ọrụ','paused':'kwụsịtụrụ','Location not shared':'E kesaghị ebe','Stats consent':'Nkwenye stats','CONSENTED MEMBER RECORDS':'NDỊ OTU KWERE','PROJECT ENTRIES AVAILABLE':'NTỤLE ỌRỤ DỊ','AGGREGATE CONTRIBUTIONS':'ONYINYE NCHỊKỌTA','Consented and available records only':'Naanị ndekọ ndị nyere nkwenye ma dị','Member-specific details omitted from this interface.':'E wepụrụ nkọwa nke onye otu n’ebe a.','contributors':'ndị nyere onyinye','Delete this tier?':'Hichapụ ọkwa a?','Only free tiers can be registered for online right now.':'Ugbu a, naanị ọkwa n’efu ka a ga-edebanye aha na ntanetị.',
};
const localizeAdmin=(locale:Locale,text:string)=>locale==='ig'?(adminIg[text]??text):text;
const asError = (error: unknown) => error instanceof Error ? error.message : '';

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  const { theme } = useTheme();
  const file = !inverse && theme === 'dark' ? 'logo-dark.svg' : 'logo.svg';
  return <img className={`brand-logo ${inverse ? 'brand-inverse' : ''}`} src={`${basePath}/${file}`} alt="" aria-hidden="true" data-testid="brand-logo"/>;
}
function SiteHeader({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const links: [string, string, ReactNode][] = [
    ['/', t(locale, 'Ụlọ', 'Home'), <Home key="i"/>], ['/projects', t(locale, 'Ọrụ anyị', 'Projects'), <Sparkles key="i"/>],
    ['/gallery', t(locale, 'Ọba foto', 'Gallery'), <Images key="i"/>], ['/dictionary', t(locale, 'Nkọwa okwu', 'Dictionary'), <BookOpen key="i"/>],
    ['/events', t(locale, 'Mmemme', 'Gatherings'), <CalendarDays key="i"/>], ['/community', t(locale, 'Ndị nyere aka', 'Contributors'), <UsersRound key="i"/>],
    ['/join', t(locale, 'Soro anyị', 'Join us'), <Heart key="i"/>],
  ];
  return <header className="site-header">
    <div className="shell header-inner">
      <Link href="/" className="brand-lockup" data-testid="link-home"><BrandMark/><span><b>Igbo Wikimedians</b><small>{t(locale,'Otu Ndị Igbo Na-ede Ihe Ọmụma','Igbo People Writing Knowledge')}</small></span></Link>
      <nav className="desktop-nav" aria-label={t(locale,'Nchọgharị isi','Main navigation')}>{links.map(([href, label, icon]) => <Link key={href} href={href} className="nav-link" data-testid={`nav-${href.slice(1) || 'home'}`}><span className="nav-icon" aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
      <div className="header-actions">
        <ThemeToggle/>
        <button className="locale-toggle" onClick={() => setLocale(locale === 'ig' ? 'en' : 'ig')} data-testid="button-language-toggle" aria-label={t(locale,'Gbanwee asụsụ','Change language')}><Languages size={16}/><span>{locale === 'ig' ? 'IG' : 'EN'}</span><ChevronDown size={12}/></button>
        <Link href={isSignedIn ? '/member' : '/sign-in'} className="header-account" data-testid="link-account">{isSignedIn ? t(locale, 'Akụkọ m', 'My space') : t(locale, 'Banye', 'Sign in')}<ArrowUpRight size={15}/></Link>
        <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label={open ? t(locale,'Mechie menu','Close menu') : t(locale,'Mepee menu','Open menu')} data-testid="button-mobile-menu">{open ? <X/> : <Menu/>}</button>
      </div>
    </div>
    {open && <nav className="mobile-nav shell" aria-label={t(locale,'Nchọgharị ekwentị','Mobile navigation')}>{links.map(([href, label, icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`mobile-nav-${href.slice(1) || 'home'}`}><span className="mobile-nav-icon" aria-hidden="true">{icon}</span><span className="mobile-nav-label">{label}</span><ArrowRight size={16}/></Link>)}</nav>}
  </header>;
}
function SiteFooter({ locale }: { locale: Locale }) {
  const settings = useGetSiteSettings();
  return <footer className="site-footer">
    <div className="shell footer-top"><div className="footer-brand"><BrandMark inverse/><h3 className="serif">Okwu anyị.<br/>Ihe ọmụma anyị.</h3><p>{t(locale, 'Obodo jikọtara ọnụ iji chekwaa ma gbasaa ihe ọmụma n’asụsụ Igbo.', 'A community keeping knowledge in Igbo, open and alive for everyone.')}</p></div>
      <div className="footer-col"><span className="eyebrow">{t(locale,'CHỌGHARỊA','EXPLORE')}</span><Link href="/projects">{t(locale,'Ọrụ anyị','Projects')}</Link><Link href="/gallery">{t(locale,'Ọba foto','Gallery')}</Link><Link href="/dictionary">{t(locale,'Nkọwa okwu','Dictionary')}</Link><Link href="/events">{t(locale,'Mmemme','Gatherings')}</Link><Link href="/community">{t(locale,'Ndị nyere aka','Contributors')}</Link><Link href="/join">{t(locale,'Soro anyị','Become a member')}</Link></div>
      <div className="footer-col"><span className="eyebrow">{t(locale,'KWADO','SUPPORT')}</span><Link href="/donate">{t(locale,'Kwado ọrụ a','Support our work')}</Link>{settings.data?.contactEmail ? <a href={`mailto:${settings.data.contactEmail}`}>{settings.data.contactEmail}</a> : <span className="footer-muted">{t(locale,'Nkọwa kọntaktị adịghị ugbu a','Contact information not configured')}</span>}{settings.data?.contactAddress ? <span className="footer-muted footer-address">{settings.data.contactAddress}</span> : null}</div>
    </div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} Igbo Wikimedians User Group</span><span>{t(locale,'Ihe ọmụma nke onye ọ bụla, n’asụsụ onye ọ bụla.','Knowledge for everyone, in everyone’s language.')}</span><a href="https://commons.wikimedia.org/wiki/File:Igbo_Wikimedians_User_Group_Logo.svg" target="_blank" rel="noreferrer" className="footer-credit">{t(locale,'Akara: Blossom Ozurumba · CC BY-SA 4.0','Logo: Blossom Ozurumba · CC BY-SA 4.0')}</a><Link href="/admin" data-testid="link-admin-footer">{t(locale,'Ndị nchịkwa','Admin')}</Link></div>
  </footer>;
}
function PageFrame({ locale, setLocale, children }: { locale: Locale; setLocale: (v: Locale) => void; children: ReactNode }) {
  useScrollReveal();
  return <div className="grain min-h-[100dvh]"><SiteHeader locale={locale} setLocale={setLocale}/>{children}<SiteFooter locale={locale}/></div>;
}
function Wordmark() { const locale=useLocale(); return <span className="eyebrow">{t(locale,'OTU WIKIMEDIA NDỊ IGBO','IGBO WIKIMEDIANS USER GROUP')} <i className="tiny-star">·</i></span>; }
function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  const locale=useLocale();
  return <div className="notice error-notice" role="alert" data-testid="status-error"><CircleHelp size={18}/><span>{t(locale,'Arịrịọ a emezughị. Biko nwaa ọzọ.','That request did not complete. Please try again.')}{message&&<small className="error-detail">{message}</small>}</span>{retry && <button onClick={retry} className="link-button" data-testid="button-retry">{t(locale,'Nwaa ọzọ','Retry')}</button>}</div>;
}
function Skeleton({ rows = 3 }: { rows?: number }) {
  const locale=useLocale();
  return <div className="skeleton-stack" aria-label={t(locale,'Na-ebu ọdịnaya','Loading content')} data-testid="status-loading">{Array.from({length: rows}, (_, i) => <div className="skeleton-line" key={i} style={{width: `${94 - i * 11}%`}}/>)}</div>;
}
function GlobalLoading() {
  const locale = useLocale();
  const { theme } = useTheme();
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const busy = fetching + mutating > 0;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (busy) { setVisible(true); return; }
    const id = window.setTimeout(() => setVisible(false), 250);
    return () => window.clearTimeout(id);
  }, [busy]);
  if (!visible) return null;
  const logo = theme === 'dark' ? 'logo-dark.svg' : 'logo.svg';
  return <>
    <div className="global-progress" role="progressbar" aria-hidden="true" data-testid="global-progress"><span/></div>
    <div className="global-loading" role="status" aria-live="polite" data-testid="status-loading-overlay">
      <div className="global-loading-card">
        <span className="global-loading-spinner"><img src={`${basePath}/${logo}`} alt="" aria-hidden="true"/><i className="global-loading-ring"/></span>
        <span className="global-loading-label">{t(locale,'Na-ebu','Loading')}</span>
      </div>
    </div>
  </>;
}

function HomePage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const summary = useGetCommunitySummary();
  const events = useListEvents();
  const { data: homePage } = useGetPage('home');
  const upcoming = (events.data ?? []).filter(e => e.published && e.status === 'upcoming').slice(0, 2);
  return <PageFrame locale={locale} setLocale={setLocale}>
    <main>
      <section className="hero-section">
        <HeroSlideshow/>
        <div className="hero-orbit" aria-hidden="true"><span className="orbit-ring ring-one"/><span className="orbit-ring ring-two"/><span className="orbit-dot dot-one"/><span className="orbit-dot dot-two"/><div className="hero-monogram">Ig</div><span className="orbit-note note-one">{t(locale,'okwu / okwu','okwu / word')}</span><span className="orbit-note note-two">{t(locale,'anyị / we','we / together')}</span></div>
        <div className="shell hero-copy">
          <Wordmark/>
          <p className="hero-kicker reveal reveal-delay-1">{t(locale, 'Asụsụ anyị bụ ebe obibi anyị.', 'A language is a place to belong.')}</p>
          <h1 className="serif reveal reveal-delay-2">{t(locale, 'Ka okwu Igbo dị ndụ n’ụwa dijitalụ.', 'Let Igbo live<br/>everywhere knowledge does.').split('\n').map((x,i)=><span key={i}>{x}{i===0 && <br/>}</span>)}</h1>
          <p className="hero-description reveal reveal-delay-3">{locale === 'ig' ? (homePage?.summaryIg || 'Anyị bụ ndị ọrụ afọ ofufo na-eme ka asụsụ, akụkọ ihe mere eme na ọdịbendị Igbo nọrọ na Wikipedia na Wikimedia ndị ọzọ.') : (homePage?.summaryEn || 'We are volunteers making Igbo language, history and culture easier to find across Wikipedia and the Wikimedia projects.')}</p>
          <div className="hero-cta reveal reveal-delay-3"><Link href="/join" className="btn-primary" data-testid="button-hero-join">{t(locale,'Bụrụ akụkụ nke anyị','Become part of it')}<ArrowRight size={17}/></Link><Link href="/projects" className="text-cta" data-testid="link-explore-projects">{t(locale,'Lelee ọrụ anyị','Explore the projects')}<ArrowDownRight size={16}/></Link></div>
          <div className="hero-proof"><span className="proof-rule"/><span>{t(locale,'Ọrụ obodo malitere na 2016 · Nkwenye Wikimedia na 2018','Community work began in 2016 · Wikimedia recognition in 2018')}</span><span className="reported">{t(locale,'E sitere na akụkọ / Reported','Reported')}</span></div>
        </div>
        <div className="hero-visual-caption"><span>01 — 06</span><span>{t(locale,'Okwu na-aga n’ihu','Words move forward')}</span></div>
      </section>
      <section className="metrics-strip"><div className="shell metrics-grid">
        {summary.isLoading ? <Skeleton rows={1}/> : summary.error ? <ErrorNotice message={asError(summary.error)}/> : <>
          <div className="metric"><strong data-testid="metric-members">{summary.data?.registeredMembers ?? '—'}</strong><span>{t(locale,'ndị debanyere aha','registered members')}</span><small>{t(locale,'Nchịkọta obodo','Community summary')}</small></div>
          <div className="metric"><strong data-testid="metric-events">{summary.data?.publishedEvents ?? '—'}</strong><span>{t(locale,'mmemme e bipụtara','published gatherings')}</span><small>{t(locale,'Nchịkọta obodo','Community summary')}</small></div>
          <div className="metric"><strong data-testid="metric-projects">{summary.data?.activeProjects ?? '—'}</strong><span>{t(locale,'ọrụ Wikimedia','Wikimedia projects')}</span><small>{t(locale,'Nchịkọta obodo','Community summary')}</small></div>
        </>}
        <p className="metric-note">{t(locale,'Ọnụọgụ ndị a sitere na nchịkọta sistemụ obodo; ha abụghị nyocha onwe ha nke Wikimedia.', 'Counts come from the community service summary; they are not an independent Wikimedia audit.')}</p>
      </div></section>
      <CultureSlider locale={locale}/>
      <section className="story-section shell">
        <div className="section-index"><span className="eyebrow">{t(locale,'01 / IHE MERE O JI DỊ MKPA','01 / WHY THIS MATTERS')}</span><span className="section-index-mark">01</span></div>
        <div className="story-layout"><div className="story-heading"><h2 className="serif">{t(locale,'Ọdịnihu asụsụ<br/>dị n’aka anyị.','The future of a language<br/>is made together.')}</h2><p>{t(locale,'Mgbe anyị na-ede, na-atụgharị ma na-ese ihe, anyị na-eme ka ihe ọmụma gbasara ndụ ndị Igbo dị mfe ịchọta, kesaa, ma too.', 'Every article, recording and photograph makes knowledge of Igbo life easier to find, share and grow.')}</p><Link href="/projects" className="arrow-link" data-testid="link-story-projects">{t(locale,'Gaa hụ ihe anyị na-arụ','See what we’re making')}<ArrowUpRight size={16}/></Link></div>
          <div className="quote-card"><div className="quote-ornament">“</div><blockquote className="serif">{t(locale,'Asụsụ bụ ụlọ mmadụ na-ebi n’ime ya.','Language is a home we build together.')}</blockquote><span className="quote-caption">{t(locale,'Echiche gbasara nchekwa asụsụ','A thought on language preservation')}</span><div className="quote-bottom"><span>{t(locale,'NDỊ IGBO · OBI','IGBO PEOPLE · HOME')}</span><span>02—26</span></div></div>
        </div>
      </section>
      <section className="projects-preview">
        <div className="shell"><div className="section-heading-row"><div><span className="eyebrow">{t(locale,'02 / IHE ỌMỤMA MEGHEERE ONYE Ọ BỤLA','02 / OPEN KNOWLEDGE')}</span><h2 className="serif">{t(locale,'Ebe okwu Igbo na-aga.','Where Igbo words can go.')}</h2></div><Link href="/projects" className="arrow-link" data-testid="link-all-projects">{t(locale,'Ọrụ Wikimedia, otu olu','Wikimedia projects, one voice')}<ArrowUpRight size={16}/></Link></div>
          <div className="project-preview-grid">{projects.slice(0, 4).map((p, i)=><a href={p.url} target="_blank" rel="noreferrer" className={`project-tile tile-${i}`} key={p.id} data-testid={`project-tile-${p.id}`}><span className="project-glyph">{p.mark}</span><span className="eyebrow">{p.name}</span><h3 className="serif">{locale === 'ig' ? p.detailIg : p.detailEn}</h3><ArrowUpRight className="project-arrow" size={18}/></a>)}</div>
        </div>
      </section>
      <CommonsStory locale={locale}/>
      <section className="timeline-section"><div className="shell timeline-layout"><div><span className="eyebrow">{t(locale,'03 / AKỤKỌ ANYỊ','03 / OUR STORY')}</span><h2 className="serif">{t(locale,'E wuru ya<br/>site n’ala.','Rooted locally.<br/>Shared everywhere.')}</h2></div><div className="timeline"><div className="timeline-row"><span className="timeline-year">2016</span><span className="timeline-dot"/><div><h3>{t(locale,'Ọrụ haziri ahazi bidoro','Organized work began')}</h3><p>{t(locale,'Ndị ọrụ afọ ofufo jikọtara ọnụ iji wuo ọdịnaya Igbo na Wikimedia.', 'Volunteers came together to build Igbo-language content across Wikimedia.')}</p></div></div><div className="timeline-row"><span className="timeline-year">2018</span><span className="timeline-dot"/><div><h3>{t(locale,'Nkwenye dịka Wikimedia User Group','Recognized as a Wikimedia User Group')}</h3><p>{t(locale,'Akụkọ obodo kwuru na Wikimedia nyere otu a nkwenye n’afọ a.', 'The community dossier records Wikimedia recognition in this year.')}</p></div></div><span className="timeline-note">{t(locale,'Afọ ndị a bụ akụkọ e kwuru, ọ bụghị nyocha ndekọ ndụ.', 'These dates are reported history, not a live verification.')}</span></div></div></section>
      <section className="gathering-section shell"><div className="gathering-intro"><span className="eyebrow">{t(locale,'04 / KA ANYỊ RỤỌ ỌRỤ ỌNỤ','04 / MAKE SOMETHING TOGETHER')}</span><h2 className="serif">{t(locale,'Otu obodo.<br/>Ọtụtụ ụzọ isonye.','A shared table.<br/>Many ways in.')}</h2><p>{t(locale,'Bịa mụta ihe, sonyere n’ọrụ, ma ọ bụ kesaa ihe ị maara. Ọ dịghị ụzọ pụrụ iche a ga-esi malite.', 'Come to learn, contribute, or share what you know. There is no single right way to begin.')}</p><Link href="/events" className="arrow-link" data-testid="link-gatherings">{t(locale,'Chọta mmemme','Find a gathering')}<ArrowUpRight size={16}/></Link></div>
        <div className="event-peek-list">{events.isLoading ? <Skeleton rows={2}/> : events.error ? <ErrorNotice message={asError(events.error)} retry={() => events.refetch()}/> : upcoming.length ? upcoming.map(e=><EventRow key={e.id} event={e} locale={locale}/>) : <div className="empty-card"><CalendarDays/><h3>{t(locale,'A hazibeghị mmemme ọzọ','No upcoming gatherings yet')}</h3><p>{t(locale,'Lelee ọzọ ka obodo tinyekwuo ụbọchị.','Check back as the community adds dates.')}</p></div>}</div>
      </section>
      <section className="final-call"><div className="shell final-call-inner"><div><span className="eyebrow">{t(locale,'SONYE N’ỌRỤ A','JOIN THE WORK')}</span><h2 className="serif">{t(locale,'Ihe ọmụma na-aba ụba<br/>mgbe anyị kesara ya.','Knowledge grows<br/>when it is shared.')}</h2></div><Link href="/join" className="btn-light" data-testid="button-final-join">{t(locale,'Bido ebe a','Start here')}<ArrowRight size={17}/></Link></div></section>
    </main>
  </PageFrame>;
}

type CommonsPhoto = { src: string; altIg: string; altEn: string; titleIg: string; titleEn: string; author: string; file: string };
const defaultCommonsPhotos: CommonsPhoto[] = [
  {
    src:'https://upload.wikimedia.org/wikipedia/commons/6/6b/Igbo_Masquerade_in_Ezeagu.jpg',
    altIg:'Mmanwụ ndị Igbo na Ezeagu', altEn:'Igbo masquerade in Ezeagu',
    titleIg:'Mmanwụ ndị Igbo na Ezeagu', titleEn:'Igbo masquerade in Ezeagu',
    author:'Chuks Zilo',
    file:'https://commons.wikimedia.org/wiki/File:Igbo_Masquerade_in_Ezeagu.jpg',
  },
  {
    src:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Lagos_Igbo_Hangout_3.0_at_Festac%2C_Lagos_52.jpg/1280px-Lagos_Igbo_Hangout_3.0_at_Festac%2C_Lagos_52.jpg',
    altIg:'Nzukọ ndị Igbo na Festac, Lagos', altEn:'Lagos Igbo Hangout 3.0 at Festac, Lagos',
    titleIg:'Nzukọ ndị Igbo na Festac, Lagos', titleEn:'Lagos Igbo Hangout in Festac',
    author:'MediaMOF',
    file:'https://commons.wikimedia.org/wiki/File:Lagos_Igbo_Hangout_3.0_at_Festac,_Lagos_52.jpg',
  },
];
let commonsPhotos = defaultCommonsPhotos;
function CommonsStory({locale}:{locale:Locale}) {
  return <section className="commons-story shell" aria-labelledby="commons-story-title">
    <div className="commons-story-heading"><span className="eyebrow">{t(locale,'ỌDỊNALA NA NDỤ NDỊ MMADỤ','CULTURE IN THE EVERYDAY')}</span><h2 className="serif" id="commons-story-title">{t(locale,'Ọdịbendị anyị kwesịrị<br/>ịhụ ya, ịnụ ya, ịmara ya.','Culture deserves to be<br/>seen, heard and known.')}</h2><p>{t(locale,'Foto ndị a na-echetara anyị na ihe ọmụma bụkwa ndụ mmadụ, emume na ebe ndị mmadụ na-ezukọ.','These images remind us that knowledge is also lived experience: ceremony, community, and the places where people meet.')}</p></div>
    <div className="commons-photo-grid">{commonsPhotos.map((photo,i)=><figure className={`commons-photo commons-photo-${i+1}`} key={photo.file} data-testid={`commons-photo-${i+1}`}><a className="commons-image-link" href={photo.file} target="_blank" rel="noreferrer" aria-label={`${t(locale,'Lelee faịlụ na Wikimedia Commons','View file on Wikimedia Commons')}: ${locale==='ig'?photo.titleIg:photo.titleEn}`}><img src={photo.src} alt={locale==='ig'?photo.altIg:photo.altEn} loading="eager" fetchPriority="low"/></a><figcaption><span className="commons-photo-title">{locale==='ig'?photo.titleIg:photo.titleEn}</span><span className="commons-credit">{t(locale,'Foto','Photo')} <b>{photo.author}</b> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></span><a className="commons-file-link" href={photo.file} target="_blank" rel="noreferrer" data-testid={`link-commons-file-${i+1}`}>{t(locale,'Faịlụ na Wikimedia Commons','File on Wikimedia Commons')}<ExternalLink size={12}/></a></figcaption></figure>)}</div>
  </section>;
}

function EventRow({ event, locale }: { event: CommunityEvent; locale: Locale }) {
  const date = new Date(event.startsAt);
  return <article className="event-row" data-testid={`event-row-${event.id}`}><div className="event-date"><span>{Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale === 'ig' ? 'ig-NG' : 'en-GB',{day:'2-digit'})}</span><small>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale === 'ig' ? 'ig-NG' : 'en-GB',{month:'short'}).toUpperCase()}</small></div><div className="event-row-info"><span className="eyebrow">{event.project} · {event.location}</span><h3>{locale === 'ig' ? event.titleIg : event.titleEn}</h3></div><ArrowUpRight size={17}/></article>;
}
type CultureSlide = { hash: string; file: string; altIg: string; altEn: string; titleIg: string; titleEn: string; author: string; license: string };
const commonsThumb = (hash: string, file: string, width = 1280) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash}/${file}/${width}px-${file}`;
const commonsFileUrl = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;
const cultureSlides: CultureSlide[] = [
  { hash: '3/3b', file: 'A_community_festival_2.jpg', titleIg: 'Emume Iyom, Onitsha', titleEn: 'Iyom Festival, Onitsha', altIg: 'Ndị mmadụ na emume Iyom n’Onitsha', altEn: 'Crowd at the Iyom Festival in Onitsha', author: 'Goodymeraj', license: 'CC0' },
  { hash: '1/1c', file: 'A_community_celebration_3.jpg', titleIg: 'Mmanwụ Ọkọnkọ na Atani', titleEn: 'Ọkọnkọ masquerade at Atani', altIg: 'Mmanwụ Ọkọnkọ na Atani Day', altEn: 'Ọkọnkọ masquerade at Atani Day', author: 'Goodymeraj', license: 'CC BY 4.0' },
  { hash: '0/02', file: 'A_community_celebration_6.jpg', titleIg: 'Egwu Ojoojo na Atani', titleEn: 'Ojoojo dance troupe, Atani', altIg: 'Otu egwu Ojoojo na Atani', altEn: 'Ojoojo dance troupe at Atani', author: 'Goodymeraj', license: 'CC BY 4.0' },
  { hash: '6/6b', file: 'Igbo_Masquerade_in_Ezeagu.jpg', titleIg: 'Mmanwụ ndị Igbo na Ezeagu', titleEn: 'Igbo masquerade in Ezeagu', altIg: 'Mmanwụ na Ezeagu', altEn: 'Masquerade in Ezeagu', author: 'Chuks Zilo', license: 'Wikimedia Commons' },
  { hash: 'a/a6', file: 'A_maiden_and_her_companions.jpg', titleIg: 'Nwa agbọghọ na ndị enyi ya', titleEn: 'A maiden and her companions', altIg: 'Nwa agbọghọ Igbo na ndị enyi ya', altEn: 'An Igbo maiden and her companions', author: 'Anochili', license: 'CC BY-SA 4.0' },
  { hash: 'b/b7', file: 'A_Royal_Attire.jpg', titleIg: 'Uwe eze ọdịnala Igbo', titleEn: 'A royal Igbo attire', altIg: 'Nwa okorobịa n’uwe ọdịnala Igbo', altEn: 'A young man in Igbo royal attire', author: 'RashyDon24', license: 'CC BY-SA 4.0' },
  { hash: '6/67', file: 'Ayara_smoked_fish.jpg', titleIg: 'Azụ anwụrụ na akwụkwọ nri', titleEn: 'Smoked fish and garden egg', altIg: 'Azụ anwụrụ ọkụ na akwụkwọ nri', altEn: 'Smoked fish served with garden egg', author: 'Odi baby', license: 'CC BY-SA 4.0' },
  { hash: '7/7b', file: '4TH_MEET_UP_IGBO_WIKTIONARY_EDIT_A_THON_4.jpg', titleIg: 'Nzukọ ndezi Wiktionary Igbo', titleEn: 'Igbo Wiktionary edit-a-thon', altIg: 'Ndị otu na nzukọ ndezi Wiktionary Igbo', altEn: 'Members at an Igbo Wiktionary edit-a-thon', author: 'Obihoja', license: 'CC BY-SA 4.0' },
];

function HeroSlideshow() {
  const count = cultureSlides.length;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % count), 7000);
    return () => window.clearInterval(id);
  }, [count]);
  return <div className="hero-slideshow" aria-hidden="true">
    {cultureSlides.map((s, idx) => <span
      key={s.file}
      className={`hero-slide ${idx === i ? 'active' : ''}`}
      style={{ backgroundImage: `url(${commonsThumb(s.hash, s.file, 1280)})` }}
    />)}
    <span className="hero-scrim"/>
  </div>;
}

function CultureSlider({ locale }: { locale: Locale }) {
  const count = cultureSlides.length;
  const [i, setI] = useState(0);
  const hovering = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => { if (!hovering.current) setI((v) => (v + 1) % count); }, 6000);
    return () => window.clearInterval(id);
  }, [count]);
  const go = (n: number) => setI(((n % count) + count) % count);
  return <section className="culture-slider" aria-labelledby="culture-slider-title" onMouseEnter={() => { hovering.current = true; }} onMouseLeave={() => { hovering.current = false; }}>
    <div className="shell culture-slider-head">
      <div><span className="eyebrow">{t(locale, 'ỌDỊBENDỊ NA NDỤ NDỊ MMADỤ', 'CULTURE IN PICTURES')}</span><h2 className="serif" id="culture-slider-title">{t(locale, 'Igbo na-ahụ anya, na-agba egwu, na-abi abụ.', 'Igbo is seen, danced and sung.')}</h2></div>
      <div className="culture-slider-controls">
        <button type="button" onClick={() => go(i - 1)} aria-label={t(locale, 'Nke gara aga', 'Previous slide')} data-testid="culture-prev"><ChevronLeft size={20}/></button>
        <span className="culture-counter" data-testid="culture-counter">{String(i + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
        <button type="button" onClick={() => go(i + 1)} aria-label={t(locale, 'Nke na-abịa', 'Next slide')} data-testid="culture-next"><ChevronRight size={20}/></button>
      </div>
    </div>
    <div className="culture-stage" data-testid="culture-stage">
      {cultureSlides.map((s, idx) => <div className={`culture-slide ${idx === i ? 'active' : ''}`} key={s.file} aria-hidden={idx !== i}>
        <img className="culture-bg" src={commonsThumb(s.hash, s.file, 480)} alt="" aria-hidden="true" loading="lazy"/>
        <a className="culture-figure" href={commonsFileUrl(s.file)} target="_blank" rel="noreferrer">
          <img src={commonsThumb(s.hash, s.file)} alt={locale === 'ig' ? s.altIg : s.altEn} loading={Math.abs(idx - i) <= 1 ? 'eager' : 'lazy'}/>
        </a>
        <div className="culture-caption"><span className="culture-caption-title serif">{locale === 'ig' ? s.titleIg : s.titleEn}</span><span className="culture-credit">{t(locale, 'Foto', 'Photo')} <b>{s.author}</b> · {s.license}</span></div>
      </div>)}
    </div>
    <div className="culture-dots">{cultureSlides.map((s, idx) => <button type="button" key={s.file} className={idx === i ? 'active' : ''} onClick={() => go(idx)} aria-label={t(locale, 'Gaa na foto', 'Go to photo')} data-testid={`culture-dot-${idx}`}/>)}</div>
  </section>;
}

function ProjectsPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const summary = useGetCommunitySummary();
  const pages = useListPages();
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page shell">
    <div className="page-kicker"><Wordmark/><span>01—{String(projects.length).padStart(2,'0')}</span></div><h1 className="serif inner-title">{t(locale,'Ebe anyị na-edekọ<br/>ihe ọmụma.','Places where we<br/>write knowledge.')}</h1><p className="inner-lede">{t(locale,'Ọrụ Wikimedia na-eme ka onye ọ bụla nwee ike isonye. Nyochaa ebe anyị na-arụ ọrụ ma họrọ ebe okwu gị ga-aba uru.', 'Wikimedia projects invite everyone to take part. Explore the places we work and find where your voice belongs.')}</p>
    {summary.error && <ErrorNotice message={asError(summary.error)} retry={() => summary.refetch()}/>}
    <div className="directory-grid">{projects.map((project, i)=><a className={`directory-card directory-${i}`} href={project.url} target="_blank" rel="noreferrer" key={project.id} data-testid={`directory-project-${project.id}`}><div className="directory-top"><span className="project-glyph">{project.mark}</span><span className="eyebrow">WIKIMEDIA / {String(i+1).padStart(2,'0')}</span><ArrowUpRight size={17}/></div><h2 className="serif">{project.name}</h2><p>{locale === 'ig' ? project.detailIg : project.detailEn}</p><span className="directory-action">{t(locale,'Gaa n’ọrụ ahụ','Visit project')}<ExternalLink size={13}/></span></a>)}</div>
    <div className="directory-footnote"><ShieldCheck size={17}/><p>{t(locale,'Ọrụ ndị a bụ akụkụ nke ezinụlọ Wikimedia. Ihe ọmụma onye ọ bụla kesara na-agbaso iwu ọrụ ọ bụla.', 'These projects belong to the wider Wikimedia movement. Contributions are subject to each project’s community policies.')}</p></div>
    {!pages.isLoading && pages.data?.length ? <div className="cms-link-list"><span className="eyebrow">{t(locale,'GỤKWUO','READ MORE')}</span>{pages.data.filter(p=>p.published).map(p=><Link key={p.slug} href={`/about/${p.slug}`} data-testid={`link-cms-${p.slug}`}>{locale==='ig'?p.titleIg:p.titleEn}<ArrowRight size={15}/></Link>)}</div> : null}
  </main></PageFrame>;
}
function EventFeature({ event, locale, index }: { event: CommunityEvent; locale: Locale; index: number }) {
  const loc = locale === 'ig' ? 'ig-NG' : 'en-GB';
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const day = start.toLocaleDateString(loc, { day: '2-digit' });
  const monthYear = start.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
  const time = start.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  const endTime = end ? end.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }) : null;
  const hasGeo = typeof event.latitude === 'number' && typeof event.longitude === 'number';
  const lat = event.latitude as number | undefined;
  const lon = event.longitude as number | undefined;
  const mapSrc = hasGeo ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lon as number) - 0.008}%2C${(lat as number) - 0.006}%2C${(lon as number) + 0.008}%2C${(lat as number) + 0.006}&layer=mapnik&marker=${lat}%2C${lon}` : '';
  const mapLink = hasGeo ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}` : '';
  return <article className="event-feature" data-testid={`event-card-${event.id}`}>
    <div className="event-feature-media">
      {event.imageUrl
        ? <img className="event-feature-photo" src={event.imageUrl} alt={locale === 'ig' ? event.titleIg : event.titleEn} loading="lazy"/>
        : <span className="event-feature-placeholder" aria-hidden="true"><b className="serif">{day}</b><span>{monthYear}</span></span>}
      <span className={`event-flag ${event.status === 'upcoming' ? 'is-upcoming' : 'is-past'}`}>{event.status === 'upcoming' ? t(locale, 'NA-ABỊA', 'UPCOMING') : t(locale, 'EMECHARA', 'PAST')}</span>
    </div>
    <div className="event-feature-body">
      <div className="event-feature-top"><span className="eyebrow">{event.project}</span><span className="event-feature-index">{String(index + 1).padStart(2, '0')}</span></div>
      <h2 className="serif">{locale === 'ig' ? event.titleIg : event.titleEn}</h2>
      <div className="event-facts">
        <div className="event-fact"><CalendarDays size={15}/><span className="event-fact-label">{t(locale, 'Ụbọchị', 'Date')}</span><span className="event-fact-value">{start.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        <div className="event-fact"><Clock size={15}/><span className="event-fact-label">{t(locale, 'Oge', 'Time')}</span><span className="event-fact-value">{time}{endTime ? ` – ${endTime}` : ''}</span></div>
        <div className="event-fact"><MapPin size={15}/><span className="event-fact-label">{t(locale, 'Ebe', 'Venue')}</span><span className="event-fact-value">{event.venue || event.location}</span></div>
      </div>
      <p className="event-feature-desc">{locale === 'ig' ? event.descriptionIg : event.descriptionEn}</p>
      <div className="event-feature-actions">
        {mapLink ? <a className="arrow-link" href={mapLink} target="_blank" rel="noreferrer" data-testid={`event-map-link-${event.id}`}>{t(locale, 'Hụ ebe ọ dị na map', 'Open in maps')}<ArrowUpRight size={15}/></a> : null}
        {event.reportUrl ? <a className="arrow-link" href={event.reportUrl} target="_blank" rel="noreferrer">{t(locale, 'Gụọ akụkọ', 'Read the report')}<ArrowUpRight size={15}/></a> : null}
      </div>
      {hasGeo ? <div className="event-map"><iframe title={`${event.titleEn} — map`} src={mapSrc} loading="lazy"/></div> : null}
    </div>
  </article>;
}

function EventsPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const events = useListEvents();
  const published = (events.data ?? []).filter(e => e.published);
  const upcoming = published.filter(e => e.status === 'upcoming').sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = published.filter(e => e.status !== 'upcoming').sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  const hasAny = upcoming.length + past.length > 0;
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page events-page shell">    <header className="events-hero">
      <div className="page-kicker"><Wordmark/><span>GATHER · LEARN · CONTRIBUTE</span></div>
      <h1 className="serif inner-title">{t(locale, 'Ka anyị zute<br/>n’otu ọnụ.', 'Good work happens<br/>in good company.')}</h1>
      <p className="inner-lede">{t(locale, 'Nzukọ, mmemme ide ihe na ohere ịmụkọ ihe ọnụ. Ndị mbido na ndị nwere ahụmahụ — unu abụọ dị mkpa.', 'Meet-ups, edit-a-thons and moments of shared learning. First-time editors and experienced contributors both belong here.')}</p>
    </header>
    {events.isLoading ? <Skeleton rows={4}/> : events.error ? <ErrorNotice message={asError(events.error)} retry={() => events.refetch()}/> : hasAny ? <>
      {upcoming.length ? <section className="events-group">
        <div className="events-group-head"><span className="eyebrow">{t(locale, 'NA-ABỊA', 'UPCOMING')}</span><h2 className="serif">{t(locale, 'Ihe na-abịa n’ihu', 'What’s coming up')}</h2></div>
        <div className="events-feature-list">{upcoming.map((e, i) => <EventFeature key={e.id} event={e} locale={locale} index={i}/>)}</div>
      </section> : null}
      {past.length ? <section className="events-group past">
        <div className="events-group-head"><span className="eyebrow">{t(locale, 'EMECHARA', 'PAST EVENTS')}</span><h2 className="serif">{t(locale, 'Ncheta nke anyị', 'Where we have been')}</h2></div>
        <div className="events-feature-list">{past.map((e, i) => <EventFeature key={e.id} event={e} locale={locale} index={i}/>)}</div>
      </section> : null}
    </> : <div className="empty-feature"><CalendarDays size={32}/><span className="eyebrow">THE NEXT PAGE IS YOURS</span><h2 className="serif">{t(locale, 'Obodo na-ahazi nzukọ ọzọ.', 'The community is planning its next gathering.')}</h2><p>{t(locale, 'Enweghị mmemme e bipụtara ugbu a. Banye n’òtù ka ị nụ banyere ohere ndị na-abịa.', 'There are no published events at the moment. Join the community to hear when new opportunities arrive.')}</p><Link className="btn-primary" href="/join" data-testid="button-events-join">{t(locale, 'Banye n’ọrụ', 'Join the work')}<ArrowRight size={16}/></Link></div>}
  </main></PageFrame>;
}

function ContributorCard({ contributor, locale }: { contributor: CommunityContributor; locale: Locale }) {
  return <article className="contributor-card" data-testid={`contributor-${contributor.memberId}`}>
    <header className="contributor-head"><span className="contributor-mark">{contributor.displayName.slice(0, 1).toUpperCase()}</span><div><h3>{contributor.displayName}</h3><span className="contributor-total">{contributor.totalContributions.toLocaleString(locale === 'ig' ? 'ig-NG' : 'en-GB')} {t(locale, 'onyinye', 'contributions')}</span></div></header>
    <ul className="contributor-projects">{contributor.byProject.map(b => <li key={b.project}>
      <div className="contributor-project-top"><span className="project-glyph small">{projectById(b.project)?.mark ?? 'W'}</span><b>{projectLabel(b.project, locale)}</b><span className="contributor-count">{b.available ? b.contributions.toLocaleString(locale === 'ig' ? 'ig-NG' : 'en-GB') : '—'}</span></div>
      <div className="contributor-accounts">{b.accounts.map(a => { const url = projectUserUrl(b.project, a); return url ? <a key={a} href={url} target="_blank" rel="noreferrer">{a}<ExternalLink size={11}/></a> : <span key={a}>{a}</span>; })}</div>
    </li>)}</ul>
  </article>;
}
function CommunityPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const query = useGetCommunityContributors();
  const [filter, setFilter] = useState('all');
  const contributors = query.data ?? [];
  const activeProjects = projects.filter(p => contributors.some(c => c.byProject.some(b => b.project === p.id && b.available)));
  const visible = filter === 'all' ? contributors : contributors.filter(c => c.byProject.some(b => b.project === filter && b.available));
  const grandTotal = contributors.reduce((n, c) => n + c.totalContributions, 0);
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page shell">
    <div className="page-kicker"><Wordmark/><span>CONTRIBUTORS / NDỊ NYERE AKA</span></div>
    <h1 className="serif inner-title">{t(locale,'Ọrụ ndị otu anyị,<br/>n’ihu ọha.','Our members’ work,<br/>out in the open.')}</h1>
    <h1 className="serif inner-title">{t(locale,'Ọrụ ndị otu anyị,<br/>n’ihu ọha.','Our members’ work,<br/>out in the open.')}</h1>
    <p className="inner-lede">{t(locale,'Ndị otu anyị na-ede, na-atụgharị ma na-ese ihe n’ọrụ Wikimedia dị iche iche. Naanị ndị otu nyere nkwenye ka e gosiri ebe a — aha njirimara na ngụkọta onyinye ha n’otu ọrụ ọ bụla.','Our members write, translate and share across the Wikimedia projects. Only members who opted in appear here — their usernames and per-project contribution totals.')}</p>
    {query.isLoading?<Skeleton rows={4}/>:query.error?<ErrorNotice message={asError(query.error)} retry={()=>query.refetch()}/>:contributors.length?<>
      <div className="metrics-grid contributor-metrics" data-testid="contributor-metrics">
        <div className="metric"><strong>{contributors.length}</strong><span>{t(locale,'ndị nyere aka','contributors')}</span><small>{t(locale,'Ndị otu nyere nkwenye','Consented members')}</small></div>
        <div className="metric"><strong>{grandTotal.toLocaleString(locale === 'ig' ? 'ig-NG' : 'en-GB')}</strong><span>{t(locale,'onyinye e dekọrọ','recorded contributions')}</span><small>{t(locale,'Nchịkọta Wikimedia','Wikimedia totals')}</small></div>
        <div className="metric"><strong>{activeProjects.length}</strong><span>{t(locale,'ọrụ e nwere','active projects')}</span><small>{t(locale,'Ọrụ Wikimedia','Wikimedia projects')}</small></div>
      </div>
      <div className="contributor-filters" role="tablist" aria-label={t(locale,'Zaa site n’ọrụ','Filter by project')}><button type="button" className={filter==='all'?'active':''} onClick={()=>setFilter('all')} data-testid="filter-all">{t(locale,'Ha niile','All projects')}</button>{activeProjects.map(p=><button type="button" key={p.id} className={filter===p.id?'active':''} onClick={()=>setFilter(p.id)} data-testid={`filter-${p.id}`}>{locale==='ig'?p.ig:p.en}</button>)}</div>
      <div className="contributor-grid">{visible.map(c=><ContributorCard key={c.memberId} contributor={c} locale={locale}/>)}</div>
      <p className="contributor-note"><ShieldCheck size={16}/>{t(locale,'E gosiri naanị ndị otu nyere nkwenye doro anya. Ọnụ ọgụgụ sitere na Wikimedia API ma nwee ike ịdị ntakịrị ihe karịa ndekọ ndụ.','Only members with explicit consent are shown. Totals come from the Wikimedia API and may be slightly behind live counts.')}</p>
    </>:<div className="empty-feature"><UsersRound size={32}/><span className="eyebrow">NO CONTRIBUTORS YET</span><h2 className="serif">{t(locale,'Ọ nwebeghị ndị otu nyere nkwenye.','No consented contributors yet.')}</h2><p>{t(locale,'Mgbe ndị otu nyere nkwenye, a ga-egosi aha njirimara ha na onyinye ha n’ebe a.','When members opt in, their Wikimedia usernames and contribution totals will appear here.')}</p><Link className="btn-primary" href="/join">{t(locale,'Banye n’ọtù','Join the community')}<ArrowRight size={16}/></Link></div>}
  </main></PageFrame>;
}

function GalleryPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const categories = useGetGalleryCategories();
  const [activeId, setActiveId] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<GalleryMediaItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryMediaItem | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const touchX = useRef<number | null>(null);
  const list: GalleryCategory[] = categories.data?.categories ?? [];
  useEffect(() => {
    if (!activeId && list.length) setActiveId((list.find((c) => c.featured) ?? list[0]).id);
  }, [activeId, list]);
  const active = list.find((c) => c.id === activeId);
  const media = useGetGalleryMedia(
    { category: activeId, limit: 24, ...(cursor ? { cursor } : {}) },
    { query: { enabled: activeId.length > 0 } },
  );
  useEffect(() => {
    if (!media.data || media.data.categoryId !== activeId) return;
    setItems((prev) => (cursor ? [...prev, ...media.data!.items] : media.data!.items));
    setNext(media.data.nextCursor);
  }, [media.data, activeId, cursor]);
  const count = items.length;
  const goto = (target: number) => { if (!count) return; setIndex(((target % count) + count) % count); };
  const step = (delta: number) => goto(index + delta);
  const selectCategory = (id: string) => { setActiveId(id); setCursor(undefined); setItems([]); setNext(null); setIndex(0); setLightbox(null); };
  useEffect(() => {
    if (!playing || count <= 1) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [playing, count]);
  useEffect(() => {
    const el = railRef.current?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [index]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  };
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    touchX.current = null;
  };
  const current = items[index];
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page shell">
    <div className="page-kicker"><Wordmark/><span>GALLERY / ỌBA FOTO</span></div>
    <h1 className="serif inner-title">{t(locale,'Foto anyị,<br/>si na Commons.','Our photos,<br/>straight from Commons.')}</h1>
    <p className="inner-lede">{t(locale,'Foto ndị otu anyị na ndị mmekọ anyị kesara na Wikimedia Commons — nwere ikike efu maka onye ọ bụla iji.', 'Photographs shared by our members and partners on Wikimedia Commons — freely licensed for anyone to reuse.')}</p>
    {categories.isLoading ? <Skeleton rows={3}/> : categories.error ? <ErrorNotice message={asError(categories.error)} retry={()=>categories.refetch()}/> : <>
      <div className="gallery-categories" role="tablist" aria-label={t(locale,'Họrọ otu','Choose a category')}>{list.map((c) => <button type="button" key={c.id} role="tab" aria-selected={c.id===activeId} className={c.id===activeId?'active':''} onClick={()=>selectCategory(c.id)} data-testid={`gallery-category-${c.id}`}><b>{locale==='ig'?c.titleIg:c.titleEn}</b><small>{c.files.toLocaleString(locale==='ig'?'ig-NG':'en-GB')} {t(locale,'faịlụ','files')}</small></button>)}</div>
      {active && <p className="gallery-category-note">{locale==='ig'?active.descriptionIg:active.descriptionEn}</p>}
      {media.isLoading && !items.length ? <Skeleton rows={4}/> : media.error ? <ErrorNotice message={asError(media.error)} retry={()=>media.refetch()}/> : items.length ? <>
        <div className="gallery-viewer" data-testid="gallery-grid">
          <div className="gallery-hero" tabIndex={0} role="group" aria-roledescription="carousel" aria-label={active ? (locale==='ig'?active.titleIg:active.titleEn) : t(locale,'Ọba foto','Photo gallery')} onKeyDown={onKey} onMouseEnter={()=>setPlaying(false)} onMouseLeave={()=>setPlaying(true)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="gallery-stage">
              <div className="gallery-track" style={{ transform: `translate3d(-${index * 100}%,0,0)` }}>
                {items.map((m, i) => <button type="button" key={m.pageId} className="gallery-slide" aria-hidden={i!==index} tabIndex={i===index?0:-1} onClick={()=>setLightbox(m)} aria-label={m.title} data-testid={`gallery-item-${m.pageId}`}>
                  {Math.abs(i - index) <= 1 ? <img src={m.thumbUrl} alt={m.title} loading={i===index?'eager':'lazy'} draggable={false}/> : null}
                </button>)}
            </div>
            {count > 1 && <>
              <button type="button" className="gallery-nav prev" onClick={()=>step(-1)} aria-label={t(locale,'Nke gara aga','Previous image')}><ChevronLeft/></button>
              <button type="button" className="gallery-nav next" onClick={()=>step(1)} aria-label={t(locale,'Nke na-esote','Next image')}><ChevronRight/></button>
            </>}
            {current && <div className="gallery-caption"><span className="gallery-caption-title">{current.title}</span>{current.license && <small>{current.license}</small>}</div>}
            {count > 1 && <div className="gallery-controls">
              <button type="button" className="gallery-play" onClick={()=>setPlaying(p=>!p)} aria-label={playing?t(locale,'Kwụsị ntụgharị','Pause slideshow'):t(locale,'Malite ntụgharị','Play slideshow')}>{playing?<Pause size={14}/>:<Play size={14}/>}</button>
              <span className="gallery-counter">{(index+1).toLocaleString()} / {count.toLocaleString()}</span>
            </div>}
          </div>
          </div>
          {playing && count>1 && <span key={index} className="gallery-progress" aria-hidden="true"/>}
          <div className="gallery-rail" ref={railRef} role="list" aria-label={t(locale,'Foto ndị ọzọ','More photos')}>
            {items.map((m,i)=><button type="button" role="listitem" key={m.pageId} data-thumb={i} className={`gallery-rail-item ${i===index?'active':''}`} onClick={()=>goto(i)} aria-label={m.title} aria-current={i===index} data-testid={`gallery-thumb-${m.pageId}`}><img src={m.thumbUrl} alt="" loading="lazy"/></button>)}
          </div>
        </div>
        <div className="gallery-more">{next ? <button type="button" className="btn-primary" disabled={media.isFetching} onClick={()=>setCursor(next)} data-testid="button-gallery-more">{media.isFetching?<LoaderCircle className="spin" size={16}/>:t(locale,'Gosi ihe ọzọ','Load more')}<ArrowDownRight size={16}/></button> : <span className="status-pill">{t(locale,'Ọ gwụla','End of category')}</span>}</div>
      </> : <div className="empty-feature"><Images size={32}/><span className="eyebrow">NO MEDIA YET</span><h2 className="serif">{t(locale,'Enweghị faịlụ n’otu a ugbu a.','Nothing in this category yet.')}</h2><p>{t(locale,'Họrọ otu ọzọ, ma ọ bụ lee Wikimedia Commons maka ihe niile.','Choose another category, or browse Wikimedia Commons for everything.')}</p><a className="btn-primary" href={`https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(active?.category ?? 'Igbo Wikimedians User Group')}`} target="_blank" rel="noreferrer">{t(locale,'Mepee na Commons','Open on Commons')}<ArrowUpRight size={16}/></a></div>}
    </>}
    {lightbox && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.title} onClick={()=>setLightbox(null)}><div className="gallery-lightbox-body" onClick={(e)=>e.stopPropagation()}><button type="button" className="gallery-lightbox-close" onClick={()=>setLightbox(null)} aria-label={t(locale,'Mechie','Close')}><X/></button><img src={lightbox.url || lightbox.thumbUrl} alt={lightbox.title}/><div className="gallery-lightbox-meta"><h2 className="serif">{lightbox.title}</h2>{lightbox.caption && <p>{lightbox.caption}</p>}<span className="gallery-credit">{lightbox.artist ?? lightbox.credit ?? t(locale,'Onye nyere aka amaghị','Unknown author')}{lightbox.license ? ` · ${lightbox.license}` : ''}</span><a className="arrow-link" href={lightbox.descriptionUrl} target="_blank" rel="noreferrer">{t(locale,'Lee peeji faịlụ','View file page')}<ArrowUpRight size={15}/></a></div></div></div>}
  </main></PageFrame>;
}

function DictionaryPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const result = useSearchDictionary({ q: query }, { query: { enabled: query.length > 0 } });
  const submit = (e: FormEvent) => { e.preventDefault(); setQuery(term.trim()); };
  const providerLabel = result.data?.provider === 'igbo-api' ? t(locale,'Igbo API','Igbo API') : result.data?.provider === 'wiktionary' ? t(locale,'Wiktionary Igbo','Igbo Wiktionary') : t(locale,'Enweghị isi','No source');
  const entries = result.data?.entries ?? [];
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page shell">
    <div className="page-kicker"><Wordmark/><span>DICTIONARY / NKỌWA OKWU</span></div>
    <h1 className="serif inner-title">{t(locale,'Chọta okwu Igbo,<br/>nụ otú e si eji ya.','Find an Igbo word,<br/>see how it is used.')}</h1>
    <p className="inner-lede">{t(locale,'Nchọgharị na-ewere data site na Igbo API ma ọ bụ Wiktionary Igbo, na-egosi nkọwa na ihe atụ e jiri okwu mee.', 'Search draws on the Igbo API or Igbo Wiktionary, showing definitions alongside real example sentences.')}</p>
    <form className="dictionary-search" onSubmit={submit} role="search">
      <Search size={18}/>
      <input className="input" value={term} onChange={(e)=>setTerm(e.target.value)} placeholder={t(locale,'Dee okwu Igbo. ka ị chọta…','Type an Igbo word to search…')} aria-label={t(locale,'Chọta okwu','Search word')} data-testid="input-dictionary-query"/>
      <button type="submit" className="btn-primary" disabled={!term.trim()} data-testid="button-dictionary-search">{t(locale,'Chọta','Search')}<ArrowRight size={16}/></button>
    </form>
    {query.length > 0 && <div className="dictionary-results">
      {result.isLoading ? <Skeleton rows={3}/> : result.error ? <ErrorNotice message={asError(result.error)} retry={()=>result.refetch()}/> : entries.length ? <>
        <div className="dictionary-header"><span className="eyebrow">{entries.length} {t(locale,'nkọwa','result(s)')}</span><span className="status-pill">{providerLabel}</span></div>
        {entries.map((entry, i) => <article className="dictionary-entry" key={`${entry.word}-${i}`} data-testid={`dictionary-entry-${i}`}>
          <header><h2 className="serif">{entry.word}</h2>{entry.pronunciation && <span className="dictionary-pron">{entry.pronunciation}</span>}{entry.audioUrl && <audio className="dictionary-audio" controls preload="none" src={entry.audioUrl}/>}</header>
          {entry.definitions.length > 0 && <ol className="dictionary-defs">{entry.definitions.map((def, j) => <li key={j}>{def}</li>)}</ol>}
          {entry.examples.length > 0 && <div className="dictionary-examples">{entry.examples.map((ex, j) => <p key={j}><q className="ig">{ex.igbo}</q>{ex.english && <span>{ex.english}</span>}</p>)}</div>}
          {entry.url && <a className="arrow-link" href={entry.url} target="_blank" rel="noreferrer">{t(locale,'Lee isi mmalite','View source')}<ArrowUpRight size={15}/></a>}
        </article>)}
      </> : <div className="empty-feature"><BookOpen size={32}/><span className="eyebrow">NO MATCH</span><h2 className="serif">{t(locale,'Ahụghị okwu a.','No entry found.')}</h2><p>{t(locale,'Nwaa okwu ọzọ, ma ọ bụ ndepụta okwu dị mkpụmkpụ karị. Ọ bụrụ na Igbo API adịghị, Wiktionary na-aza.', 'Try another spelling or a shorter root. When the Igbo API is unavailable, Wiktionary answers instead.')}</p></div>}
    </div>}
  </main></PageFrame>;
}

function JoinPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const { isSignedIn } = useAuth();
  const tiers = useListMembershipTiers();
  const register = useRegisterMember();
  const cache = useQueryClient();
  const [tier, setTier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [accounts, setAccounts] = useState<Record<string,string>>({});
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const paystack=usePaymentConfig();
  const [payError,setPayError]=useState('');
  const activeTiers=(tiers.data??[]).filter(x=>x.active);
  const hasWikiUsername=Object.values(accounts).some(username=>username.trim().length>0);
  useEffect(()=>{ if(!tier&&activeTiers.length) setTier((activeTiers.find(x=>x.priceNgn===0)??activeTiers[0])?.id??''); },[tier,activeTiers]);
  const selectedTier=activeTiers.find(x=>x.id===tier);
  const paidTier=!!selectedTier&&selectedTier.priceNgn>0;
  const checkoutReady=paystack.data?.enabled===true;
  const hasFreeTier=activeTiers.some(x=>x.priceNgn===0);
  const submit=(ev:FormEvent)=>{ev.preventDefault(); if(!isSignedIn||!tier||!selectedTier)return; if(paidTier&&!checkoutReady){setPayError(t(locale,'Ịkwụ ụgwọ n’ịntanetị adịghị ugbu a.','Online checkout is not configured yet.'));return;} setPayError(''); register.mutate({data:{displayName,location,tierId:tier,shareWikiStats:consent,wikiAccounts:Object.entries(accounts).filter(([,username])=>username.trim()).map(([project,username])=>({project:project as WikimediaAccount['project'],username:username.trim()}))}}, {onSuccess:()=>{ cache.invalidateQueries({queryKey:getGetMyMembershipQueryKey()});cache.invalidateQueries({queryKey:getListMembersQueryKey()});cache.invalidateQueries({queryKey:getGetCommunityContributorsQueryKey()});if(paidTier){initializePayment({purpose:'membership',tierId:selectedTier.id}).then(r=>{window.location.href=r.authorizationUrl;}).catch(err=>{setPayError(err instanceof Error?err.message:t(locale,'Enweghị ike ịmalite ịkwụ ụgwọ.','Could not start checkout.'));setDone(true);});}else{setDone(true);}}});};
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page join-page shell"><div className="page-kicker"><Wordmark/><span>MEMBERSHIP / ỊBỊ N’ỌTÚ</span></div><div className="join-intro"><div><h1 className="serif inner-title">{t(locale,'Bịa dịka ị dị.<br/>Soro n’ọrụ a.','Bring what you know.<br/>Find what you can grow.')}</h1><p className="inner-lede">{t(locale,'Ịbụ onye otu pụtara isonye n’obodo na-eme ka asụsụ Igbo pụta ìhè na Wikimedia. Kọwaa onwe gị n’ụzọ dị gị mma.', 'Membership connects you to a community making Igbo visible across Wikimedia. Tell us a little about yourself, in your own way.')}</p></div><div className="join-aside"><span className="eyebrow">A NOTE BEFORE YOU BEGIN</span><p>{t(locale,'A ga-egosipụta naanị ụgwọ ndị otu a haziri n’ezie. Ọ bụrụ na ọnweghị nhọrọ dị, biko kpọtụrụ obodo.', 'Only configured membership options appear here. If no option is available, please contact the community.')}</p></div></div>
    {done ? <div className="success-panel" data-testid="status-registration-success"><span className="success-mark"><Check/></span><span className="eyebrow">EDEBANYERE / RECEIVED</span><h2 className="serif">{t(locale,'Daalụ maka ịbịa.','Thank you for stepping in.')}</h2><p>{t(locale,'E zigara arịrịọ otu gị. Ọkwa gị nwere ike ichere nyocha ndị nchịkwa obodo.', 'Your membership request was received. Your status may remain pending while community administrators review it.')}</p><Link href="/member" className="btn-primary" data-testid="button-member-portal">{t(locale,'Gaa na oghere m','Go to my space')}<ArrowRight size={16}/></Link></div>
    : <form className="join-form" onSubmit={submit}>
      <div className="join-step"><div className="step-no">01</div><div className="step-body"><span className="eyebrow">{t(locale,'HỌRỌ Ọ̀TÚ','CHOOSE A MEMBERSHIP')}</span><h2 className="serif">{t(locale,'Ụzọ isonye','A way to belong')}</h2>
        {tiers.isLoading?<Skeleton rows={2}/>:tiers.error?<ErrorNotice message={asError(tiers.error)} retry={()=>tiers.refetch()}/>:activeTiers.length?<><div className="tier-options">{activeTiers.map(item=><label className={`tier-option ${tier===item.id?'selected':''} ${item.priceNgn>0&&!checkoutReady?'tier-unavailable':''}`} key={item.id} data-testid={`tier-option-${item.id}`}><input type="radio" name="tier" checked={tier===item.id} disabled={item.priceNgn>0&&!checkoutReady} onChange={()=>setTier(item.id)}/><span className="tier-radio"/><span className="tier-name"><b>{locale==='ig'?item.nameIg:item.nameEn}</b><small>{locale==='ig'?item.descriptionIg:item.descriptionEn}</small>{item.priceNgn>0&&!checkoutReady&&<small className="tier-checkout-warning">{t(locale,'Ịkwụ ụgwọ n’ịntanetị adịghị ugbu a','Online checkout is not configured')}</small>}</span><span className="tier-price">{item.priceNgn===0?t(locale,'N’efu','No fee'):new Intl.NumberFormat(locale==='ig'?'ig-NG':'en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(item.priceNgn)}<small>{item.interval==='free'?'':` / ${item.interval}`}</small></span></label>)}</div>{!checkoutReady&&!hasFreeTier&&<div className="notice paid-unavailable-notice"><CircleHelp size={18}/><span>{t(locale,'Nhọrọ niile nwere ụgwọ; enweghị ike ịdebanye aha n’enweghị usoro ịkwụ ụgwọ ahaziri.','Every available tier has a fee. Registration is unavailable until checkout is configured.')}</span></div>}</>:<div className="notice"><CircleHelp size={18}/><span>{t(locale,'E nwebeghị ọkwa otu a haziri. A naghị egosi ụgwọ e chepụtara echepụta.','Membership tiers have not been configured yet. No fee is being assumed.')}</span></div>}
      </div></div>
      <div className="join-step"><div className="step-no">02</div><div className="step-body"><span className="eyebrow">{t(locale,'GWA ANYỊ BANYERE GỊ','TELL US ABOUT YOU')}</span><h2 className="serif">{t(locale,'Okwu ole gbasara gị.','A few words about you.')}</h2><div className="form-grid"><label>{t(locale,'Aha ị chọrọ iji','Name you go by')}<input className="input" required value={displayName} onChange={e=>setDisplayName(e.target.value)} data-testid="input-display-name" placeholder={t(locale,'Aha gị','Your name')}/></label><label>{t(locale,'Ebe ị nọ (ọ bụrụ na i chọrọ)','Where you are (optional)')}<input className="input" value={location} onChange={e=>setLocation(e.target.value)} data-testid="input-location" placeholder={t(locale,'Obodo / mba','City / country')}/></label></div>
         <details className="wiki-account-fields"><summary>{t(locale,'Tinye akaụntụ Wikimedia gị (ọ bụrụ na i nwere)','Add Wikimedia accounts (if you have them)')}<ChevronDown size={16}/></summary><p>{t(locale,'Aha njirimara ndị a bụ naanị maka njikọ akaụntụ. Naanị ọnụ ọgụgụ nchịkọta nwere nkwenye ka a ga-eji maka stats.','Usernames are collected only to link accounts. Only consented, aggregate totals may be used for statistics.')}</p><div className="account-grid">{projects.map(p=><label key={p.id}>{p.name}<input className="input" maxLength={255} value={accounts[p.id]??''} onChange={e=>setAccounts({...accounts,[p.id]:e.target.value})} data-testid={`input-wiki-${p.id}`} placeholder="Username"/></label>)}</div></details>
         {consent&&!hasWikiUsername&&<div className="notice" role="status"><CircleHelp size={18}/><span>{t(locale,'Tinye opekata mpe otu aha njirimara Wikimedia ka e wee gbakọọ stats.','Add at least one Wikimedia username to enable contribution statistics.')}</span></div>}
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} data-testid="input-stats-consent"/><span><b>{t(locale,'Ekwere m ka e gosi aha njirimara Wikimedia m na ngụkọta onyinye m n’ihu ọha.','I consent to my Wikimedia usernames and contribution totals being shown publicly.')}</b><small>{t(locale,'Nke a bụ nhọrọ. Ọ bụrụ na i kwe, aha njirimara Wikimedia gị na ngụkọta onyinye n’otu ọrụ ọ bụla ga-apụta n’ihu ọha na peeji ndị nyere aka. Ị nwere ike wepụ nkwenye gị oge ọ bụla.','This is optional. If you opt in, your Wikimedia usernames and per-project contribution counts appear on the public contributors page. You can withdraw consent at any time.')}</small></span></label>
      </div></div>
      {register.error&&<ErrorNotice message={asError(register.error)}/>}
      {payError&&<div className="notice" role="alert"><CircleHelp size={18}/><span>{payError}</span></div>}
      <div className="join-submit"><span>{t(locale,'Mgbe i zipụrụ, ọkwa nwere ike ịbụ pending ruo mgbe e nyochara ya.','After submission, membership may stay pending until reviewed.')}</span>{isSignedIn?<button className="btn-primary" type="submit" disabled={!tier||(paidTier&&!checkoutReady)||(consent&&!hasWikiUsername)||register.isPending} data-testid="button-submit-membership">{register.isPending?<LoaderCircle className="spin" size={16}/>:paidTier?t(locale,'Gaa n’ịkwụ ụgwọ','Continue to payment'):t(locale,'Zipu arịrịọ otu','Submit membership request')}<ArrowRight size={16}/></button>:<div className="join-auth-notice"><span>{t(locale,'Banye ma ọ bụ mepụta akaụntụ iji debanye aha.','Sign in or create an account to register.')}</span><div><Link href="/sign-in">{t(locale,'Banye','Sign in')}</Link><Link href="/sign-up">{t(locale,'Mepụta akaụntụ','Create account')}</Link></div></div>}</div>
    </form>}</main></PageFrame>;
}
function DonatePage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const query = useGetSiteSettings();
  const paystack = usePaymentConfig();
  const settings = query.data;
  const online = paystack.data?.enabled === true;
  const ready = !!settings?.donationEnabled && !!settings.donationUrl;
  const [amount, setAmount] = useState(5000);
  const [note, setNote] = useState('');
  const donate = () => {
    setNote('');
    if (!Number.isFinite(amount) || amount < 100) {
      setNote(t(locale, 'Tinye ego ruru ₦100 ma ọ bụ karịa.', 'Enter an amount of ₦100 or more.'));
      return;
    }
    initializePayment({ purpose: 'donation', amountNgn: Math.floor(amount) })
      .then((r) => { window.location.href = r.authorizationUrl; })
      .catch((err) => setNote(err instanceof Error ? err.message : t(locale, 'Enweghị ike ịmalite ịkwụ ụgwọ.', 'Could not start checkout.')));
  };
  return (
    <PageFrame locale={locale} setLocale={setLocale}>
      <main className="inner-page donate-page shell">
        <div className="page-kicker"><Wordmark/><span>SUPPORT / KWADO</span></div>
        <div className="donate-content">
          <div>
            <span className="eyebrow">{t(locale,'NKWADO OBODO','COMMUNITY SUPPORT')}</span>
            <h1 className="serif inner-title">{t(locale,'Kwado okwu<br/>ka ọ gaa n’ihu.','Help keep our<br/>words moving.')}</h1>
            <p className="inner-lede">{t(locale,'Nkwado na-enyere ndị afọ ofufo aka iwulite ihe ọmụma dị n’efu, n’asụsụ Igbo. Onyinye na-aga naanị n’ebe obodo haziri.', 'Support helps volunteers build open knowledge in Igbo. Donations should go only to a destination configured by the community.')}</p>
          </div>
          <div className="donation-box" data-testid="donation-configuration">{query.isLoading?<Skeleton rows={3}/>:query.error?<ErrorNotice message={asError(query.error)} retry={()=>query.refetch()}/>:online?<><span className="eyebrow">{t(locale,'ONYENYE N’ỤZỌ NKEONWE','GIVE ONLINE')}</span><h2 className="serif">{t(locale,'Nkwado gị dị mkpa.','Your support matters.')}</h2><p>{t(locale,'Họrọ ego ị chọrọ inye. A ga-akwụ ụgwọ n’enweghị nsogbu site na Paystack.','Choose an amount. You’ll pay securely with Paystack.')}</p><div className="donation-amounts">{[1000,2500,5000,10000,25000].map(v=><button type="button" key={v} className={`donation-amount ${amount===v?'active':''}`} onClick={()=>setAmount(v)}>{formatNgn(v)}</button>)}</div><label className="donation-custom">{t(locale,'Ma ọ bụ ego ọzọ (₦)','Or another amount (₦)')}<input className="input" type="number" min={100} step={100} value={amount} onChange={e=>setAmount(Math.floor(Number(e.target.value)))} data-testid="input-donation-amount"/></label>{note&&<div className="notice" role="alert"><CircleHelp size={18}/><span>{note}</span></div>}<button className="btn-primary" type="button" onClick={donate} data-testid="button-donate-online">{t(locale,'Nye ugbu a','Give now')}<Heart size={16}/></button></>:ready?<><span className="eyebrow">{t(locale,'ONYENYE E HAZIRI','CONFIGURED DESTINATION')}</span><h2 className="serif">{t(locale,'Nkwado gị dị mkpa.','Your support matters.')}</h2><p>{t(locale,'Ị ga-aga na saịtị enyemaka obodo ka e were usoro ha haziri.','You’ll continue to the community’s configured giving destination.')}</p><a href={settings?.donationUrl??'#'} target="_blank" rel="noreferrer" className="btn-primary" data-testid="link-donate-configured">{t(locale,'Gaa n’ebe onyinye','Continue to donate')}<ArrowUpRight size={16}/></a></>:<><span className="donation-symbol"><Heart/></span><span className="eyebrow">{t(locale,'NKE A ACHỌ KWADO','NOT CONFIGURED')}</span><h2 className="serif">{t(locale,'Enweghị ebe onyinye ahaziri ugbu a.','Giving destination unavailable.')}</h2><p>{t(locale,'A naghị anabata ịkwụ ụgwọ n’ebe a, a naghịkwa ekwu ego e chepụtara echepụta. Biko kpọtụrụ otu maka nkọwa.', 'Donations are not being processed here and no payment amount is assumed. Please contact the group for guidance.')}</p>{settings?.contactEmail?<a href={`mailto:${settings.contactEmail}`} className="arrow-link">{settings.contactEmail}<ArrowUpRight size={15}/></a>:<span className="status-pill">{t(locale,'Kọntaktị adịghị','Contact unavailable')}</span>}</>}</div>
        </div>
      </main>
    </PageFrame>
  );
}

function Protected({ children, locale }: { children: ReactNode; locale: Locale }) {
  const { isSignedIn, loading } = useAuth();
  if (loading) return <div className="auth-gate"><div className="auth-gate-card"><BrandMark/><Skeleton rows={2}/></div></div>;
  if (isSignedIn) return <>{children}</>;
  return <div className="auth-gate"><div className="auth-gate-card"><BrandMark/><span className="eyebrow">A PRIVATE COMMUNITY SPACE</span><h1 className="serif">{t(locale,'Ọdịnaya ndị otu','For community members')}</h1><p>{t(locale,'Banye iji hụ oghere ndị otu a.','Sign in to open your member space.')}</p><Link href="/sign-in" className="btn-primary" data-testid="button-gate-sign-in">{t(locale,'Banye','Sign in')}<ArrowRight size={16}/></Link></div></div>;
}
function WikimediaRefreshButton({ locale }: { locale: Locale }) {
  const providers = useAuthProviders();
  const { user, setUser } = useAuth();
  const refresh = useRefreshAccount();
  const [note, setNote] = useState('');
  if (!providers.wikimedia) return null;
  const run = () => {
    setNote('');
    refresh.mutate(undefined, {
      onSuccess: (data) => { setUser(data.user); setNote(t(locale,'E megharịrị profaịlụ Wikimedia gị.','Your Wikimedia profile was refreshed.')); },
      onError: (err) => setNote(asError(err) || t(locale,'Enweghị ike imegharị ugbu a.','Could not refresh right now.')),
    });
  };
  return <div className="wiki-refresh">
    <button type="button" className="btn-outline" onClick={run} disabled={refresh.isPending} data-testid="button-wikimedia-refresh">{refresh.isPending?<LoaderCircle className="spin" size={15}/>:<RotateCw size={15}/>}{t(locale,'Megharịa site na Wikimedia','Refresh from Wikimedia')}</button>
    {user?.wikimediaVerified && user.username ? <span className="status-pill">{user.username}</span> : null}
    {note && <span className="wiki-refresh-note" role="status">{note}</span>}
  </div>;
}
type MemberTab = 'overview' | 'contributions' | 'accounts' | 'billing';

function isNotFoundError(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { status?: number }).status === 404;
}

function MemberBillingPanel({ locale, billing, renew, busy }: { locale: Locale; billing: ReturnType<typeof useMemberBilling>; renew: () => void; busy: boolean }) {
  const d=billing.data;
  if(!d) return <section className="member-panel member-billing" data-testid="member-billing"><span className="eyebrow">{t(locale,'ỌNỌDỤ ỊKWỤ ỤGWỌ','BILLING STATUS')}</span><h2 className="serif">{t(locale,'Onyinye gị na-akwado ọrụ a.','Your giving powers the work.')}</h2><p>{t(locale,'E dekọrọghị ịkwụ ụgwọ ọ bụla na akaụntụ a ugbu a.','No billing has been recorded on this account yet.')}</p></section>;
  return <section className="member-panel member-billing" data-testid="member-billing"><span className="eyebrow">{t(locale,'ỌNỌDỤ ỊKWỤ ỤGWỌ','BILLING STATUS')}</span><h2 className="serif">{t(locale,'Onyinye gị na-akwado ọrụ a.','Your giving powers the work.')}</h2><div className="member-status-bar"><div><span className="eyebrow">{t(locale,'ỌNỌDỤ','STATUS')}</span><strong className={`member-status status-${d.status}`} data-testid="status-billing">{d.status}</strong></div><div><span className="eyebrow">{t(locale,'MWEKA ỌZỌ','RENEWS')}</span><strong>{d.renewsAt?new Date(d.renewsAt).toLocaleDateString(locale==='ig'?'ig-NG':'en-GB'):t(locale,'Ọ dịghị','—')}</strong></div><div><span className="eyebrow">{t(locale,'EGO AKWỤRỤ','TOTAL PAID')}</span><strong>{formatNgn(d.totalPaidNgn)}</strong></div></div>{d.tier&&d.tier.priceNgn>0&&<button className="btn-primary" type="button" onClick={renew} disabled={busy} data-testid="button-renew-membership"><CreditCard size={15}/>{d.status==='expired'?t(locale,'Mee ka ọ dị ọhụrụ','Renew membership'):t(locale,'Kwụọ ụgwọ ọzọ','Renew now')}</button>}</section>;
}
function MemberPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const [tab,setTab]=useState<MemberTab>('overview');
  const membership=useGetMyMembership({query:{queryKey:getGetMyMembershipQueryKey()}});
  const registered=!!membership.data;
  const stats=useGetMyWikimediaStats({query:{queryKey:getGetMyWikimediaStatsQueryKey(),enabled:!!membership.data?.shareWikiStats}});
  const {user,isAdmin,signOut}=useAuth();
  const billing=useMemberBilling(registered);
  const verify=useVerifyPayment();
  const [payNote,setPayNote]=useState('');
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const ref=params.get('reference')??params.get('trxref');if(!ref)return;verify.mutate(ref,{onSuccess:(d)=>setPayNote(d.payment.status==='success'?t(locale,'E nwetara ụgwọ gị. Daalụ!','Payment received — thank you!'):t(locale,'Emechabeghị ịkwụ ụgwọ a.','That payment was not completed.')),onError:(err)=>setPayNote(err instanceof Error?err.message:t(locale,'Enweghị ike inyocha ịkwụ ụgwọ.','Could not verify the payment.'))});window.history.replaceState({},'',window.location.pathname);},[]);
  const renew=()=>{const tier=billing.data?.tier;if(!tier)return;setPayNote('');initializePayment({purpose:'membership',tierId:tier.id}).then(r=>{window.location.href=r.authorizationUrl;}).catch(err=>setPayNote(err instanceof Error?err.message:t(locale,'Enweghị ike ịmalite ịkwụ ụgwọ.','Could not start checkout.')));};
  const displayName=membership.data?.displayName??user?.displayName??t(locale,'enyi anyị','friend');
  const shareStats=!!membership.data?.shareWikiStats;
  const myStats=stats.data?.find(x=>x.memberId===membership.data?.id);
  const nav:[MemberTab,string,ReactNode][]=[['overview',t(locale,'Nchịkọta','Overview'),<ChartNoAxesColumn key="overview" size={16}/>],['contributions',t(locale,'Onyinye m','Contributions'),<Sparkles key="contributions" size={16}/>],['accounts',t(locale,'Njikọ Wikimedia','Wikimedia links'),<ExternalLink key="accounts" size={16}/>],['billing',t(locale,'Ụgwọ','Billing'),<CreditCard key="billing" size={16}/>]];
  const explore:[string,string,ReactNode][]=[['/',t(locale,'Ụlọ','Home'),<Home key="i"/>],['/projects',t(locale,'Ọrụ anyị','Projects'),<Sparkles key="i"/>],['/gallery',t(locale,'Ọba foto','Gallery'),<Images key="i"/>],['/dictionary',t(locale,'Nkọwa okwu','Dictionary'),<BookOpen key="i"/>],['/events',t(locale,'Mmemme','Gatherings'),<CalendarDays key="i"/>],['/community',t(locale,'Ndị nyere aka','Contributors'),<UsersRound key="i"/>]];
  const status=membership.data?.status;
  return <PageFrame locale={locale} setLocale={setLocale}><Protected locale={locale}><main className="member-shell shell">
    <div className="member-welcome"><div><span className="eyebrow">MEMBER SPACE / OGHERE NDỊ OTU</span><h1 className="serif">{t(locale,'Nnọọ azụ,','Welcome back,')}<br/>{displayName}.</h1><p>{t(locale,'Ebe ị ga-ahụ njikọ gị na ọrụ anyị na-eme ọnụ.','A place to see your place in the work we share.')}</p></div><div className="member-actions"><WikimediaRefreshButton locale={locale}/><button className="btn-outline" onClick={()=>{void signOut();}} data-testid="button-member-sign-out"><LogOut size={15}/>{t(locale,'Pụọ','Sign out')}</button></div></div>
    <div className="member-layout">
      <aside className="member-nav" aria-label={t(locale,'Nchọgharị oghere ndị otu','Member space navigation')}>
        {nav.map(([id,label,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)} data-testid={`member-tab-${id}`}>{icon}<span>{label}</span><ChevronRight size={14}/></button>)}
        <span className="member-nav-sep" aria-hidden="true"/>
        {explore.map(([href,label,icon])=><Link key={href} href={href} data-testid={`member-nav-${href.slice(1)||'home'}`}>{icon}<span>{label}</span><ArrowRight size={15}/></Link>)}
        {isAdmin&&<><span className="member-nav-sep" aria-hidden="true"/><Link href="/admin" data-testid="member-nav-admin"><ShieldCheck size={16}/><span>{t(locale,'Ndị nchịkwa','Admin')}</span><ArrowUpRight size={15}/></Link></>}
      </aside>
      <div className="member-content">
        {payNote&&<div className="notice" role="status" data-testid="member-payment-note"><Check size={18}/><span>{payNote}</span></div>}
        {membership.isLoading?<div className="member-panel"><Skeleton rows={4}/></div>:membership.error&&!isNotFoundError(membership.error)?<ErrorNotice message={asError(membership.error)} retry={()=>membership.refetch()}/>:!registered?<div className="member-panel empty-member" data-testid="member-unregistered"><Sparkles/><h2 className="serif">{t(locale,'Nnọọ, onye ọrụ anyị.','Welcome, contributor.')}</h2><p>{t(locale,'Abanyela gị na akaụntụ, ma e jikọtabeghị profaịlụ otu na ya. Debanye aha iji sonye n’otu ahụ.','You are signed in, but no membership profile is linked to your account yet. Register to join the group.')}</p><Link href="/join" className="btn-primary" data-testid="button-member-register">{t(locale,'Debanye aha otu','Register for membership')}<ArrowRight size={15}/></Link></div>:<>
          {tab==='overview'&&<>
            <div className="member-status-bar"><div><span className="eyebrow">{t(locale,'ỌNỌDỤ OTU','MEMBERSHIP STATUS')}</span><strong className={`member-status status-${status}`} data-testid="status-member">{status}</strong></div><div><span className="eyebrow">{t(locale,'EDEBANYERE','MEMBER SINCE')}</span><strong>{new Date(membership.data.createdAt).toLocaleDateString(locale==='ig'?'ig-NG':'en-GB',{month:'long',year:'numeric'})}</strong></div><div><span className="eyebrow">{t(locale,'ỌNỌDỤ','LOCATION')}</span><strong>{membership.data.location||t(locale,'E nyeghị','Not shared')}</strong></div></div>
            {status==='pending'&&<div className="notice pending-notice"><ShieldCheck size={18}/><span>{t(locale,'Arịrịọ gị ka na-echere nyocha ndị nchịkwa obodo.','Your membership request is awaiting community review.')}</span></div>}
            <MemberBillingPanel locale={locale} billing={billing} renew={renew} busy={verify.isPending}/>
            <section className="member-panel member-shortcuts"><span className="eyebrow">EXPLORE / GAA N’IHU</span><h2 className="serif">{t(locale,'Gaa n’ihu n’ebe ọzọ.','Keep exploring.')}</h2><div className="member-quick-links">{explore.map(([href,label,icon])=><Link key={href} href={href}>{icon}<span>{label}</span><ArrowUpRight size={15}/></Link>)}</div></section>
          </>}
          {tab==='contributions'&&<section className="member-panel"><span className="eyebrow">MY CONTRIBUTION / AKỤKỌ M</span><h2 className="serif">{t(locale,'Ọnụ ọgụgụ anyị na-arụ ọnụ.','The work we share.')}</h2>{!membership.data.shareWikiStats?<div className="private-stat"><ShieldCheck size={19}/><div><b>{t(locale,'Ị họrọghị isonye na stats.','Contribution stats are switched off.')}</b><p>{t(locale,'Enweghị stats nkeonwe a na-anakọta. Onye nchịkwa nwere ike ime mgbanwe nkwenye ma ọ bụrụ na ị rịọ.','No individual contribution statistics are being collected under your current choice.')}</p></div></div>:stats.isLoading?<Skeleton rows={3}/>:stats.error?<ErrorNotice message={asError(stats.error)} retry={()=>stats.refetch()}/>:<><div className="member-total" data-testid="member-total-contributions"><strong>{stats.data?.find(x=>x.memberId===membership.data?.id)?.totalContributions??0}</strong><span>{t(locale,'onyinye e dekọrọ n’ọrụ Wikimedia','recorded Wikimedia contributions')}</span></div><div className="member-project-stats">{(stats.data?.find(x=>x.memberId===membership.data?.id)?.projects??[]).filter(x=>x.available).map(x=><div key={x.project} data-testid={`member-stat-${x.project}`}><span>{projects.find(p=>p.id===x.project)?.name??x.project}</span><b>{x.contributions.toLocaleString()}</b></div>)}</div><p className="private-note">{t(locale,'Stats ndị a bụ nkeonwe, dabere na nkwenye gị ma dị naanị n’akụkọ gị.','These figures are private, consent-based and shown only in your account.')}</p></>}</section>}
          {tab==='accounts'&&<section className="member-panel member-projects"><span className="eyebrow">MY WIKIMEDIA ACCOUNTS</span><h2 className="serif">{t(locale,'Njikọ ọrụ m','My project links')}</h2>{membership.data.wikiAccounts?.length?membership.data.wikiAccounts.map(a=><div className="account-line" key={a.project}><span className="project-glyph">{projects.find(p=>p.id===a.project)?.mark??'W'}</span><span>{projects.find(p=>p.id===a.project)?.name??a.project}</span><b>{a.username}</b></div>):<p>{t(locale,'I tinyebeghị akaụntụ Wikimedia.','No Wikimedia accounts added yet.')}</p>}<Link href="/projects" className="arrow-link">{t(locale,'Chọgharịa ọrụ','Explore projects')}<ArrowRight size={15}/></Link></section>}
          {tab==='billing'&&<MemberBillingPanel locale={locale} billing={billing} renew={renew} busy={verify.isPending}/>}
        </>}
      </div>
    </div>
  </main></Protected></PageFrame>;
}
type AdminTab = 'overview'|'pages'|'events'|'tiers'|'members'|'payments'|'settings'|'stats'|'content';
function AdminPage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const [tab,setTab]=useState<AdminTab>('overview');
  return <PageFrame locale={locale} setLocale={setLocale}><Protected locale={locale}><main className="admin-shell shell">
    <div className="admin-heading"><div><span className="eyebrow">{t(locale,'NCHỊKWA OBODO / COMMUNITY CONTROL ROOM','COMMUNITY CONTROL ROOM')}</span><h1 className="serif">{t(locale,'Ilekọta ọrụ obodo.','Stewardship.')}</h1><p>{t(locale,'Ndị obodo na-elekọta ọdịnaya, mmemme na ndị otu ka ọrụ wee gaa n’ihu.','Content, gatherings and membership — managed by the people who keep the work moving.')}</p></div><span className="admin-badge"><ShieldCheck size={15}/>{t(locale,'OGHERE NDỊ NCHỊKWA','SIGNED-IN ADMIN AREA')}</span></div>
    <div className="admin-layout"><aside className="admin-nav">{(['overview','pages','events','tiers','members','payments','stats','content','settings'] as AdminTab[]).map(key=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)} data-testid={`admin-tab-${key}`}>{key==='overview'?<ChartNoAxesColumn size={16}/>:key==='pages'?<BookOpen size={16}/>:key==='events'?<CalendarDays size={16}/>:key==='tiers'?<UsersRound size={16}/>:key==='members'?<ShieldCheck size={16}/>:key==='payments'?<CreditCard size={16}/>:key==='content'?<Pencil size={16}/>:key==='settings'?<Settings2 size={16}/>:<ChartNoAxesColumn size={16}/>}<span>{t(locale,key==='overview'?'Nchịkọta':key==='pages'?'Peeji':key==='events'?'Mmemme':key==='tiers'?'Ọkwa otu':key==='members'?'Ndị otu':key==='payments'?'Ụgwọ':key==='stats'?'Stats Wiki':key==='content'?'Ọdịnaya':'Ntọala',key==='overview'?'Overview':key==='pages'?'Pages':key==='events'?'Events':key==='tiers'?'Membership tiers':key==='members'?'Members':key==='payments'?'Payments':key==='stats'?'Wiki statistics':key==='content'?'Site content':'Settings')}</span><ChevronRight size={14}/></button>)}</aside><div className="admin-content"><AdminPanel tab={tab} locale={locale}/></div></div>
  </main></Protected></PageFrame>;
}
function AdminPanel({tab,locale}:{tab:AdminTab;locale:Locale}) {
  const summary=useGetCommunitySummary();
  const adminPages=useListAdminPages({query:{queryKey:getListAdminPagesQueryKey(),enabled:tab==='pages'}});
  const events=useListEvents();
  const tiers=useListMembershipTiers();
  const members=useListMembers();
  const stats=useGetWikimediaStats();
  const settings=useGetSiteSettings();
  const title=tab==='overview'?t(locale,'Nchịkọta obodo','Community overview'):tab==='pages'?t(locale,'Peeji CMS','CMS pages'):tab==='events'?t(locale,'Mmemme obodo','Community events'):tab==='tiers'?t(locale,'Ọkwa otu','Membership tiers'):tab==='members'?t(locale,'Nyocha ndị otu','Member review'):tab==='payments'?t(locale,'Ụgwọ na onyinye','Payments & giving'):tab==='stats'?t(locale,'Stats Wikimedia','Wikimedia statistics'):tab==='content'?t(locale,'Ọdịnaya saịtị','Site content'):t(locale,'Ntọala saịtị','Site settings');
  return <section className="admin-panel"><div className="admin-panel-title"><div><span className="eyebrow">{t(locale,'TEBỤL NDỊ NCHỊKWA','STEWARD DESK')}</span><h2 className="serif">{title}</h2></div><span className="eyebrow">{new Date().toLocaleDateString(locale==='ig'?'ig-NG':'en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
    {tab==='overview'&&<div className="admin-overview">{summary.isLoading?<Skeleton rows={3}/>:summary.error?<ErrorNotice message={asError(summary.error)} retry={()=>summary.refetch()}/>:<div className="admin-stat-grid"><div><span>{t(locale,'NDỊ OTU EDEBANYERE','REGISTERED MEMBERS')}</span><b>{summary.data?.registeredMembers??0}</b></div><div><span>{t(locale,'MMEMME E BIPỤTARA','PUBLISHED EVENTS')}</span><b>{summary.data?.publishedEvents??0}</b></div><div><span>{t(locale,'ỌRỤ NA-ARỤ ỌRỤ','ACTIVE PROJECTS')}</span><b>{summary.data?.activeProjects??0}</b></div></div>}<div className="admin-data-status"><span className="eyebrow">{t(locale,'ỌNỌDỤ API','API STATUS')}</span><p>{t(locale,'Ejikọtara peeji ndị a na API obodo. Ọrụ na ikike ide ihe dị n’aka ọrụ ahụ.','Views are connected to the community API. Authorization and write permissions are enforced by the service.')}</p></div><div className="admin-shortcuts">{(['pages','events','members','settings'] as AdminTab[]).map(x=><button onClick={()=>document.querySelector(`[data-testid="admin-tab-${x}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} key={x}>{localizeAdmin(locale,x)}<ArrowUpRight size={15}/></button>)}</div></div>}
    {tab==='pages'&&<PagesAdmin query={adminPages}/>}
    {tab==='events'&&<EventsAdmin query={events}/>}
    {tab==='tiers'&&<TiersAdmin query={tiers}/>}
    {tab==='members'&&<MembersAdmin query={members} tiers={tiers.data??[]}/>}
    {tab==='payments'&&<AdminPaymentsPanel/>}
    {tab==='settings'&&<SettingsAdmin query={settings}/>}
    {tab==='content'&&<AdminContentPanel/>}
    {tab==='stats'&&<StatsAdmin query={stats}/>}
  </section>;
}
function PagesAdmin({query}:{query:ReturnType<typeof useListAdminPages<CmsPage[]>>}) {
  const cache=useQueryClient();const create=useCreatePage();const update=useUpdatePage();const remove=useDeletePage();
  const [editing,setEditing]=useState<CmsPage|null>(null);const [creating,setCreating]=useState(false);
  const blank:CmsPageInput={slug:'',titleEn:'',titleIg:'',summaryEn:'',summaryIg:'',bodyEn:'',bodyIg:'',heroImage:'',published:false};
  const [draft,setDraft]=useState<CmsPageInput>(blank);
  const reset=()=>{setDraft(blank);setEditing(null);setCreating(false);};
  const refreshPages=()=>{cache.invalidateQueries({queryKey:getListAdminPagesQueryKey()});cache.invalidateQueries({queryKey:getListPagesQueryKey()});};
  const save=(e:FormEvent)=>{e.preventDefault();const done=()=>{refreshPages();if(editing)cache.invalidateQueries({queryKey:getGetPageQueryKey(editing.slug)});reset();};if(editing)update.mutate({slug:editing.slug,data:draft},{onSuccess:done});else create.mutate({data:draft},{onSuccess:done});};
  const edit=(p:CmsPage)=>{setEditing(p);setDraft({slug:p.slug,titleEn:p.titleEn,titleIg:p.titleIg,summaryEn:p.summaryEn,summaryIg:p.summaryIg,bodyEn:p.bodyEn,bodyIg:p.bodyIg,heroImage:p.heroImage??'',published:p.published});setCreating(true);};
  return <>{(creating||!query.data?.length)&&<AdminForm title={editing?'Edit page':'Create page'} onSubmit={save} onCancel={reset} busy={create.isPending||update.isPending} error={create.error||update.error}><div className="form-grid"><AdminInput label="Slug" value={draft.slug} disabled={!!editing} onChange={v=>setDraft({...draft,slug:v})}/><AdminInput label="Hero image URL (optional)" value={draft.heroImage??''} onChange={v=>setDraft({...draft,heroImage:v})}/><AdminInput label="Title · English" value={draft.titleEn} onChange={v=>setDraft({...draft,titleEn:v})}/><AdminInput label="Title · Igbo" value={draft.titleIg} onChange={v=>setDraft({...draft,titleIg:v})}/><AdminInput label="Summary · English" value={draft.summaryEn} onChange={v=>setDraft({...draft,summaryEn:v})}/><AdminInput label="Summary · Igbo" value={draft.summaryIg} onChange={v=>setDraft({...draft,summaryIg:v})}/></div><div className="form-grid"><AdminText label="Body · English" value={draft.bodyEn} onChange={v=>setDraft({...draft,bodyEn:v})}/><AdminText label="Body · Igbo" value={draft.bodyIg} onChange={v=>setDraft({...draft,bodyIg:v})}/></div><AdminCheck label="Published" checked={draft.published} onChange={v=>setDraft({...draft,published:v})}/></AdminForm>}
  <AdminLoad query={query}/>{!query.isLoading&&!query.error&&<><AdminToolbar label={`${query.data?.length??0} pages`} onAdd={()=>{setCreating(true);setEditing(null)}}/><div className="admin-table">{(query.data??[]).map(p=><div className="admin-row" key={p.slug} data-testid={`admin-page-${p.slug}`}><div className="row-main"><b>{p.titleEn}</b><small>/{p.slug} · Updated {new Date(p.updatedAt).toLocaleDateString()}</small></div><span className={`admin-status ${p.published?'on':'off'}`}>{p.published?'Published':'Draft'}</span><button onClick={()=>edit(p)} className="icon-action" aria-label={`Edit ${p.titleEn}`} data-testid={`button-edit-page-${p.slug}`}><Pencil size={15}/></button><button onClick={()=>{if(confirm(`Delete “${p.titleEn}”?`))remove.mutate({slug:p.slug},{onSuccess:refreshPages});}} className="icon-action danger" aria-label={`Delete ${p.titleEn}`} data-testid={`button-delete-page-${p.slug}`}><Trash2 size={15}/></button></div>)}</div></>}</>;
}
function EventsAdmin({query}:{query:ReturnType<typeof useListEvents<CommunityEvent[]>>}) {
  const cache=useQueryClient();const create=useCreateEvent();const update=useUpdateEvent();const remove=useDeleteEvent();const [editing,setEditing]=useState<CommunityEvent|null>(null);const [open,setOpen]=useState(false);
  const blank:CommunityEventInput={titleEn:'',titleIg:'',descriptionEn:'',descriptionIg:'',startsAt:'',endsAt:'',location:'',venue:'',latitude:null,longitude:null,imageUrl:'',project:'igwiki',status:'upcoming',published:false,reportUrl:''};
  const [draft,setDraft]=useState<CommunityEventInput>(blank);
  const reset=()=>{setOpen(false);setEditing(null);setDraft(blank);};
  const save=(e:FormEvent)=>{e.preventDefault();const data:CommunityEventInput={...draft,startsAt:new Date(draft.startsAt).toISOString(),endsAt:draft.endsAt?new Date(draft.endsAt).toISOString():null,venue:draft.venue?.trim()||null,imageUrl:draft.imageUrl?.trim()||null,reportUrl:draft.reportUrl?.trim()||null};const done=()=>{cache.invalidateQueries({queryKey:getListEventsQueryKey()});reset();};if(editing)update.mutate({eventId:editing.id,data},{onSuccess:done});else create.mutate({data},{onSuccess:done});};
  const edit=(ev:CommunityEvent)=>{setEditing(ev);setOpen(true);setDraft({titleEn:ev.titleEn,titleIg:ev.titleIg,descriptionEn:ev.descriptionEn,descriptionIg:ev.descriptionIg,startsAt:new Date(ev.startsAt).toISOString().slice(0,16),endsAt:ev.endsAt?new Date(ev.endsAt).toISOString().slice(0,16):'',location:ev.location,venue:ev.venue??'',latitude:ev.latitude??null,longitude:ev.longitude??null,imageUrl:ev.imageUrl??'',project:ev.project,status:ev.status,published:ev.published,reportUrl:ev.reportUrl??''});};
  return <>{(open||!query.data?.length)&&<AdminForm title={editing?'Edit event':'Create event'} onSubmit={save} onCancel={reset} busy={create.isPending||update.isPending} error={create.error||update.error}><div className="form-grid"><AdminInput label="Title · English" value={draft.titleEn} onChange={v=>setDraft({...draft,titleEn:v})}/><AdminInput label="Title · Igbo" value={draft.titleIg} onChange={v=>setDraft({...draft,titleIg:v})}/><AdminInput label="Starts at" type="datetime-local" value={draft.startsAt} onChange={v=>setDraft({...draft,startsAt:v})}/><AdminInput label="Ends at (optional)" type="datetime-local" value={draft.endsAt??''} onChange={v=>setDraft({...draft,endsAt:v||null})}/><AdminInput label="Location" value={draft.location} onChange={v=>setDraft({...draft,location:v})}/><AdminInput label="Venue (optional)" value={draft.venue??''} onChange={v=>setDraft({...draft,venue:v||null})}/><label className="admin-field">Latitude (optional)<input type="number" step="any" className="input" value={draft.latitude??''} onChange={e=>setDraft({...draft,latitude:e.target.value===''?null:Number(e.target.value)})}/></label><label className="admin-field">Longitude (optional)<input type="number" step="any" className="input" value={draft.longitude??''} onChange={e=>setDraft({...draft,longitude:e.target.value===''?null:Number(e.target.value)})}/></label><AdminInput label="Image / flyer URL (optional)" value={draft.imageUrl??''} onChange={v=>setDraft({...draft,imageUrl:v})}/><AdminInput label="Project" value={draft.project} onChange={v=>setDraft({...draft,project:v})}/><AdminInput label="Report URL" value={draft.reportUrl??''} onChange={v=>setDraft({...draft,reportUrl:v})}/></div><div className="form-grid"><AdminText label="Description · English" value={draft.descriptionEn} onChange={v=>setDraft({...draft,descriptionEn:v})}/><AdminText label="Description · Igbo" value={draft.descriptionIg} onChange={v=>setDraft({...draft,descriptionIg:v})}/></div><div className="form-grid"><label className="admin-field">Status<select className="input" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as 'upcoming'|'completed'})}><option value="upcoming">Upcoming</option><option value="completed">Completed</option></select></label><AdminCheck label="Published" checked={draft.published} onChange={v=>setDraft({...draft,published:v})}/></div></AdminForm>}
  <AdminLoad query={query}/>{!query.isLoading&&!query.error&&<><AdminToolbar label={`${query.data?.length??0} events`} onAdd={()=>{setEditing(null);setDraft(blank);setOpen(true)}}/><div className="admin-table">{(query.data??[]).map(ev=><div className="admin-row" key={ev.id} data-testid={`admin-event-${ev.id}`}><div className="row-main"><b>{ev.titleEn}</b><small>{new Date(ev.startsAt).toLocaleString()} · {ev.location}</small></div><span className={`admin-status ${ev.published?'on':'off'}`}>{ev.published?'Published':'Hidden'}</span><button onClick={()=>edit(ev)} className="icon-action" data-testid={`button-edit-event-${ev.id}`}><Pencil size={15}/></button><button onClick={()=>{if(confirm('Delete this event?'))remove.mutate({eventId:ev.id},{onSuccess:()=>cache.invalidateQueries({queryKey:getListEventsQueryKey()})});}} className="icon-action danger" data-testid={`button-delete-event-${ev.id}`}><Trash2 size={15}/></button></div>)}</div></>}</>;
}
function TiersAdmin({query}:{query:ReturnType<typeof useListMembershipTiers<MembershipTier[]>>}) {
  const cache=useQueryClient();const create=useCreateMembershipTier();const update=useUpdateMembershipTier();const remove=useDeleteMembershipTier();const [selected,setSelected]=useState<MembershipTier|null>(null);const [open,setOpen]=useState(false);
  const blank:MembershipTierInput={nameEn:'',nameIg:'',descriptionEn:'',descriptionIg:'',priceNgn:0,interval:'free',active:true,benefitsEn:[],benefitsIg:[]};
  const [draft,setDraft]=useState<MembershipTierInput>(blank);const reset=()=>{setSelected(null);setOpen(false);setDraft(blank);};
  const save=(e:FormEvent)=>{e.preventDefault();const done=()=>{cache.invalidateQueries({queryKey:getListMembershipTiersQueryKey()});reset();};if(selected)update.mutate({tierId:selected.id,data:draft},{onSuccess:done});else create.mutate({data:draft},{onSuccess:done});};
  const edit=(tier:MembershipTier)=>{setSelected(tier);setOpen(true);setDraft({nameEn:tier.nameEn,nameIg:tier.nameIg,descriptionEn:tier.descriptionEn,descriptionIg:tier.descriptionIg,priceNgn:tier.priceNgn,interval:tier.interval,active:tier.active,benefitsEn:tier.benefitsEn,benefitsIg:tier.benefitsIg});};
  return <>{(open||!query.data?.length)&&<AdminForm title={selected?'Edit membership tier':'Create membership tier'} onSubmit={save} onCancel={reset} busy={create.isPending||update.isPending} error={create.error||update.error}><div className="form-grid"><AdminInput label="Name · English" value={draft.nameEn} onChange={v=>setDraft({...draft,nameEn:v})}/><AdminInput label="Name · Igbo" value={draft.nameIg} onChange={v=>setDraft({...draft,nameIg:v})}/><AdminInput label="Description · English" value={draft.descriptionEn} onChange={v=>setDraft({...draft,descriptionEn:v})}/><AdminInput label="Description · Igbo" value={draft.descriptionIg} onChange={v=>setDraft({...draft,descriptionIg:v})}/><label className="admin-field">Price (NGN)<input type="number" min="0" className="input" value={draft.priceNgn} onChange={e=>setDraft({...draft,priceNgn:Number(e.target.value)})}/></label><label className="admin-field">Interval<select className="input" value={draft.interval} onChange={e=>setDraft({...draft,interval:e.target.value as MembershipTierInput['interval']})}>{['free','monthly','annual','once'].map(x=><option key={x} value={x}>{x}</option>)}</select></label></div><div className="form-grid"><AdminText label="Benefits · English (one per line)" value={draft.benefitsEn.join('\n')} onChange={v=>setDraft({...draft,benefitsEn:v.split('\n').filter(Boolean)})}/><AdminText label="Benefits · Igbo (one per line)" value={draft.benefitsIg.join('\n')} onChange={v=>setDraft({...draft,benefitsIg:v.split('\n').filter(Boolean)})}/></div><AdminCheck label="Active and visible for registration" checked={draft.active} onChange={v=>setDraft({...draft,active:v})}/></AdminForm>}
  <AdminLoad query={query}/>{!query.isLoading&&!query.error&&<><AdminToolbar label={`${query.data?.length??0} tiers`} onAdd={()=>{setSelected(null);setDraft(blank);setOpen(true)}}/><div className="admin-table">{(query.data??[]).map(x=><div className="admin-row" key={x.id} data-testid={`admin-tier-${x.id}`}><div className="row-main"><b>{x.nameEn}</b><small>{x.priceNgn} NGN · {x.interval}</small></div><span className={`admin-status ${x.active?'on':'off'}`}>{x.active?'Active':'Inactive'}</span><button className="icon-action" onClick={()=>edit(x)} data-testid={`button-edit-tier-${x.id}`}><Pencil size={15}/></button><button className="icon-action danger" onClick={()=>{if(confirm(`Delete tier “${x.nameEn}”?`))remove.mutate({tierId:x.id},{onSuccess:()=>cache.invalidateQueries({queryKey:getListMembershipTiersQueryKey()})});}} data-testid={`button-delete-tier-${x.id}`}><Trash2 size={15}/></button></div>)}</div></>}</>;
}
function MembersAdmin({query,tiers}:{query:ReturnType<typeof useListMembers<Member[]>>;tiers:MembershipTier[]}) {
  const cache=useQueryClient();const update=useUpdateMember();
   return <><AdminLoad query={query}/>{!query.isLoading&&!query.error&&(query.data?.length?<div className="admin-table">{query.data.map(member=><div className="member-review-row" key={member.id} data-testid={`admin-member-${member.id}`}><div className="row-main"><b>{member.displayName}</b><small>{member.location||'Location not shared'} · {new Date(member.createdAt).toLocaleDateString()}</small></div><span className={`admin-status ${member.status==='active'?'on':'off'}`}>{member.status}</span><select aria-label={`Membership tier for ${member.displayName}`} className="admin-select" value={member.tierId} onChange={e=>update.mutate({memberId:member.id,data:{tierId:e.target.value}},{onSuccess:()=>cache.invalidateQueries({queryKey:getListMembersQueryKey()})})} data-testid={`select-member-tier-${member.id}`}>{tiers.map(t=><option key={t.id} value={t.id}>{t.nameEn}</option>)}</select><select aria-label={`Status for ${member.displayName}`} className="admin-select" value={member.status} onChange={e=>update.mutate({memberId:member.id,data:{status:e.target.value as 'pending'|'active'|'paused'}},{onSuccess:()=>{cache.invalidateQueries({queryKey:getListMembersQueryKey()});cache.invalidateQueries({queryKey:getGetCommunitySummaryQueryKey()})}})} data-testid={`select-member-status-${member.id}`}><option value="pending">pending</option><option value="active">active</option><option value="paused">paused</option></select>{member.shareWikiStats?<label className="consent-admin"><input type="checkbox" checked aria-label={`Revoke stats consent for ${member.displayName}`} onChange={()=>{if(confirm(`Revoke ${member.displayName}’s statistics consent? This also permanently deletes their saved Wikimedia usernames.`))update.mutate({memberId:member.id,data:{shareWikiStats:false}},{onSuccess:()=>cache.invalidateQueries({queryKey:getListMembersQueryKey()})});}} data-testid={`input-member-consent-${member.id}`}/>Stats consent</label>:<span className="consent-admin consent-off">Stats not shared</span>}</div>)}</div>:<EmptyAdmin title="No member registrations yet" text="New membership requests will appear here for review."/>)}{update.error&&<ErrorNotice message={asError(update.error)}/>}</>;
}
function SettingsAdmin({query}:{query:ReturnType<typeof useGetSiteSettings<SiteSettings>>}) {
  const cache=useQueryClient();const update=useUpdateSiteSettings();const [initialized,setInitialized]=useState(false);const [draft,setDraft]=useState<SiteSettingsInput>({donationUrl:null,contactEmail:'',contactAddress:'',currency:'NGN',donationEnabled:false});
  const settings=query.data as SiteSettings|undefined;
  useEffect(()=>{if(settings&&!initialized){setDraft({donationUrl:settings.donationUrl,contactEmail:settings.contactEmail,contactAddress:settings.contactAddress,currency:settings.currency as 'NGN'|'USD',donationEnabled:settings.donationEnabled});setInitialized(true)}},[settings,initialized]);
  const save=(e:FormEvent)=>{e.preventDefault();update.mutate({data:draft},{onSuccess:()=>cache.invalidateQueries({queryKey:getGetSiteSettingsQueryKey()})});};
  if(query.isLoading)return <Skeleton rows={3}/>;if(query.error)return <ErrorNotice message={asError(query.error)} retry={()=>query.refetch()}/>;
  return <form onSubmit={save} className="admin-form settings-form"><div className="settings-callout"><ShieldCheck size={18}/><p>Donation links are public only when enabled and configured. The public site will show an unavailable state otherwise.</p></div><AdminInput label="Contact email" type="email" value={draft.contactEmail} onChange={v=>setDraft({...draft,contactEmail:v})}/><AdminInput label="Contact address" value={draft.contactAddress} onChange={v=>setDraft({...draft,contactAddress:v})}/><AdminInput label="Donation URL (leave blank to disable)" value={draft.donationUrl??''} onChange={v=>setDraft({...draft,donationUrl:v||null})}/><label className="admin-field">Currency<select className="input" value={draft.currency} onChange={e=>setDraft({...draft,currency:e.target.value as 'NGN'|'USD'})}><option value="NGN">NGN — Nigerian naira</option><option value="USD">USD — US dollar</option></select></label><AdminCheck label="Enable the configured donation destination" checked={draft.donationEnabled} onChange={v=>setDraft({...draft,donationEnabled:v})}/>{update.error&&<ErrorNotice message={asError(update.error)}/>}<button type="submit" className="btn-primary" disabled={update.isPending} data-testid="button-save-settings"><Save size={15}/>{update.isPending?'Saving…':'Save settings'}</button>{update.isSuccess&&<span className="save-success" data-testid="status-settings-saved"><Check size={15}/>Settings saved</span>}</form>;
}
function StatsAdmin({query}:{query:ReturnType<typeof useGetWikimediaStats<WikimediaMemberStats[]>>}) {
  return <><div className="settings-callout"><ShieldCheck size={18}/><p>Statistics include only members who opted in. Consented members appear on the public contributors page with their usernames and per-project totals.</p></div><AdminLoad query={query}/>{!query.isLoading&&!query.error&&(query.data?.length?<><div className="admin-stat-grid"><div><span>CONSENTED MEMBER RECORDS</span><b>{query.data.length}</b></div><div><span>PROJECT ENTRIES AVAILABLE</span><b>{query.data.reduce((n,m)=>n+m.projects.filter(p=>p.available).length,0)}</b></div><div><span>AGGREGATE CONTRIBUTIONS</span><b>{query.data.reduce((n,m)=>n+m.totalContributions,0).toLocaleString()}</b></div></div><div className="admin-table">{projects.map(p=>{const contributors=query.data!.filter(m=>m.projects.some(x=>x.project===p.id&&x.available));const total=contributors.reduce((sum,m)=>sum+(m.projects.find(x=>x.project===p.id)?.contributions??0),0);return <div className="admin-row" key={p.id} data-testid={`admin-project-stat-${p.id}`}><div className="row-main"><b>{p.name}</b><small>Consented and available records only</small></div><span>{contributors.length} contributors</span><b>{total.toLocaleString()}</b></div>})}</div><span className="admin-private-note">Member-specific details omitted from this interface.</span></>:<EmptyAdmin title="No consented statistics available" text="Only explicit opt-in members can contribute to these totals."/> )}</>;
}
function AdminLoad({query}:{query:{isLoading:boolean;error:unknown;refetch:()=>unknown}}){return query.isLoading?<Skeleton rows={3}/>:query.error?<ErrorNotice message={asError(query.error)} retry={()=>query.refetch()}/>:null;}
function EmptyAdmin({title,text}:{title:string;text:string}){const locale=useLocale();return <div className="empty-admin"><BookOpen/><b>{localizeAdmin(locale,title)}</b><span>{localizeAdmin(locale,text)}</span></div>;}
function AdminToolbar({label,onAdd}:{label:string;onAdd:()=>void}){const locale=useLocale();const translated=locale==='ig'?label.replace(' pages',' peeji').replace(' events',' mmemme').replace(' tiers',' ọkwa otu')+' n’ozuzu':label;return <div className="admin-toolbar"><span>{translated}</span><button className="btn-primary" onClick={onAdd} data-testid="button-admin-create"><Plus size={15}/>{localizeAdmin(locale,'Add new')}</button></div>;}
function AdminForm({title,children,onSubmit,onCancel,busy,error}:{title:string;children:ReactNode;onSubmit:(e:FormEvent)=>void;onCancel:()=>void;busy:boolean;error:unknown}){const locale=useLocale();return <form className="admin-form" onSubmit={onSubmit}><div className="admin-form-heading"><h3>{localizeAdmin(locale,title)}</h3><button type="button" className="icon-action" onClick={onCancel} aria-label={t(locale,'Mechie ụdị','Close form')} data-testid="button-admin-cancel"><X size={16}/></button></div>{children}{error?<ErrorNotice message={asError(error)}/>:null}<div className="admin-form-actions"><button type="button" className="btn-outline" onClick={onCancel}>{localizeAdmin(locale,'Cancel')}</button><button type="submit" className="btn-primary" disabled={busy} data-testid="button-admin-save">{busy?<LoaderCircle className="spin" size={15}/>:<Save size={15}/>} {localizeAdmin(locale,'Save')}</button></div></form>;}
function AdminInput({label,value,onChange,type='text',disabled=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;disabled?:boolean}){const locale=useLocale();const id=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return <label className="admin-field">{localizeAdmin(locale,label)}<input className="input" type={type} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} data-testid={`admin-input-${id}`}/></label>;}
function AdminText({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){const locale=useLocale();const id=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return <label className="admin-field">{localizeAdmin(locale,label)}<textarea className="input admin-textarea" value={value} onChange={e=>onChange(e.target.value)} data-testid={`admin-text-${id}`}/></label>;}
function AdminCheck({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){const locale=useLocale();const id=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return <label className="admin-check"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} data-testid={`admin-checkbox-${id}`}/>{localizeAdmin(locale,label)}</label>;}

function CmsPageView({slug,locale,setLocale}:{slug:string;locale:Locale;setLocale:(v:Locale)=>void}) {
  const page=useGetPage(slug,{query:{queryKey:getGetPageQueryKey(slug)}});
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page cms-page shell">{page.isLoading?<Skeleton rows={4}/>:page.error?<ErrorNotice message={asError(page.error)} retry={()=>page.refetch()}/>:page.data?<><div className="page-kicker"><Wordmark/><span>{page.data.updatedAt?new Date(page.data.updatedAt).toLocaleDateString():''}</span></div><h1 className="serif inner-title">{locale==='ig'?page.data.titleIg:page.data.titleEn}</h1><p className="inner-lede">{locale==='ig'?page.data.summaryIg:page.data.summaryEn}</p>{page.data.heroImage&&<img src={page.data.heroImage} alt="" className="cms-hero-image" data-testid="img-cms-hero"/>}<article className="cms-body" data-testid={`cms-body-${slug}`}>{(locale==='ig'?page.data.bodyIg:page.data.bodyEn).split('\n').filter(Boolean).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</article></>:<EmptyAdmin title="This page is not available" text="The page may have been unpublished or removed."/>}</main></PageFrame>;
}
function AuthLocaleButton({locale,setLocale}:{locale:Locale;setLocale:(v:Locale)=>void}){return <button className="auth-locale" onClick={()=>setLocale(locale==='ig'?'en':'ig')} data-testid="button-auth-language">{locale==='ig'?'IG · EN':'EN · IG'}<Languages size={14}/></button>;}
interface AuthProviders { password: boolean; google: boolean; wikimedia: boolean; }
interface WikimediaUsernameSuggestion { name: string; id: number; }
interface WikimediaAccountInfo { username: string; exists: boolean; id: string | null; editCount: number; homeWiki: string | null; registration: string | null; verified: boolean; }

const authErrorMessage = (locale: Locale, code: string) =>
  code === 'oauth_state'
    ? t(locale, 'Nnwale nbata gwuru oge. Biko nwaa ozo.', 'That sign-in attempt expired. Please try again.')
    : code === 'oauth_profile'
      ? t(locale, 'Anyi enwetaghi aha njirimara gi.', 'We could not read your Wikimedia username.')
      : t(locale, 'Nbata akauntu ahu emezughi. Biko nwaa ozo.', 'That sign-in could not be completed. Please try again.');

function useAuthProviders(): AuthProviders {
  const query = useGetAuthProviders();
  return query.data ?? { password: true, google: false, wikimedia: false };
}
function ProviderButtons({ locale }: { locale: Locale }) {
  const providers = useAuthProviders();
  if (!providers.google && !providers.wikimedia) return null;
  return <div className="auth-providers">
    {providers.google && <a className="auth-provider" href="/api/auth/google">{t(locale,"Gaa n'ihu na Google",'Continue with Google')}<ArrowUpRight size={15}/></a>}
    {providers.wikimedia && <a className="auth-provider" href="/api/auth/wikimedia">{t(locale,"Gaa n'ihu na Wikimedia",'Continue with Wikimedia')}<ArrowUpRight size={15}/></a>}
    <span className="auth-divider">{t(locale,'ma o bu','or')}</span>
  </div>;
}
function useWikimediaSuggestions(value: string): WikimediaUsernameSuggestion[] {
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) { setDebounced(''); return; }
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [value]);
  const query = useSearchWikimediaUsernames({ q: debounced }, { query: { enabled: debounced.length >= 2 } });
  return query.data?.suggestions ?? [];
}
function SignInForm({ locale }: { locale: Locale }) {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const login = useLoginAccount();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code) setError(authErrorMessage(locale, code));
  }, [locale]);
  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setError('');
    login.mutate({ data: { identifier, password } }, {
      onSuccess: (data) => { setUser(data.user); setLocation('/member'); },
      onError: (err) => setError(asError(err)),
    });
  };
  return <form className="auth-form" onSubmit={submit}>
    <label>{t(locale,'Email ma o bu aha njirimara','Email or username')}<input className="input" required value={identifier} onChange={e=>setIdentifier(e.target.value)} autoComplete="username" data-testid="input-signin-identifier"/></label>
    <label>{t(locale,'Okwuntughe','Password')}<input className="input" type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" data-testid="input-signin-password"/></label>
    {error && <div className="notice error-notice" role="alert"><CircleHelp size={18}/><span>{error}</span></div>}
    <button type="submit" className="btn-primary" disabled={login.isPending} data-testid="button-signin-submit">{login.isPending?<LoaderCircle className="spin" size={16}/>:t(locale,'Banye','Sign in')}<ArrowRight size={16}/></button>
    <ProviderButtons locale={locale}/>
    <p className="auth-switch">{t(locale,'O nweghi akauntu?','No account yet?')} <Link href="/sign-up">{t(locale,'Meputa akauntu','Create one')}</Link></p>
  </form>;
}
function SignUpForm({ locale }: { locale: Locale }) {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const register = useRegisterAccount();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState<WikimediaAccountInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [showList, setShowList] = useState(false);
  const [error, setError] = useState('');
  const suggestions = useWikimediaSuggestions(username);
  const pick = async (name: string) => {
    setUsername(name); setShowList(false); setChecking(true); setAccount(null); setError('');
    try { setAccount(await verifyWikimediaUsername({ username: name })); }
    catch { /* leave unverified */ }
    finally { setChecking(false); }
  };
  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setError('');
    const payload: { email: string; password: string; username?: string; displayName?: string } = { email, password };
    if (account?.verified) payload.username = account.username;
    if (displayName.trim()) payload.displayName = displayName.trim();
    register.mutate({ data: payload }, {
      onSuccess: (data) => { setUser(data.user); setLocation('/member'); },
      onError: (err) => setError(asError(err)),
    });
  };
  return <form className="auth-form" onSubmit={submit}>
    <p className="auth-form-lede">{t(locale,'Ndebanye aha n’ụzọ atọ: email na okwuntughe, Google, ma ọ bụ akaụntụ Wikimedia. Aha Wikimedia abụghị mmanye — ị nwere ike itinye ma emesịa.', 'Register three ways: email + password, Google, or a Wikimedia account. A Wikimedia username is optional — you can add one later.')}</p>
    <label>{t(locale,'Email','Email')}<input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" data-testid="input-signup-email"/></label>
    <label>{t(locale,'Aha gosipụtara (nhọrọ)','Display name (optional)')}<input className="input" value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" data-testid="input-signup-displayname"/></label>
    <label className="auth-field-username">{t(locale,'Aha Wikimedia (nhọrọ)','Wikimedia username (optional)')}
      <input className="input" value={username} onChange={e=>{setUsername(e.target.value);setShowList(true);setAccount(null);}} onFocus={()=>setShowList(true)} autoComplete="off" placeholder={t(locale,'Malite pinye aha gi','Start typing your username')} data-testid="input-signup-username"/>
      {showList && suggestions.length>0 && <ul className="auth-suggestions">{suggestions.map(s=><li key={s.id}><button type="button" onClick={()=>void pick(s.name)}>{s.name}</button></li>)}</ul>}
    </label>
    {checking && <span className="status-pill"><LoaderCircle className="spin" size={14}/>{t(locale,'Na-enyocha','Checking')}</span>}
    {account?.verified && <div className="notice" role="status"><Check size={18}/><span><b>{account.username}</b> · {account.editCount.toLocaleString()} {t(locale,'ndezi — a ga-ejikọta ya','edits — will be linked')}</span></div>}
    {account && !account.verified && <div className="notice"><CircleHelp size={18}/><span>{t(locale,'Ahụghị ndezi maka aha a. Ị ka nwere ike ịga n’ihu na-enweghị ya.','No contributions found for that name. You can continue without it.')}</span></div>}
    <label>{t(locale,'Okwuntughe (nke karịrị 8)','Password (at least 8 characters)')}<input className="input" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" data-testid="input-signup-password"/></label>
    {error && <div className="notice error-notice" role="alert"><CircleHelp size={18}/><span>{error}</span></div>}
    <button type="submit" className="btn-primary" disabled={register.isPending} data-testid="button-signup-submit">{register.isPending?<LoaderCircle className="spin" size={16}/>:t(locale,'Mepụta akaụntụ','Create account')}<ArrowRight size={16}/></button>
    <ProviderButtons locale={locale}/>
    <p className="auth-switch">{t(locale,'I nwere akaụntụ?','Already have an account?')} <Link href="/sign-in">{t(locale,'Banye','Sign in')}</Link></p>
  </form>;
}
function CompleteProfilePage({ locale, setLocale }: { locale: Locale; setLocale: (v: Locale) => void }) {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const complete = useCompleteProfile();
  const [username, setUsername] = useState(user?.username ?? '');
  const [account, setAccount] = useState<WikimediaAccountInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const suggestions = useWikimediaSuggestions(username);
  const pick = async (name: string) => {
    setUsername(name); setChecking(true); setAccount(null);
    try { setAccount(await verifyWikimediaUsername({ username: name })); } catch { /* ignore */ } finally { setChecking(false); }
  };
  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setError('');
    complete.mutate({ data: { username } }, {
      onSuccess: (data) => { setUser(data.user); setLocation('/member'); },
      onError: (err) => setError(asError(err)),
    });
  };
  return <PageFrame locale={locale} setLocale={setLocale}><main className="inner-page shell"><div className="page-kicker"><Wordmark/><span>PROFILE / PROFAILU</span></div><h1 className="serif inner-title">{t(locale,'Jikoo aha Wikimedia gi','Connect your Wikimedia username')}</h1><p className="inner-lede">{t(locale,'Aha njirimara Wikimedia gi bu njirimara gi n obodo a. Pinye ya ma horo ya na ndeputa.','Your Wikimedia username is your identity in this community. Type it and pick it from the list.')}</p>
    <form className="auth-form auth-form-inline" onSubmit={submit}>
      <label className="auth-field-username">{t(locale,'Aha njirimara Wikimedia','Wikimedia username')}<input className="input" required value={username} onChange={e=>setUsername(e.target.value)} autoComplete="off" data-testid="input-complete-username"/>{suggestions.length>0 && <ul className="auth-suggestions">{suggestions.map(s=><li key={s.id}><button type="button" onClick={()=>void pick(s.name)}>{s.name}</button></li>)}</ul>}</label>
      {checking && <span className="status-pill"><LoaderCircle className="spin" size={14}/>{t(locale,'Na-enyocha','Checking')}</span>}
      {account?.exists && account.verified && <div className="notice" role="status"><Check size={18}/><span><b>{account.username}</b> · {account.editCount.toLocaleString()} {t(locale,'ndezi','edits')}</span></div>}
      {error && <div className="notice error-notice" role="alert"><CircleHelp size={18}/><span>{error}</span></div>}
      <button type="submit" className="btn-primary" disabled={complete.isPending} data-testid="button-complete-submit">{complete.isPending?<LoaderCircle className="spin" size={16}/>:t(locale,'Chekwaa','Save')}<ArrowRight size={16}/></button>
    </form><p className="auth-switch">{t(locale,'Ị chọghị ijikọ ya ugbu a?','Prefer to link it later?')} <Link href="/member" data-testid="link-skip-profile">{t(locale,'Gaa n’ihu','Continue without it')}</Link></p></main></PageFrame>;
}
function SignInPage({locale,setLocale}:{locale:Locale;setLocale:(v:Locale)=>void}) { return <div className="auth-screen"><div className="auth-brand-note"><div className="auth-controls"><ThemeToggle/><AuthLocaleButton locale={locale} setLocale={setLocale}/></div><Link href="/" className="brand-lockup"><BrandMark/><span><b>Igbo Wikimedians</b><small>{t(locale,'Okwu anyị, ihe ọmụma anyị','Our words, our knowledge')}</small></span></Link><p className="serif">{t(locale,'Ebe anyị ga-aga<br/>n’ihu ọnụ.','A place to keep<br/>the work moving.')}</p></div><div className="auth-form-wrap"><SignInForm locale={locale}/></div></div>; }
function SignUpPage({locale,setLocale}:{locale:Locale;setLocale:(v:Locale)=>void}) { return <div className="auth-screen"><div className="auth-brand-note"><div className="auth-controls"><ThemeToggle/><AuthLocaleButton locale={locale} setLocale={setLocale}/></div><Link href="/" className="brand-lockup"><BrandMark/><span><b>Igbo Wikimedians</b><small>{t(locale,'Okwu anyị, ihe ọmụma anyị','Our words, our knowledge')}</small></span></Link><p className="serif">{t(locale,'Bịa dịka ị dị.<br/>E nwere ohere maka gị.','Come as you are.<br/>There’s room to grow.')}</p></div><div className="auth-form-wrap"><SignUpForm locale={locale}/></div></div>; }
function NotFoundView({locale,setLocale}:{locale:Locale;setLocale:(v:Locale)=>void}){return <PageFrame locale={locale} setLocale={setLocale}><main className="empty-feature shell"><span className="eyebrow">404</span><h1 className="serif">{t(locale,'Peeji a adịghị ebe a.','This page is not here.')}</h1><p>{t(locale,'Njikọ a nwere ike ịbụ nke ochie ma ọ bụ dee ya n’ụzọ na-ezighi ezi.','This link may be out of date or mistyped.')}</p><Link href="/" className="btn-primary" data-testid="button-not-found-home">{t(locale,'Laghachi n’ụlọ','Back to home')}<ArrowRight size={16}/></Link></main></PageFrame>;}
function HomeRedirect({locale,setLocale}:{locale:Locale;setLocale:(v:Locale)=>void}){return <HomePage locale={locale} setLocale={setLocale}/>;}
function AuthRoutes({locale,setLocale}:{locale:Locale;setLocale:(v:Locale)=>void}){
  return <Switch>
      <Route path="/" component={()=> <HomeRedirect locale={locale} setLocale={setLocale}/>}/>
      <Route path="/sign-in/*?" component={()=> <SignInPage locale={locale} setLocale={setLocale}/>}/><Route path="/sign-up/*?" component={()=> <SignUpPage locale={locale} setLocale={setLocale}/>}/><Route path="/complete-profile" component={()=> <CompleteProfilePage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/projects" component={()=> <ProjectsPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/events" component={()=> <EventsPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/community" component={()=> <CommunityPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/gallery" component={()=> <GalleryPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/dictionary" component={()=> <DictionaryPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/join" component={()=> <JoinPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/donate" component={()=> <DonatePage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/member" component={()=> <MemberPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/admin" component={()=> <AdminPage locale={locale} setLocale={setLocale}/>}/>
      <Route path="/about/:slug" component={({params})=><CmsPageView slug={params.slug} locale={locale} setLocale={setLocale}/>}/>
      <Route component={()=> <NotFoundView locale={locale} setLocale={setLocale}/>}/>
    </Switch>;
}
function LocaleRoot(){const [locale,setLocale]=useState<Locale>(()=>localStorage.getItem('igbo-locale')==='en'?'en':'ig');const change=(value:Locale)=>{localStorage.setItem('igbo-locale',value);setLocale(value);};return <LocaleContext.Provider value={locale}><AuthRoutes locale={locale} setLocale={change}/><GlobalLoading/></LocaleContext.Provider>;}
function projectsFromContent(items: Record<string, string>[] | undefined): ProjectItem[] {
  if (!items || items.length === 0) return defaultProjects;
  return items.map((it, i) => ({
    id: it.id || String(i),
    ig: it.label_ig || it.label_en || '',
    en: it.label_en || it.label_ig || '',
    name: it.name || it.label_en || '',
    url: it.url || '#',
    userBase: it.user_base || '',
    mark: it.mark || '',
    detailIg: it.detail_ig || '',
    detailEn: it.detail_en || '',
  }));
}
function photosFromContent(items: Record<string, string>[] | undefined): CommonsPhoto[] {
  if (!items || items.length === 0) return defaultCommonsPhotos;
  return items.map((it) => ({
    src: it.src || '',
    altIg: it.alt_ig || it.alt_en || '',
    altEn: it.alt_en || it.alt_ig || '',
    titleIg: it.title_ig || it.title_en || '',
    titleEn: it.title_en || it.title_ig || '',
    author: it.author || '',
    file: it.file || '#',
  }));
}
function SiteContentRoot(){
  const query = useQuery({ queryKey: SITE_CONTENT_QUERY_KEY, queryFn: fetchSiteContent, staleTime: 5*60*1000, retry: 1 });
  const value = useMemo(() => buildSiteContentValue(query.data), [query.data]);
  projects = useMemo(() => projectsFromContent(value.collections.projects), [value]);
  commonsPhotos = useMemo(() => photosFromContent(value.collections.home_photos), [value]);
  setContentLookup(value.lookup);
  return <SiteContentContextProvider value={value}><AuthProvider><WouterRouter base={basePath}><LocaleRoot/></WouterRouter></AuthProvider></SiteContentContextProvider>;
}
function App(){return <QueryClientProvider client={queryClient}><ThemeProvider><SiteContentRoot/></ThemeProvider></QueryClientProvider>;}
export default App;
