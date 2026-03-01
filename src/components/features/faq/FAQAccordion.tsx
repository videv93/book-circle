"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  defaultOpenIndex?: number;
}

export function FAQAccordion({ items, defaultOpenIndex = 0 }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <details
            key={index}
            open={isOpen}
            className={cn(
              "group overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-200 dark:border-stone-800 dark:bg-stone-900",
              isOpen && "ring-1 ring-primary/30"
            )}
          >
            <summary
              className="flex cursor-pointer list-none items-center justify-between p-5"
              onClick={(e) => {
                e.preventDefault();
                toggleItem(index);
              }}
            >
              <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-5 text-stone-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </summary>
            <div className="border-t border-stone-100 px-5 pb-5 pt-4 leading-relaxed text-stone-600 dark:border-stone-800 dark:text-stone-400">
              {item.answer}
            </div>
          </details>
        );
      })}
    </div>
  );
}
