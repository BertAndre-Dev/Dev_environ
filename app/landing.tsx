"use client";

import Navbar from "@/components/landing-page/navbar";
import HeroSection from "@/components/landing-page/heroSection";
import CallToActionSection from "@/components/landing-page/callToActionSection";
import FAQSection from "@/components/landing-page/faqSection";
import FeaturesShowcaseSection from "@/components/landing-page/featuresShowcaseSection";
import BertaShowcaseSection from "@/components/landing-page/bertaShowcaseSection";
import FeaturesSection from "@/components/landing-page/featuresSection";
import Footer from "@/components/landing-page/footer";
import TrustedBySection from "@/components/landing-page/trustedBy";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesShowcaseSection />
        <TrustedBySection />
        <FeaturesSection />
        <BertaShowcaseSection />
        <FAQSection />
        <CallToActionSection />
      </main>
      <Footer />
    </div>
  );
}
