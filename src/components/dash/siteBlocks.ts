/** Website Builder: section types, their defaults, and ready-made starting points. */
export type BlockKind = "hero" | "features" | "steps" | "stats" | "text" | "image" | "video" | "testimonial" | "offer" | "faq" | "cta";
export type Tone = "light" | "mist" | "dark" | "brand";
export type Block = {
  id: string;
  kind: BlockKind;
  title?: string;
  body?: string;
  /** One item per line. features/steps: "Title|Description", stats: "Value|Label", faq: "Question|Answer", testimonial: "Quote|Name|Role", offer: plain lines. */
  items?: string;
  button?: string;
  link?: string;
  image?: string;
  /** Small label above a heading, or the price on an offer. */
  meta?: string;
  align?: "left" | "center";
  tone?: Tone;
};
export type SiteTheme = { font?: "serif" | "sans"; radius?: "soft" | "sharp" };
export type SiteSeo = { title?: string; description?: string };

const id = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const BLOCK_DEFS: Record<BlockKind, { label: string; desc: string; make: () => Omit<Block, "id"> }> = {
  hero: { label: "Hero", desc: "The big opening: headline, sub-text, button and an optional photo.", make: () => ({ kind: "hero", meta: "Your programme", title: "A headline that says what changes for them", body: "One or two sentences about who this is for and the result they get.", button: "Get started", align: "left", tone: "dark" }) },
  stats: { label: "Numbers", desc: "Three or four proof points, like learners, years or results.", make: () => ({ kind: "stats", items: "1,000+|Learners\n6 weeks|To see a change\n4.9/5|Average rating", tone: "light" }) },
  features: { label: "Benefits", desc: "Cards that explain what they get.", make: () => ({ kind: "features", title: "What you get", body: "", items: "Live sessions|Small groups, real conversations\nRecorded lessons|Watch again whenever you like\nPrivate community|Support between sessions", tone: "light" }) },
  steps: { label: "How it works", desc: "Numbered steps from start to result.", make: () => ({ kind: "steps", title: "How it works", items: "Join|Enrol in one minute\nLearn|Weekly lessons and live classes\nChange|Practise and get feedback", tone: "mist" }) },
  text: { label: "Text", desc: "A heading and a paragraph, for your story or details.", make: () => ({ kind: "text", title: "About this programme", body: "Write a few short paragraphs here.", align: "left", tone: "light" }) },
  image: { label: "Image", desc: "A wide picture with an optional caption.", make: () => ({ kind: "image", image: "", body: "", tone: "light" }) },
  video: { label: "Video", desc: "Play a YouTube, Vimeo or uploaded video.", make: () => ({ kind: "video", title: "Watch this first", link: "", tone: "light" }) },
  testimonial: { label: "Testimonials", desc: "Quotes from people you have helped.", make: () => ({ kind: "testimonial", title: "In their words", items: "This changed how I show up at work.|Asha Rao|Programme manager\nClear, practical and kind.|Karthik Raman|Founder", tone: "mist" }) },
  offer: { label: "Offer", desc: "The programme with price, what is included and a buy button.", make: () => ({ kind: "offer", title: "Join the programme", meta: "₹0", body: "Everything you need, in one place.", items: "Live classes\nWeekly assignments\nWritten feedback\nCertificate", button: "Enrol now", tone: "dark" }) },
  faq: { label: "Questions", desc: "Answer doubts before they ask.", make: () => ({ kind: "faq", title: "Questions", items: "Who is this for?|Anyone who wants a clear method and support.\nWhat if I miss a class?|Every class has a replay.", tone: "light" }) },
  cta: { label: "Call to action", desc: "A closing nudge with one button.", make: () => ({ kind: "cta", title: "Ready to begin?", body: "It takes a minute to get started.", button: "Get started", tone: "brand" }) },
};
export const BLOCK_KINDS = Object.keys(BLOCK_DEFS) as BlockKind[];
export const newBlock = (kind: BlockKind): Block => ({ id: id(), ...BLOCK_DEFS[kind].make() });

const mk = (...kinds: (BlockKind | [BlockKind, Partial<Block>])[]): Block[] => kinds.map((k) => (Array.isArray(k) ? { ...newBlock(k[0]), ...k[1] } : newBlock(k)));

/** Starting points offered when a website is created. */
export const STARTERS: { id: string; name: string; desc: string; theme: SiteTheme; blocks: () => Block[] }[] = [
  { id: "coach", name: "Coach programme", desc: "Story, benefits, steps, proof and a clear offer.", theme: { font: "serif", radius: "soft" }, blocks: () => mk(
    ["hero", { meta: "Six-week programme", title: "See the pattern that runs your choices. Then change it.", body: "A small, guided programme for people who are capable and still stuck in the same loop.", button: "Apply now" }], "stats", "features", "steps", "testimonial", ["offer", { title: "Join the next cohort", meta: "₹75,000" }], "faq", "cta") },
  { id: "course", name: "Course launch", desc: "Sell a self-paced course with a video and a strong offer.", theme: { font: "sans", radius: "soft" }, blocks: () => mk(
    ["hero", { meta: "New course", title: "Learn it properly, at your own pace", align: "center", tone: "dark", button: "Start learning" }], "video", "features", "stats", ["offer", { title: "Get instant access", meta: "₹4,999" }], "testimonial", "faq") },
  { id: "webinar", name: "Free webinar", desc: "Fill a live session with one clear sign-up button.", theme: { font: "sans", radius: "sharp" }, blocks: () => mk(
    ["hero", { meta: "Free live session", title: "A 2-hour masterclass you can join from anywhere", body: "Limited seats. Replay for everyone who registers.", align: "center", tone: "brand", button: "Reserve my seat" }], "steps", "features", "faq", "cta") },
  { id: "simple", name: "Simple page", desc: "A short, quiet page: headline, details, one button.", theme: { font: "serif", radius: "sharp" }, blocks: () => mk(
    ["hero", { align: "center", tone: "light", title: "Hello, I'm glad you're here", body: "A short line about what you do and who it is for.", button: "Say hello" }], "text", "cta") },
];
