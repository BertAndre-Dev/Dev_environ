type BlogProseProps = {
  readonly children: React.ReactNode;
};

export function BlogProse({ children }: BlogProseProps) {
  return (
    <article className="prose-blog text-[#374151] text-base sm:text-lg leading-relaxed space-y-6">
      {children}
    </article>
  );
}

export function BlogSectionHeading({
  id,
  children,
}: {
  readonly id?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 text-2xl sm:text-[28px] font-semibold text-[#111827] pt-8 pb-2"
    >
      {children}
    </h2>
  );
}

export function BlogSubHeading({ children }: { readonly children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-semibold text-[#111827] pt-4">{children}</h3>
  );
}

export function BlogPullQuote({ children }: { readonly children: React.ReactNode }) {
  return (
    <blockquote className="relative my-10 pl-6 border-l-4 border-[#1560BD]">
      <p className="text-xl sm:text-2xl font-medium text-[#111827] leading-snug italic">
        {children}
      </p>
    </blockquote>
  );
}

export function BlogHighlight({
  title,
  children,
}: {
  readonly title?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="my-8 rounded-2xl bg-[#EEF4FC] border border-[#D0DFF2] p-6 sm:p-8">
      {title && (
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1560BD] mb-3">
          {title}
        </p>
      )}
      <div className="text-[#374151]">{children}</div>
    </div>
  );
}

export function BlogChallengeCard({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <h4 className="text-lg font-semibold text-[#111827] mb-3">{title}</h4>
      <div className="text-[#4B5563] text-base leading-relaxed">{children}</div>
    </div>
  );
}

export function BlogBenefitCard({
  number,
  title,
  children,
}: {
  readonly number: number;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 sm:gap-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1560BD] text-white text-sm font-bold">
        {number}
      </span>
      <div>
        <h4 className="text-lg font-semibold text-[#111827] mb-2">{title}</h4>
        <div className="text-[#4B5563] text-base leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
