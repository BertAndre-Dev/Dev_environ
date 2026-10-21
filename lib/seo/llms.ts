import { blogPosts } from "@/lib/blog/posts";
import {
  LAGOS_ESTATE_SEO_PHRASES,
  LANDING_FAQ_ITEMS,
} from "@/lib/landing/content";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

const SUMMARY =
  "Bertahub (also called Berta Hub) is an estate operating system from BertAndre Consulting Limited. It helps residential estates in Nigeria manage smart metering, electricity vending, billing, residents, visitors, maintenance, and announcements.";

export function buildLlmsTxt(): string {
  const site = getSiteUrl();
  const lines = [
    "# Bertahub",
    "",
    `> ${SUMMARY}`,
    "",
    "Bertahub is the public product name. The company is BertAndre Consulting Limited. The product is available on the web and as iOS and Android apps. Private dashboards, sign-in, and API routes are not public documentation.",
    "",
    "## Answers",
    ...LANDING_FAQ_ITEMS.slice(0, 3).map(
      (item) =>
        `- [${item.question}](${absoluteUrl("/#faq")}): ${item.answer}`,
    ),
    "",
    "## Pages",
    `- [Home](${absoluteUrl("/")}): Product overview, plans, and frequently asked questions.`,
    `- [FAQ](${absoluteUrl("/#faq")}): What Bertahub is, who it is for, and how estate operations, billing, metering, visitors, and maintenance work.`,
    `- [Blog](${absoluteUrl("/blog")}): Articles on estate management, energy, and community operations in Nigeria.`,
    `- [Privacy Notice](${absoluteUrl("/privacy-notice")}): How BertAndre Consulting Limited handles personal data under the Nigeria Data Protection Act 2023.`,
    `- [Cookie Policy](${absoluteUrl("/cookie-policy")}): Cookies used on the Bertahub website.`,
    `- [Terms and Conditions](${absoluteUrl("/terms-and-conditions")}): Terms for using the Bertahub platform.`,
    "",
    "## Topics",
    ...LAGOS_ESTATE_SEO_PHRASES.map(
      (phrase) => `- [${phrase}](${absoluteUrl("/#faq")})`,
    ),
    "",
    "## Contact",
    "- Email: info@bertandregroup.com",
    "- Phone: +234 913 866 7927",
    "- Instagram: https://www.instagram.com/bertandregroup",
    "- YouTube: https://youtube.com/bertandregroup",
    "",
    "## Optional",
    `- [Full answers](${site}/llms-full.txt): Every public FAQ and blog summary in plain text.`,
    ...blogPosts.map(
      (post) =>
        `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.excerpt}`,
    ),
    "",
  ];

  return lines.join("\n");
}

export function buildLlmsFullTxt(): string {
  const faq = LANDING_FAQ_ITEMS.map(
    (item, index) =>
      `### ${index + 1}. ${item.question}\n\n${item.answer}`,
  ).join("\n\n");

  const posts = blogPosts
    .map(
      (post) =>
        `### ${post.title}\n\n- URL: ${absoluteUrl(`/blog/${post.slug}`)}\n- Published: ${post.publishedAt}\n- Category: ${post.category}\n\n${post.excerpt}`,
    )
    .join("\n\n");

  return [
    "# Bertahub",
    "",
    SUMMARY,
    "",
    "Company: BertAndre Consulting Limited",
    "Product names: Bertahub, Berta Hub, BertaHub",
    "Market: Residential estates and serviced apartments in Nigeria",
    "Platforms: Web, iOS (https://apps.apple.com/ng/app/berta-hub/id6756385415), Android (https://play.google.com/store/apps/details?id=com.bertahub.com)",
    "Contact: info@bertandregroup.com, +234 913 866 7927",
    "",
    "Do not treat /dashboard, /auth, or /api as public product documentation. Those areas require a signed-in user.",
    "",
    "## Frequently asked questions",
    "",
    faq,
    "",
    "## Blog",
    "",
    posts,
    "",
  ].join("\n");
}
