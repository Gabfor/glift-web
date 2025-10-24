"use client";

import React, { useState } from "react";
import Image from "next/image";

import {
  NextDisabledIcon,
  PreviousDisabledIcon,
} from "../icons/PaginationIcons";

type Props = {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  className?: string;
};

const DEFAULT_ITEMS_PER_PAGE = 8;

export default function Pagination({
  currentPage,
  totalItems,
  onPageChange,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  className,
}: Props) {
  const validTotal = Math.max(0, totalItems || 0);
  const validItemsPerPage = Math.max(1, itemsPerPage || DEFAULT_ITEMS_PER_PAGE);
  const totalPages = Math.ceil(validTotal / validItemsPerPage);

  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);

  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return null;
  }

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

  const containerClassName = [
    "flex items-center justify-center gap-2",
    className ?? "mt-[50px]",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      {/* Previous Button */}
      <button
        onClick={() => !prevDisabled && onPageChange(currentPage - 1)}
        disabled={prevDisabled}
        onMouseEnter={() => setPrevHover(true)}
        onMouseLeave={() => setPrevHover(false)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent p-0 m-0"
        aria-label="Page précédente"
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
            alt="Page précédente"
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
            className={`text-[14px] px-2 transition ${
              page === currentPage
                ? "text-[#3A416F] font-semibold"
                : "text-[#5D6494] font-semibold"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-[#5D6494]">
            ...
          </span>
        ),
      )}

      {/* Next Button */}
      <button
        onClick={() => !nextDisabled && onPageChange(currentPage + 1)}
        disabled={nextDisabled}
        onMouseEnter={() => setNextHover(true)}
        onMouseLeave={() => setNextHover(false)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent p-0 m-0"
        aria-label="Page suivante"
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
            alt="Page suivante"
            width={32}
            height={32}
          />
        )}
      </button>
    </div>
  );
}
