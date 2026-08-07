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
    slug: "digital-efficiency-why-it-matters-more-than-ever-in-property-management",
    title:
      "Digital Efficiency: Why It Matters More Than Ever in Property Management",
    excerpt:
      "As portfolios grow and resident expectations rise, manual processes fall short. Here's why digital efficiency is reshaping property management — from operations and resident experience to sustainability and ESG.",
    hook: "Digital efficiency is changing the way modern properties are managed.",
    publishedAt: "2026-08-05",
    readTimeMinutes: 5,
    wordCount: 780,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blog-7.jpeg",
    featuredImageAlt:
      "Digital Efficiency: The Foundation of Smarter Property Management — property management dashboard on laptop and smartphone with modern residential buildings",
    keywords: [
      "digital efficiency property management",
      "digital property management",
      "PropTech estate management",
      "digital estate management Nigeria",
      "facility management technology",
      "sustainable property management ESG",
    ],
  },
  {
    slug: "how-sustainability-is-redefining-estate-management-in-nigeria",
    title: "How Sustainability Is Redefining Estate Management in Nigeria",
    excerpt:
      "Sustainability is no longer optional for Nigerian estates. From resident expectations and cost savings to digital systems and stronger communities, here’s how sustainable thinking is reshaping modern estate management.",
    hook: "Is this estate being managed sustainably?",
    publishedAt: "2026-07-23",
    readTimeMinutes: 7,
    wordCount: 980,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blog-6.jpeg",
    featuredImageAlt:
      "Sustainable residential estate entrance with solar-powered street lighting, recycling bins, and a modern security gatehouse",
    keywords: [
      "sustainable estate management Nigeria",
      "green estate communities",
      "digital estate management",
      "estate sustainability practices",
      "sustainable property management Nigeria",
      "estate operations efficiency",
    ],
  },
  {
    slug: "how-estate-managers-can-prepare-for-the-next-decade",
    title: "How Estate Managers Can Prepare for the Next Decade",
    excerpt:
      "Resident expectations, rising costs, and digital demand are reshaping estate management. Here are six ways estate managers can prepare for the decade ahead, from digital tools and sustainability to leadership and community.",
    hook: "The question is no longer whether change is coming. The question is whether estate managers are ready for it.",
    publishedAt: "2026-07-13",
    readTimeMinutes: 8,
    wordCount: 1150,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blog-5.jpeg",
    featuredImageAlt:
      "Modern residential estate preparing for the future of estate management",
    keywords: [
      "future of estate management",
      "digital transformation estates",
      "estate manager skills",
      "sustainable estate operations",
      "resident experience estate management",
      "estate management Nigeria",
    ],
  },
  {
    slug: "5-practical-ways-estate-managers-can-make-communities-more-sustainable",
    title:
      "5 Practical Ways Estate Managers Can Make Their Communities More Sustainable",
    excerpt:
      "Sustainability goes beyond appearances. From going paperless to preventive maintenance and resident engagement, here are five practical steps estate managers can take to build greener, more efficient communities.",
    hook: "A truly sustainable estate uses its resources wisely, and meaningful change often starts with simple operational decisions.",
    publishedAt: "2026-07-07",
    readTimeMinutes: 4,
    wordCount: 380,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blog-4.jpeg",
    featuredImageAlt:
      "Well-managed residential estate with green spaces and sustainable community practices",
    keywords: [
      "sustainable estate management",
      "green estate communities",
      "estate sustainability practices",
      "digital estate management",
      "preventive maintenance estates",
      "sustainable property management Nigeria",
    ],
  },
  {
    slug: "why-resident-experience-should-be-every-estate-managers-priority",
    title: "Why Resident Experience Should Be Every Estate Manager's Priority",
    excerpt:
      "Two estates can look identical on day one — but six months later, resident experience tells a different story. Operations matter, but what residents feel every day is what defines a thriving community.",
    hook: "Residents don't judge your estate by what happens behind the scenes. They judge it by what they experience every day.",
    publishedAt: "2026-06-22",
    readTimeMinutes: 5,
    wordCount: 650,
    category: "Estate Management",
    author: "Bertahub Team",
    featuredImage: "/assets/blog/blog-3.jpg",
    featuredImageAlt:
      "Residents enjoying a well-managed residential estate community",
    keywords: [
      "resident experience estate management",
      "estate manager priorities",
      "property management resident satisfaction",
      "estate community management",
      "resident engagement platform",
      "estate operations Nigeria",
    ],
  },
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
