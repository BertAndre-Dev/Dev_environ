import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/landing-page/navbar";
import Footer from "@/components/landing-page/footer";
import { BlogListingJsonLd } from "@/components/blog/blog-json-ld";
import { blogPosts } from "@/lib/blog/posts";
import { createBlogIndexMetadata } from "@/lib/blog/seo";

export const metadata = createBlogIndexMetadata();

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <BlogListingJsonLd posts={blogPosts} />
      <Navbar />

      <header className="relative bg-[#050816] text-white pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/assets/bg.svg)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
          }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 lg:gap-12 items-center">
            <div>
              <p className="text-[#FA8128] text-sm font-medium uppercase tracking-wide mb-4">
                Bertahub Blog
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold leading-tight max-w-2xl mb-4">
                Ideas for smarter estate management
              </h1>
              <p className="text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">
                Practical perspectives on digital transformation, resident
                experience, and the future of Nigerian residential communities.
              </p>
            </div>

            <div className="relative aspect-[16/10] w-full max-w-xl lg:max-w-none mx-auto lg:mx-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white">
              <Image
                src="/assets/blog/blogHero.png"
                alt="Bertahub digital operating system for Nigerian estates"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 560px"
                className="object-contain p-3 sm:p-4"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px] py-12 lg:py-16">
        <div className="grid gap-8 max-w-3xl">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden hover:border-[#1560BD]/30 hover:shadow-lg transition-all"
            >
              {post.featuredImage && (
                <Link
                  href={`/blog/${post.slug}`}
                  className="block relative aspect-[16/9] w-full overflow-hidden"
                >
                  <Image
                    src={post.featuredImage}
                    alt={post.featuredImageAlt ?? post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-contain bg-white p-4 transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                </Link>
              )}

              <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="rounded-full bg-[#EEF4FC] text-[#1560BD] text-xs font-medium px-3 py-1">
                  {post.category}
                </span>
                <span className="text-sm text-[#6B7280]">
                  {formatDate(post.publishedAt)} · {post.readTimeMinutes} min read
                </span>
              </div>

              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] group-hover:text-[#1560BD] transition-colors mb-3">
                  {post.title}
                </h2>
              </Link>

              <p className="text-[#FA8128] font-medium italic mb-4 text-base sm:text-lg">
                {post.hook}
              </p>

              <p className="text-[#4B5563] leading-relaxed mb-6">
                {post.excerpt}
              </p>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-[#1560BD] font-medium hover:gap-3 transition-all"
              >
                Read article
                <span aria-hidden>→</span>
              </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
