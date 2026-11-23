import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro, Poppins, Cormorant_Garamond, Jost, Allura } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const vietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vietnam",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

// certificate typefaces (Brand Book: Cormorant for headlines, Jost Light for body, Allura for one word)
const certSerif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cert-serif", display: "swap" });
const certSans = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-cert-sans", display: "swap" });
const certScript = Allura({ subsets: ["latin"], weight: "400", variable: "--font-cert-script", display: "swap" });

export const metadata: Metadata = {
  title: `${BRAND} | Grow, teach and enrol with one coaching platform`,
  description:
    "Capture leads, run a free masterclass, book discovery calls, take payments and teach a cohort, with WhatsApp and email follow-ups built in.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${vietnam.variable} ${poppins.variable} ${certSerif.variable} ${certSans.variable} ${certScript.variable}`}>
      <body>{children}</body>
    </html>
  );
}
