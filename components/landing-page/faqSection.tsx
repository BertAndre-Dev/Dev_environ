"use client";

import React, { useState } from "react";
import { BookDemoButton } from "@/components/landing-page/book-demo-button";
import { LANDING_FAQ_ITEMS } from "@/lib/landing/content";

const FAQ_ITEMS = LANDING_FAQ_ITEMS;

type FaqItemProps = Readonly<{
  item: { readonly question: string; readonly answer: string };
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
}>;

function FaqItem({ item, index, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="rounded-xl bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)] overflow-hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        className={`flex w-full items-start justify-between gap-4 text-left px-5 sm:px-6 cursor-pointer ${
          isOpen ? "pt-5 sm:pt-6 pb-3" : "py-5 sm:py-6"
        }`}
        onClick={() => onToggle(index)}
      >
        <span className="text-base md:text-[17px] font-bold text-black leading-snug">
          {item.question}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-xl sm:text-2xl font-light leading-none text-black pt-0.5"
        >
          {isOpen ? "–" : "+"}
        </span>
      </button>

      <div
        className={`px-5 sm:px-6 overflow-hidden transition-all duration-300 ease-out ${
          isOpen
            ? "max-h-96 opacity-100 pb-5 sm:pb-6"
            : "max-h-0 opacity-0 pb-0"
        }`}
      >
        <p className="text-sm sm:text-base font-normal text-[#4C4C4C] leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const handleToggle = (idx: number) => {
    setOpenIndex((current) => (current === idx ? -1 : idx));
  };

  return (
    <section
      id="faq"
      className="scroll-mt-28 mx-4 my-16 lg:my-24 rounded-3xl bg-[#F8F8F8] py-10 sm:py-12 lg:py-16"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-16 max-w-[1320px] xl:max-w-[1440px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 items-start">
          {/* Left: heading + CTA */}
          <div className="flex flex-col items-start gap-5 sm:gap-6 lg:sticky lg:top-32">
            <h2 className="text-[36px] font-bold leading-tight text-black max-w-[18ch]">
              Everything you need to know before you start.
            </h2>
            <p className="text-base sm:text-lg font-normal text-[#4C4C4C] leading-relaxed max-w-md">
              Manage your property and energy operations, payments, and
              residents all in one powerful platform.
            </p>
            <BookDemoButton
              label="Get Started"
              bg="bg-[#0150AC]"
              hover="hover:bg-[#124ea0]"
              padding="px-8 py-3"
              className="mt-1 sm:mt-2"
            />
          </div>

          {/* Right: single-column accordion */}
          <div className="flex flex-col gap-4">
            {FAQ_ITEMS.map((item, index) => (
              <FaqItem
                key={item.question}
                item={item}
                index={index}
                isOpen={openIndex === index}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
