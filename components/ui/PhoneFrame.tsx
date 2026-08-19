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
        "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[2.5rem] border border-black bg-black shadow-2xl lg:max-w-[310px]",
        "aspect-[9/17.5]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-px overflow-hidden rounded-[calc(2.5rem-1px)] bg-black">
        {children}
      </div>
    </div>
  );
}
