"use client";

import Navbar from "@/components/landing-page/navbar";
import HeroSection from "@/components/landing-page/heroSection";
import AboutSection from "@/components/landing-page/aboutSection";
import FAQSection from "@/components/landing-page/faqSection";
import BlogSection from "@/components/landing-page/blogSection";
import FeaturesShowcaseSection from "@/components/landing-page/featuresShowcaseSection";
import BertaShowcaseSection from "@/components/landing-page/bertaShowcaseSection";
import FeaturesSection from "@/components/landing-page/featuresSection";
import Footer from "@/components/landing-page/footer";
import TrustedBySection from "@/components/landing-page/trustedBy";
import EverythingYouNeedSection from "@/components/landing-page/everythingYouNeedSection";
import EstateManagementShowcase from "@/components/marketing/EstateManagementShowcase";
import TestimonialsSection from "@/components/landing-page/testimonialsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav + hero framed together (scrolls with the page) */}
      <div className="mx-3 mt-3 overflow-hidden rounded-[24px] border border-[#D0D5DD] bg-white sm:mx-5 sm:mt-5 sm:rounded-[32px] lg:mx-8 lg:rounded-[36px]">
        <Navbar embedded />
        <HeroSection />
      </div>

      <main>
        {/* <AboutSection />
        <FeaturesShowcaseSection /> */}
        <TrustedBySection />
        {/* <EverythingYouNeedSection />
        <EstateManagementShowcase />
        <BertaShowcaseSection />

        <FeaturesSection /> */}
        <TestimonialsSection />
        <FAQSection />
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
