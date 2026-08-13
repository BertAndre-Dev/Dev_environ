import Image from "next/image";

type Testimonial = Readonly<{
  name: string;
  role: string;
  quote: string;
}>;

const TESTIMONIALS: readonly Testimonial[] = [
  {
    name: "John Doe",
    role: "Resident",
    quote:
      "Our mission is to design, deploy, and manage modern energy infrastructure that combines conventional energy.",
  },
  {
    name: "John Doe",
    role: "Resident",
    quote:
      "Our mission is to design, deploy, and manage modern energy infrastructure that combines conventional energy.",
  },
  {
    name: "John Doe",
    role: "Resident",
    quote:
      "Our mission is to design, deploy, and manage modern energy infrastructure that combines conventional energy.",
  },
];

function StarRow() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="#F5C518"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.52L10 14.27l-4.94 2.46.94-5.52-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ name, role, quote }: Testimonial) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl bg-[#F5F5F5] p-6 sm:p-7 transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-[#E8F1FB]">
          <Image
            src="/assets/hero/users.svg"
            alt=""
            width={192}
            height={40}
            className="absolute left-0 top-0 h-12 w-auto max-w-none"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-black">{name}</p>
          <p className="text-sm text-[#6B7280]">{role}</p>
        </div>
      </div>

      <StarRow />

      <p className="text-base leading-relaxed text-[#374151]">
        <span className="mr-1 text-2xl font-bold leading-none text-black" aria-hidden="true">
          “
        </span>
        {quote}
      </p>
    </article>
  );
}

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-28 bg-white py-12 sm:py-16 lg:py-20"
    >
      <div className="container mx-auto max-w-[1320px] px-6 md:px-8 lg:px-10 xl:max-w-[1440px] xl:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[32px] font-medium leading-tight tracking-[-0.02em] text-black sm:text-[36px]">
            Real People. Real Results.
          </h2>
          <p className="mt-3 text-base text-[#6B7280] sm:text-lg">
            Hundreds trust Berta Hub for their daily smart living
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {TESTIMONIALS.map((item, index) => (
            <TestimonialCard key={`${item.name}-${index}`} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
