import { PLAN_LIMITS, PLAN_ORDER, type Plan } from "@/components/dash/nav";

/** What each plan costs and includes. Shown on the pricing page and in Billing and Plans; the limits come from PLAN_LIMITS, which the server enforces. */
const n = (v: number) => (v >= 1e9 ? "Unlimited" : String(v));

export type PlanCard = { id: Plan; name: string; price: string; unit: string; fee: string; blurb: string; lead?: string; popular?: boolean; items: string[] };

export const PLAN_CARDS: PlanCard[] = [
  {
    id: "basic", name: "Basic", price: "₹0", unit: "forever", fee: "10% commission per sale", blurb: "Start selling and capture leads. No monthly fee.",
    items: [
      `Up to ${PLAN_LIMITS.basic.mangoes} mangoes, ${PLAN_LIMITS.basic.courses} courses and ${PLAN_LIMITS.basic.workshops} workshops`,
      `${PLAN_LIMITS.basic.events} one-to-one event and ${PLAN_LIMITS.basic.pages} Mango pages (4 free designs)`,
      `${PLAN_LIMITS.basic.storageGB} GB file storage for videos and PDFs`,
      "Secure checkout with receipts and refunds",
      "Pattern Check, lead records and funnel numbers",
      "Free masterclass and discovery call booking",
      "Link-in-bio page and tracked links",
      "Learning portal for one programme",
      "16 ready-made email and WhatsApp workflows (switch on or off)",
      "Certificates (1 template) with each learner's name filled in",
    ],
  },
  {
    id: "pro", name: "Pro", price: "₹5,000", unit: "+GST / month", fee: "5.5% commission per sale", lead: "Everything in Basic +", blurb: "For coaches who are growing and want to customise.",
    items: [
      `Up to ${PLAN_LIMITS.pro.mangoes} mangoes, courses and workshops`,
      `${PLAN_LIMITS.pro.storageGB} GB file storage`,
      "All 8 Mango page designs, including premium ones",
      `Website Builder: ${PLAN_LIMITS.pro.sites} websites with 11 section types`,
      `Edit every workflow message and create up to ${PLAN_LIMITS.pro.customWorkflows} of your own`,
      "Weekly report emailed every Monday",
      "Website blog",
      "WhatsApp templates, broadcasts and event personalisation",
      `Up to ${PLAN_LIMITS.pro.certificates} certificate templates`,
      "Banners, unsubscribe list and blocked users",
    ],
  },
  {
    id: "advanced", name: "Advanced", price: "₹15,000", unit: "+GST / month", fee: "3.5% commission per sale", lead: "Everything in Pro +", popular: true, blurb: "For teams and bigger communities.",
    items: [
      `Up to ${PLAN_LIMITS.advanced.mangoes} of each product, ${PLAN_LIMITS.advanced.storageGB} GB storage`,
      `${PLAN_LIMITS.advanced.sites} websites and ${PLAN_LIMITS.advanced.customWorkflows} custom workflows`,
      "Team management with named logins",
      "Path automation",
      "Affiliates and referral commissions",
      "Points, badges and leaderboard",
      "Manage and limit login sessions",
    ],
  },
  {
    id: "ultimate", name: "Ultimate", price: "₹35,000", unit: "+GST / month", fee: "Zero commission", lead: "Everything in Advanced +", blurb: "No limits, full control of your brand.",
    items: [
      "No limits on products, pages, websites or workflows",
      `${PLAN_LIMITS.ultimate.storageGB} GB file storage`,
      "Your own branding across the platform",
      "Menu customisation",
      "Migration help from another platform",
    ],
  },
];

/** Rows of the comparison table: label and what each plan gets. */
export const COMPARE: { label: string; v: (p: Plan) => string }[] = [
  { label: "Commission per sale", v: (p) => ({ basic: "10%", pro: "5.5%", advanced: "3.5%", ultimate: "0%" })[p] },
  { label: "Mangoes", v: (p) => n(PLAN_LIMITS[p].mangoes) },
  { label: "Courses", v: (p) => n(PLAN_LIMITS[p].courses) },
  { label: "Workshops", v: (p) => n(PLAN_LIMITS[p].workshops) },
  { label: "One-to-one events", v: (p) => n(PLAN_LIMITS[p].events) },
  { label: "Mango pages", v: (p) => n(PLAN_LIMITS[p].pages) },
  { label: "Premium page designs", v: (p) => (PLAN_ORDER.indexOf(p) >= 1 ? "✓" : "—") },
  { label: "Websites (Website Builder)", v: (p) => (PLAN_LIMITS[p].sites ? n(PLAN_LIMITS[p].sites) : "—") },
  { label: "Custom workflows", v: (p) => (PLAN_LIMITS[p].customWorkflows ? n(PLAN_LIMITS[p].customWorkflows) : "—") },
  { label: "Edit workflow messages", v: (p) => (PLAN_ORDER.indexOf(p) >= 1 ? "✓" : "—") },
  { label: "Weekly report email", v: (p) => (PLAN_ORDER.indexOf(p) >= 1 ? "✓" : "—") },
  { label: "Website blog", v: (p) => (PLAN_ORDER.indexOf(p) >= 1 ? "✓" : "—") },
  { label: "WhatsApp broadcasts and templates", v: (p) => (PLAN_ORDER.indexOf(p) >= 1 ? "✓" : "—") },
  { label: "Certificate templates", v: (p) => n(PLAN_LIMITS[p].certificates) },
  { label: "File storage", v: (p) => `${PLAN_LIMITS[p].storageGB} GB` },
  { label: "Team members", v: (p) => (PLAN_ORDER.indexOf(p) >= 2 ? "✓" : "—") },
  { label: "Affiliates and gamification", v: (p) => (PLAN_ORDER.indexOf(p) >= 2 ? "✓" : "—") },
  { label: "Own branding and menu", v: (p) => (p === "ultimate" ? "✓" : "—") },
];
