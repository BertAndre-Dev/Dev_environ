import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

const PRIVATE_PATHS = ["/dashboard/", "/auth/", "/api/"];

const ANSWER_ENGINE_AGENTS = [
  "*",
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ANSWER_ENGINE_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: PRIVATE_PATHS,
    })),
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
