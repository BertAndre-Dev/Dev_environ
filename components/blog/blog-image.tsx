import Image from "next/image";

type BlogImageProps = {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly priority?: boolean;
  readonly className?: string;
  readonly aspectClassName?: string;
  readonly fit?: "cover" | "contain";
};

export default function BlogImage({
  src,
  alt,
  caption,
  priority = false,
  className = "",
  aspectClassName = "aspect-[16/9]",
  fit = "cover",
}: BlogImageProps) {
  return (
    <figure className={`my-8 not-prose ${className}`}>
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] ${aspectClassName}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 768px"
          className={fit === "contain" ? "object-contain p-2 sm:p-4" : "object-cover"}
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-[#6B7280] text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
