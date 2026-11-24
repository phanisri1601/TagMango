import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Funnel from "@/components/Funnel";
import MeetHer from "@/components/MeetHer";
import PatternDemo from "@/components/PatternDemo";
import ProductTabs from "@/components/ProductTabs";
import DropOff from "@/components/DropOff";
import OnePlace from "@/components/OnePlace";
import Weeks from "@/components/Weeks";
import Automation from "@/components/Automation";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="theme-brand">
      <Navbar />
      <main>
        <Hero />
        <MeetHer />
        <Funnel />
        <PatternDemo />
        <ProductTabs />
        <DropOff />
        <OnePlace />
        <Weeks />
        <Automation />
        <Faq />
        <Footer />
      </main>
    </div>
  );
}
