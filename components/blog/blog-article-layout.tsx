import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog/posts";
import Navbar from "@/components/landing-page/navbar";
import Footer from "@/components/landing-page/footer";
import Button from "@/components/landing-page/atom/button";
import BlogImage from "@/components/blog/blog-image";

type BlogArticleLayoutProps = {
  readonly post: BlogPostMeta;
  readonly children: React.ReactNode;
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogArticleLayout({
  post,
  children,
}: BlogArticleLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <header className="relative bg-[#050816] text-white pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
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
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-8"
          >
            <span aria-hidden>←</span>
            Back to Blog
          </Link>

          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-[#FA8128]/20 border border-[#FA8128]/40 text-[#FA8128] text-xs font-medium px-4 py-1.5 mb-6">
              {post.category}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-tight font-semibold mb-6">
              {post.title}
            </h1>

            <p className="text-lg sm:text-xl text-[#FA8128] font-medium leading-relaxed mb-8 italic">
              {post.hook}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span>{post.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span aria-hidden>·</span>
              <span>{post.readTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </header>

      {post.featuredImage && (
        <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px] -mt-8 lg:-mt-12 relative z-20">
          <div className="max-w-3xl mx-auto">
            <BlogImage
              src={post.featuredImage}
              alt={post.featuredImageAlt ?? post.title}
              priority
              fit="contain"
              aspectClassName="aspect-[16/9] sm:aspect-[2/1]"
              className="my-0 shadow-xl"
            />
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>

      <section className="bg-[#F5F7FB] py-16 lg:py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#111827] mb-4">
              Ready to modernize your estate?
            </h2>
            <p className="text-[#4B5563] text-base sm:text-lg mb-8 leading-relaxed">
              See how Bertahub helps estate managers streamline operations,
              improve transparency, and deliver the resident experience your
              community deserves.
            </p>
            <Link href="/book-demo">
              <Button
                bg="bg-[#1560BD]"
                text="text-white"
                rounded="rounded-full"
                padding="px-8 py-3"
                className="hover:bg-[#124ea0] transition-colors"
              >
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
