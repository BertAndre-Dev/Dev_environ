"use client";

import Button from "@/components/landing-page/atom/button";
import { useBookDemo } from "@/components/landing-page/book-demo-provider";
import { cn } from "@/lib/utils";

type BookDemoButtonProps = Readonly<{
  label?: string;
  className?: string;
  bg?: string;
  text?: string;
  rounded?: string;
  padding?: string;
  hover?: string;
}>;

export function BookDemoButton({
  label = "Book a Demo",
  className,
  bg = "bg-[#1560BD]",
  text = "text-white",
  rounded = "rounded-full",
  padding = "px-8 py-3",
  hover = "hover:bg-[#124ea0]",
}: BookDemoButtonProps) {
  const { openBookDemo } = useBookDemo();

  return (
    <Button
      type="button"
      onClick={openBookDemo}
      bg={bg}
      text={text}
      rounded={rounded}
      padding={padding}
      className={cn(hover, "transition-colors cursor-pointer", className)}
    >
      {label}
    </Button>
  );
}
