import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

const SITE_NAME = "Bertahub";

export function createPublicPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title: { absolute: title },
    description,
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
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
