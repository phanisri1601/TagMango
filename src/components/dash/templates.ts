/* Page templates shared by Mango Pages (dashboard) and the public /p/[slug] renderer. */
export type Template = { id: string; name: string; premium?: boolean; isNew?: boolean; bg: string; accent: string; text: string; layout: "split" | "center" | "card" };

export const TEMPLATES: Template[] = [
  { id: "sunrise", name: "Sunrise", bg: "linear-gradient(135deg,#141413,#5c5a55)", accent: "#ffffff", text: "#ffffff", layout: "center" },
  { id: "midnight", name: "Midnight", bg: "linear-gradient(135deg,#0f172a,#171716)", accent: "#141413", text: "#ffffff", layout: "split" },
  { id: "paper", name: "Paper", bg: "#f4f2ed", accent: "#141413", text: "#0f0f0f", layout: "card" },
  { id: "forest", name: "Forest", isNew: true, bg: "linear-gradient(135deg,#14532d,#4d7c0f)", accent: "#bef264", text: "#ffffff", layout: "center" },
  { id: "violet", name: "Violet Coach", premium: true, bg: "linear-gradient(135deg,#141413,#141413)", accent: "#e9e6e0", text: "#ffffff", layout: "split" },
  { id: "ocean", name: "Ocean Webinar", premium: true, isNew: true, bg: "linear-gradient(135deg,#141413,#141413)", accent: "#fef08a", text: "#ffffff", layout: "center" },
  { id: "noir", name: "Noir Masterclass", premium: true, bg: "#0b0b0b", accent: "#141413", text: "#ffffff", layout: "card" },
  { id: "blush", name: "Blush Wellness", premium: true, bg: "linear-gradient(135deg,#e9e6e0,#e9e6e0)", accent: "#141413", text: "#171716", layout: "center" },
];

export const tpl = (id: unknown) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
