export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  hook: string;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  wordCount?: number;
  category: string;
  author: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  keywords: string[];
};

export const blogPosts: BlogPostMeta[] = [
  {
    slug: "why-nigerian-estates-need-digital-operating-system",
    title: "Why Nigerian Estates Need a Digital Operating System",
    excerpt:
      "Nigeria's estates are growing faster than the tools used to manage them. Spreadsheets, WhatsApp groups, and manual billing can't keep up — here's why a digital operating system is no longer optional.",
    hook: "Your residents bank on their phones. Why is your estate still run on spreadsheets?",
    publishedAt: "2026-06-08",
    readTimeMinutes: 12,
    wordCount: 2400,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blogHero.png",
    featuredImageAlt:
      "Bertahub digital operating system for Nigerian estates shown on laptop and mobile dashboard",
    keywords: [
      "digital estate management Nigeria",
      "estate management software Nigeria",
      "digital operating system for estates",
      "estate billing software Lagos",
      "residential estate management",
      "service charge collection Nigeria",
    ],
  },
];

export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
