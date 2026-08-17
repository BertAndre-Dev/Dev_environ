import type { ReactNode } from "react";

type PhoneFrameProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/**
 * Reusable smartphone chrome for marketing mockups.
 * Aspect ~9:19.5; content fills the inner screen.
 */
export default function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={[
        "relative mx-auto w-full max-w-[320px] overflow-hidden rounded-[2.75rem] border border-black bg-black shadow-2xl lg:max-w-[360px]",
        "aspect-[9/19.5]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-px overflow-hidden rounded-[calc(2.75rem-1px)] bg-black">
        {children}
      </div>
    </div>
  );
}
