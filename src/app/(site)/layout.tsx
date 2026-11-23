import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

/** Public website pages share the landing page's navbar and footer, in the brand colour theme. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-brand min-h-screen text-[#141413]">
      <Navbar light />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}
