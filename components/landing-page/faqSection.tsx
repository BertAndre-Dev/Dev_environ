"use client";

import React, { useState } from "react";
import { LANDING_FAQ_ITEMS } from "@/lib/landing/content";

const FAQ_ITEMS = LANDING_FAQ_ITEMS;

function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  readonly item: { readonly question: string; readonly answer: string };
  readonly index: number;
  readonly isOpen: boolean;
  readonly onToggle: (index: number) => void;
}) {
  return (
    <div className="rounded-[15px] bg-[white] shadow-[0_12px_30px_rgba(16,24,40,0.08)] overflow-hidden">
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-4 text-left px-5 sm:px-6 cursor-pointer ${
          isOpen ? "pt-5 sm:pt-6 pb-3" : "py-4 sm:py-5"
        }`}
        onClick={() => onToggle(index)}
      >
        <span
          className={`text-base md:text-[18px] font-bold text-black ${
            isOpen ? "max-w-136" : ""
          }`}
        >
          {item.question}
        </span>
        <span className="text-xl sm:text-2xl font-medium text-black">
          {isOpen ? "–" : "+"}
        </span>
      </button>

      <div
        className={`px-5 sm:px-6 cursor-pointer ${
          isOpen ? "pb-5 sm:pb-6" : "pb-0"
        } overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-base md:text-[18px] font-normal text-[#4C4C4C] leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const columns = [
    { id: "left", offset: 0, items: FAQ_ITEMS.slice(0, 4) },
    { id: "right", offset: 4, items: FAQ_ITEMS.slice(4) },
  ] as const;

  const handleToggle = (idx: number) => {
    setOpenIndex((current) => (current === idx ? -1 : idx));
  };

  return (
    <section
      id="faq"
      className="scroll-mt-28 bg-[#A1A1A11A] py-8 lg:py-16 my-16 lg:my-24"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px]">
        <h2 className="text-center text-[32px] md:text-3xl lg:text-[34px] font-bold text-[#101828]">
          Got Questions. We&apos;ve Got Answers.
        </h2>

        <div className="mt-8 sm:mt-10">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 pr-1">
            {columns.map((col) => (
              <div key={col.id} className="space-y-4">
                {col.items.map((item, localIdx) => {
                  const index = localIdx + col.offset;
                  const isOpen = openIndex === index;

                  return (
                    <FaqItem
                      key={item.question}
                      item={item}
                      index={index}
                      isOpen={isOpen}
                      onToggle={handleToggle}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
