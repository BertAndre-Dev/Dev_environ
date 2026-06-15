import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { LANDING_FAQ_ITEMS } from "@/lib/landing/content";

const SITE_NAME = "Bertahub";
const LANDING_TITLE = "Bertahub | Digital Companion for Smart Living";
const LANDING_DESCRIPTION =
  "Manage property and energy operations, payments, and residents in one platform. Bertahub helps Nigerian estates deliver modern, connected living with smart metering, billing, and maintenance tools.";
const LANDING_OG_IMAGE = "/assets/blog/blogHero.png";

const LANDING_KEYWORDS = [
  "estate management Nigeria",
  "property management software",
  "residential community management",
  "smart metering platform",
  "estate billing software",
  "energy vending",
  "Bertahub",
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
  "Real Estate"
];

function resolveOgImage() {
  return {
    url: absoluteUrl(LANDING_OG_IMAGE),
    width: 1200,
    height: 630,
    alt: "Bertahub digital operating system for Nigerian estates",
  };
}

export function createLandingMetadata(): Metadata {
  const canonical = absoluteUrl("/");
  const ogImage = resolveOgImage();

  return {
    title: LANDING_TITLE,
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

export function createLandingOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/assets/Logo.svg"),
    description: LANDING_DESCRIPTION,
    sameAs: [],
  };
}

export function createLandingWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: LANDING_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}

export function createLandingSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description: LANDING_DESCRIPTION,
    url: getSiteUrl(),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
      description: "Contact Bertahub for estate management pricing",
    },
    featureList: [
      "Smart metering and energy intelligence",
      "Rent and service charge billing",
      "Resident and visitor management",
      "Maintenance request tracking",
      "Electricity token vending",
      "Announcements and resident communication",
    ],
  };
}

export function createLandingFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
