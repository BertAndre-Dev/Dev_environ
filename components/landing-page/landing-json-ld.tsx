import { createLandingJsonLdGraph } from "@/lib/landing/seo";

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
      <JsonLdScript
        data={createLandingJsonLdGraph() as Record<string, unknown>}
      />
    </>
  );
}
