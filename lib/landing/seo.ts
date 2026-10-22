import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import {
  LAGOS_ESTATE_SEO_PHRASES,
  LANDING_FAQ_ITEMS,
} from "@/lib/landing/content";

const SITE_NAME = "Bertahub";
const LANDING_TITLE = "Bertahub | Digital Companion for Smart Living";
const LANDING_DESCRIPTION =
  "Manage property and energy operations, payments, and residents in one platform. Bertahub helps Nigerian estates deliver modern, connected living with smart metering, billing, and maintenance tools.";
const LANDING_OG_IMAGE = "/assets/blog/blogHero.png";

const LANDING_KEYWORDS = [  
  "Bertahub estate management Nigeria",
  "property management software",
  "Bertahub residential community management",
  "Bertahub smart metering platform",
  "Bertahub estate billing software",
  "Bertahub energy vending",
  "Berta Hub",
  "Nigerian estates",
  "Estate management software",
  "Estate management system",
  "Estate management solution",
  "Estate management platform",
  "Estate management tool",
  "Estate management app",
  "Estate management service",
  "Estate management company",
  "Estate management consultant",
  "Real Estate",
  "Bertahub property management",
  "Bertahub real property management",
  "Bertahub rental property management",
  "Bertahub property management app",
  "Bertahub property management and maintenance",
  "Bertahub property management assistant",
  "Bertahub property management companies in Nigeria",
  "Bertahub property management companies in Lagos",
  "Bertahub property management companies in Africa",
  "Bertahub property management companies in Lagos, Nigeria",
  "Bertahub Operating system for real estate",
  "Bertahub Real Estate Property Management",
  ...LAGOS_ESTATE_SEO_PHRASES,
];

function resolveOgImage() {
  return {
    url: absoluteUrl(LANDING_OG_IMAGE),
    width: 1200,
    height: 630,
    alt: "Bertahub digital operating system for Nigerian estates",
  };
}

const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;
const WEBSITE_ID = `${getSiteUrl()}/#website`;
const APP_ID = `${getSiteUrl()}/#app`;
const FAQ_ID = `${getSiteUrl()}/#faq`;
const WEBPAGE_ID = `${getSiteUrl()}/#webpage`;

const APP_STORE_URL = "https://apps.apple.com/ng/app/berta-hub/id6756385415";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.bertahub.com";

export function createLandingMetadata(): Metadata {
  const canonical = absoluteUrl("/");
  const ogImage = resolveOgImage();

  return {
    title: { absolute: LANDING_TITLE },
    description: LANDING_DESCRIPTION,
    keywords: LANDING_KEYWORDS,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_NG",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
      images: [ogImage.url],
    },
  };
}

export function createLandingJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        legalName: "BertAndre Consulting Limited",
        alternateName: ["Berta Hub", "BertaHub"],
        url: getSiteUrl(),
        logo: absoluteUrl("/assets/Logo.svg"),
        description: LANDING_DESCRIPTION,
        email: "info@bertandregroup.com",
        telephone: "+2349138667927",
        areaServed: {
          "@type": "Country",
          name: "Nigeria",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "info@bertandregroup.com",
          telephone: "+2349138667927",
          areaServed: "NG",
          availableLanguage: ["English"],
        },
        sameAs: [
          "https://www.instagram.com/bertandregroup",
          "https://youtube.com/bertandregroup",
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: getSiteUrl(),
        description: LANDING_DESCRIPTION,
        inLanguage: "en-NG",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "SoftwareApplication",
        "@id": APP_ID,
        name: SITE_NAME,
        alternateName: "Berta Hub",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Estate management software",
        operatingSystem: "Web, iOS, Android",
        description: LANDING_DESCRIPTION,
        url: getSiteUrl(),
        installUrl: [APP_STORE_URL, PLAY_STORE_URL],
        downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
        provider: { "@id": ORGANIZATION_ID },
        featureList: [
          "Smart metering and energy intelligence",
          "Rent and service charge billing",
          "Resident and visitor management",
          "Maintenance request tracking",
          "Electricity token vending",
          "Announcements and resident communication",
        ],
        offers: {
          "@type": "Offer",
          priceCurrency: "NGN",
          availability: "https://schema.org/OnlineOnly",
          description:
            "Bertahub prices each estate separately. Book a demo for a quote.",
        },
      },
      {
        "@type": "FAQPage",
        "@id": FAQ_ID,
        url: absoluteUrl("/#faq"),
        isPartOf: { "@id": WEBPAGE_ID },
        mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "WebPage",
        "@id": WEBPAGE_ID,
        url: absoluteUrl("/"),
        name: LANDING_TITLE,
        description: LANDING_DESCRIPTION,
        inLanguage: "en-NG",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": APP_ID },
        publisher: { "@id": ORGANIZATION_ID },
        primaryImageOfPage: {
          "@type": "ImageObject",
          ...resolveOgImage(),
          caption: resolveOgImage().alt,
        },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["#faq-what-is-bertahub", "#faq-what-is-bertahub-answer"],
        },
      },
    ],
  };
}
