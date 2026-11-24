import type { Metadata } from "next";
import LearnShell from "@/components/LearnShell";

export const metadata: Metadata = { title: "My learning", robots: { index: false, follow: false } };

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <LearnShell>{children}</LearnShell>;
}
