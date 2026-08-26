import Image from "next/image";
import Link from "next/link";
import { blogPosts, type BlogPostMeta } from "@/lib/blog/posts";

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function FeaturedPost({ post }: { readonly post: BlogPostMeta }) {
  return (
    <article className="flex flex-col gap-4">
      {post.featuredImage && (
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-16/10 w-full overflow-hidden rounded-2xl"
        >
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt ?? post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center"
            priority={false}
          />
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-xl sm:text-2xl font-bold text-black leading-snug hover:text-[#0150AC] transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="text-sm sm:text-base text-[#4C4C4C] leading-relaxed">
          {post.excerpt}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex text-base font-bold text-black hover:text-[#0150AC] transition-colors w-fit"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}

function RecentPostItem({
  post,
  showDivider,
}: {
  readonly post: BlogPostMeta;
  readonly showDivider: boolean;
}) {
  return (
    <div>
      {showDivider && <div className="border-t border-[#E5E7EB] mb-5 sm:mb-6" />}
      <Link
        href={`/blog/${post.slug}`}
        className="group flex gap-4 sm:gap-5 items-start"
      >
        {post.featuredImage && (
          <div className="relative shrink-0 size-20 sm:size-24 overflow-hidden rounded-xl">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt ?? post.title}
              fill
              sizes="96px"
              className="object-cover object-center"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5 min-w-0 pt-0.5">
          <time
            dateTime={post.publishedAt}
            className="text-xs sm:text-sm text-[#9CA3AF]"
          >
            {formatDate(post.publishedAt)}
          </time>
          <h3 className="text-base sm:text-lg font-bold text-black leading-snug group-hover:text-[#0150AC] transition-colors">
            {post.title}
          </h3>
        </div>
      </Link>
    </div>
  );
}

export default function BlogSection() {
  const [featured, ...rest] = blogPosts;
  const recentPosts = rest.slice(0, 3);

  if (!featured) {
    return null;
  }

  return (
    <section
      id="blog"
      className="scroll-mt-28 mx-4 my-16 lg:my-24 py-10 sm:py-12 lg:py-16"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-16 max-w-[1320px] xl:max-w-[1440px]">
        <div className="mb-8 sm:mb-10 lg:mb-12 max-w-2xl">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[36px] lg:text-[40px]">
            Blog
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg font-normal text-[#4C4C4C] leading-relaxed">
            Manage your property and energy operations, payments, and residents
            all in one powerful platform.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 xl:gap-16 items-start">
          <FeaturedPost post={featured} />

          <div className="flex flex-col gap-5 sm:gap-6">
            {recentPosts.map((post, index) => (
              <RecentPostItem
                key={post.slug}
                post={post}
                showDivider={index > 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
