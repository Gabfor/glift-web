"use client";

import { useState } from "react";

export default function BlogIntroBlock({ html }: { html: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!html) return null;

  return (
    <div className="w-full max-w-[1152px] mx-auto bg-[#F7F7FF] rounded-[10px] p-[18px] sm:p-[25px] text-[#5D6494] text-[14px] font-semibold text-left [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F] [&_p]:mt-0 [&_p]:mb-3 last:[&_p]:mb-0">
      <div
        className={`${!isExpanded ? "line-clamp-3 sm:line-clamp-none" : ""} leading-relaxed`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="sm:hidden mt-2 pt-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#3A416F] hover:text-[#2E3271] font-bold text-[13px] inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? "Réduire" : "Lire la suite"}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
