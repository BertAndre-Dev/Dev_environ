import type { BlogPostMeta } from "@/lib/blog/posts";
import {
  createBlogArticleJsonLd,
  createBlogBreadcrumbJsonLd,
  createBlogListingJsonLd,
} from "@/lib/blog/seo";

type JsonLdScriptProps = {
  readonly data: Record<string, unknown> | Record<string, unknown>[];
};

function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BlogArticleJsonLd({ post }: { readonly post: BlogPostMeta }) {
  return (
    <>
      <JsonLdScript data={createBlogArticleJsonLd(post)} />
      <JsonLdScript data={createBlogBreadcrumbJsonLd(post)} />
    </>
  );
}

export function BlogListingJsonLd({
  posts,
}: {
  readonly posts: BlogPostMeta[];
}) {
  return <JsonLdScript data={createBlogListingJsonLd(posts)} />;
}
