import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import type { BlogPostMeta } from "@/lib/blog/posts";

const SITE_NAME = "Bertahub";
const PUBLISHER_NAME = "Bertahub";
const FALLBACK_OG_IMAGE = "/icon.png";

const BLOG_INDEX_KEYWORDS = [
  "estate management Nigeria",
  "digital estate platform",
  "residential community management",
  "Bertahub blog",
  "estate management software",
];

function truncateDescription(text: string, maxLength = 160): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : truncated.length).trim()}…`;
}

function resolveOgImage(imagePath?: string) {
  const path = imagePath ?? FALLBACK_OG_IMAGE;
  return {
    url: absoluteUrl(path),
    width: imagePath?.includes("blog/") ? 1200 : 512,
    height: imagePath?.includes("blog/") ? 630 : 512,
    alt: imagePath?.includes("blogHero")
      ? "Bertahub digital operating system for Nigerian estates"
      : imagePath?.includes("blog/")
        ? "Modern Nigerian residential estate entrance"
        : `${SITE_NAME} logo`,
  };
}

export function createBlogIndexMetadata(): Metadata {
  const title = "Blog | Bertahub";
  const description =
    "Insights on estate management, digital transformation, and building smarter communities in Nigeria.";
  const canonical = absoluteUrl("/blog");
  const ogImage = resolveOgImage("/assets/blog/blogHero.png");

  return {
    title,
    description,
    keywords: BLOG_INDEX_KEYWORDS,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_NG",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export function createBlogPostMetadata(post: BlogPostMeta): Metadata {
  const title = `${post.title} | Bertahub Blog`;
  const description = truncateDescription(post.excerpt);
  const canonical = absoluteUrl(`/blog/${post.slug}`);
  const ogImage = resolveOgImage(post.featuredImage);

  return {
    title,
    description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "article",
      locale: "en_NG",
      publishedTime: post.publishedAt,
      authors: [post.author],
      section: post.category,
      tags: post.keywords,
      images: [
        {
          ...ogImage,
          alt: post.featuredImageAlt ?? ogImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage.url],
    },
  };
}

export function createBlogArticleJsonLd(post: BlogPostMeta) {
  const imagePath = post.featuredImage ?? FALLBACK_OG_IMAGE;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(imagePath)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author,
      url: getSiteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: getSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/Logo.svg"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
    articleSection: post.category,
    keywords: post.keywords.join(", "),
    wordCount: post.wordCount,
    timeRequired: `PT${post.readTimeMinutes}M`,
    inLanguage: "en-NG",
  };
}

export function createBlogBreadcrumbJsonLd(post: BlogPostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: getSiteUrl(),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: absoluteUrl(`/blog/${post.slug}`),
      },
    ],
  };
}

export function createBlogListingJsonLd(posts: BlogPostMeta[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Bertahub Blog",
    description:
      "Insights on estate management, digital transformation, and building smarter communities in Nigeria.",
    url: absoluteUrl("/blog"),
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: getSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/Logo.svg"),
      },
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      author: {
        "@type": "Organization",
        name: post.author,
      },
      image: absoluteUrl(post.featuredImage ?? FALLBACK_OG_IMAGE),
    })),
  };
}
