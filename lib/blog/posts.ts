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
    slug: "developers-build-estates-communities-built-afterward",
    title: "Developers Build Estates. Communities Are Built Afterward.",
    excerpt:
      "Handover marks the start of operations, not the end of work. When residents move in, success shifts from buildings to daily experience — and that's where many estates struggle without the right systems.",
    hook: "Completion is not the end of the work. It is the beginning of operations.",
    publishedAt: "2026-06-15",
    readTimeMinutes: 7,
    wordCount: 1100,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blog-2.jpeg",
    featuredImageAlt:
      "Newly completed residential estate with aligned buildings, paved roads, and landscaped surroundings",
    keywords: [
      "estate management after handover",
      "property management Nigeria",
      "estate operations software",
      "community management platform",
      "developer estate handover",
      "residential estate operations",
    ],
  },
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
