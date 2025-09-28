"use client";

import React, { useState } from "react";
import Image from "next/image";

import {
  NextDisabledIcon,
  PreviousDisabledIcon,
} from "../icons/PaginationIcons";

type Props = {
  currentPage: number;
  totalPrograms: number;
  onPageChange: (page: number) => void;
};

export default function ShopPagination({ currentPage, totalPrograms, onPageChange }: Props) {
  const ITEMS_PER_PAGE = 8;
  const validTotal = Math.max(0, totalPrograms || 0);
  const totalPages = Math.ceil(validTotal / ITEMS_PER_PAGE);

  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);

  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, 2, 3);
      pages.push("...");
      pages.push(totalPages - 2, totalPages - 1, totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;

  return (
    <div className="flex items-center justify-center mt-[50px] gap-2">
      {/* Previous Button */}
      <button
        onClick={() => !prevDisabled && onPageChange(currentPage - 1)}
        disabled={prevDisabled}
        onMouseEnter={() => setPrevHover(true)}
        onMouseLeave={() => setPrevHover(false)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent p-0 m-0"
      >
        {prevDisabled ? (
          <PreviousDisabledIcon className="h-8 w-8" />
        ) : (
          <Image
            src={
              prevHover
                ? "/icons/previous_active_hover.svg"
                : "/icons/previous_active.svg"
            }
            alt="Previous"
            width={32}
            height={32}
          />
        )}
      </button>

      {/* Page Numbers */}
      {visiblePages.map((page, idx) =>
        typeof page === "number" ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            className={`text-[14px] px-2 transition
              ${
                page === currentPage
                  ? "text-[#3A416F] font-bold"
                  : "text-[#5D6494] font-semibold"
              }`}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-[#5D6494]">...</span>
        )
      )}

      {/* Next Button */}
      <button
        onClick={() => !nextDisabled && onPageChange(currentPage + 1)}
        disabled={nextDisabled}
        onMouseEnter={() => setNextHover(true)}
        onMouseLeave={() => setNextHover(false)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent p-0 m-0"
      >
        {nextDisabled ? (
          <NextDisabledIcon className="h-8 w-8" />
        ) : (
          <Image
            src={
              nextHover
                ? "/icons/next_active_hover.svg"
                : "/icons/next_active.svg"
            }
            alt="Next"
            width={32}
            height={32}
          />
        )}
      </button>
    </div>
  );
}
