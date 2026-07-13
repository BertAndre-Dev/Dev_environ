import { notFound } from "next/navigation";
import BlogArticleLayout from "@/components/blog/blog-article-layout";
import { BlogArticleJsonLd } from "@/components/blog/blog-json-ld";
import DevelopersBuildEstatesArticle from "@/components/blog/articles/developers-build-estates-article";
import DigitalOperatingSystemArticle from "@/components/blog/articles/digital-operating-system-article";
import PrepareForNextDecadeArticle from "@/components/blog/articles/prepare-for-next-decade-article";
import ResidentExperiencePriorityArticle from "@/components/blog/articles/resident-experience-priority-article";
import SustainableEstatesArticle from "@/components/blog/articles/sustainable-estates-article";
import { getBlogPost, getAllBlogSlugs } from "@/lib/blog/posts";
import { createBlogPostMetadata } from "@/lib/blog/seo";

const articleComponents: Record<string, React.ComponentType> = {
  "how-estate-managers-can-prepare-for-the-next-decade":
    PrepareForNextDecadeArticle,
  "5-practical-ways-estate-managers-can-make-communities-more-sustainable":
    SustainableEstatesArticle,
  "why-resident-experience-should-be-every-estate-managers-priority":
    ResidentExperiencePriorityArticle,
  "developers-build-estates-communities-built-afterward":
    DevelopersBuildEstatesArticle,
  "why-nigerian-estates-need-digital-operating-system":
    DigitalOperatingSystemArticle,
};

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Blog | Bertahub" };
  }

  return createBlogPostMetadata(post);
}

export default async function BlogPostPage({
  params,
}: Readonly<BlogPostPageProps>) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const Article = articleComponents[slug];

  if (!post || !Article) {
    notFound();
  }

  return (
    <>
      <BlogArticleJsonLd post={post} />
      <BlogArticleLayout post={post}>
        <Article />
      </BlogArticleLayout>
    </>
  );
}
