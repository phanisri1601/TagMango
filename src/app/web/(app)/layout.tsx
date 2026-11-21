import Shell from "@/components/dash/Shell";

export const metadata = { title: "Nitienaa Rao | Dashboard" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
