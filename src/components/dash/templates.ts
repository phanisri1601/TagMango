/* Page templates shared by Mango Pages (dashboard) and the public /p/[slug] renderer. Brand Book colours only. */
export type Mode = "light" | "white" | "mist" | "dark" | "graphite";
export type Template = { id: string; name: string; desc: string; premium?: boolean; isNew?: boolean; mode: Mode; layout: "split" | "center" | "editorial"; font: "serif" | "sans" };

export const TEMPLATES: Template[] = [
  { id: "paper", name: "Paper", desc: "Warm, calm and centred", mode: "light", layout: "center", font: "serif" },
  { id: "noir", name: "Noir", desc: "Dark and cinematic, photo on the right", mode: "dark", layout: "split", font: "serif" },
  { id: "clean", name: "Clean", desc: "Bright white, simple and modern", mode: "white", layout: "center", font: "sans" },
  { id: "mist", name: "Mist", desc: "Soft grey, editorial layout", isNew: true, mode: "mist", layout: "editorial", font: "serif" },
  { id: "studio", name: "Studio", desc: "White with a bold split hero", premium: true, mode: "white", layout: "split", font: "sans" },
  { id: "atelier", name: "Atelier", desc: "Refined serif, numbered benefits", premium: true, mode: "light", layout: "editorial", font: "serif" },
  { id: "ink", name: "Ink", desc: "Big bold type on black", premium: true, mode: "dark", layout: "center", font: "sans" },
  { id: "graphite", name: "Graphite", desc: "Slate tone with a split hero", premium: true, isNew: true, mode: "graphite", layout: "split", font: "sans" },
];

/** Templates saved before the redesign keep working. */
const LEGACY: Record<string, string> = { sunrise: "ink", midnight: "noir", forest: "graphite", violet: "studio", ocean: "mist", blush: "atelier" };
export const tpl = (id: unknown) => TEMPLATES.find((t) => t.id === id || t.id === LEGACY[String(id)]) || TEMPLATES[0];

const PAPER = "#f4f2ed", MIST = "#e9e6e0", GRAPHITE = "#5c5a55", INK = "#141413", DARK = "#171716";
export const MODE: Record<Mode, { bg: string; text: string; muted: string; card: string; line: string; accent: string; onAccent: string }> = {
  light: { bg: PAPER, text: INK, muted: GRAPHITE, card: "#ffffff", line: MIST, accent: INK, onAccent: "#ffffff" },
  white: { bg: "#ffffff", text: INK, muted: GRAPHITE, card: PAPER, line: MIST, accent: INK, onAccent: "#ffffff" },
  mist: { bg: MIST, text: INK, muted: GRAPHITE, card: PAPER, line: "#d3cfc7", accent: INK, onAccent: "#ffffff" },
  dark: { bg: DARK, text: PAPER, muted: "#b9b5ad", card: "#22211f", line: "#3a3935", accent: PAPER, onAccent: INK },
  graphite: { bg: GRAPHITE, text: "#ffffff", muted: "#d9d5cd", card: "#4d4b47", line: "#76736d", accent: PAPER, onAccent: INK },
};
