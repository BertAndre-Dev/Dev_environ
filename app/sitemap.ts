import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog/posts";
import { absoluteUrl } from "@/lib/site-url";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: absoluteUrl("/"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: absoluteUrl("/blog"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: absoluteUrl("/privacy-notice"),
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: absoluteUrl("/cookie-policy"),
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: absoluteUrl("/terms-and-conditions"),
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...STATIC_ROUTES, ...blogRoutes];
}
