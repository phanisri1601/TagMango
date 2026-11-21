import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro, Poppins } from "next/font/google";
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

export const metadata: Metadata = {
  title: `${BRAND} | Grow, teach and enrol with one coaching platform`,
  description:
    "Capture leads, run a free masterclass, book discovery calls, take payments and teach a cohort, with WhatsApp and email follow-ups built in.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${vietnam.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
