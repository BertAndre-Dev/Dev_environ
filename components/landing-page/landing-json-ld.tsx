import {
  createLandingFaqJsonLd,
  createLandingOrganizationJsonLd,
  createLandingSoftwareApplicationJsonLd,
  createLandingWebSiteJsonLd,
} from "@/lib/landing/seo";

function JsonLdScript({ data }: { readonly data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function LandingJsonLd() {
  return (
    <>
      <JsonLdScript data={createLandingOrganizationJsonLd()} />
      <JsonLdScript data={createLandingWebSiteJsonLd()} />
      <JsonLdScript data={createLandingSoftwareApplicationJsonLd()} />
      <JsonLdScript data={createLandingFaqJsonLd()} />
    </>
  );
}
