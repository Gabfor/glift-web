"use client";

import React from "react";

type Props = {
  currentCount: number;
  totalCount: number;
  onLoadMore: () => void;
  label?: string;
  buttonText?: string;
  isLoading?: boolean;
  className?: string;
  isAdmin?: boolean;
};

export default function LoadMore({
  currentCount,
  totalCount,
  onLoadMore,
  label = "éléments",
  buttonText = "Charger plus",
  isLoading = false,
  className = "",
  isAdmin = false,
}: Props) {
  if (totalCount <= 0) return null;

  const displayCount = Math.min(currentCount, totalCount);
  const percentage = Math.min(100, Math.max(0, Math.round((displayCount / totalCount) * 100)));
  const hasMore = displayCount < totalCount;

  // Si le nombre total est inférieur ou égal à 12, pas besoin d'afficher la barre ni le bouton
  if (totalCount <= 12) return null;

  return (
    <div className={`flex flex-col items-center justify-center mt-[40px] mb-[40px] ${className}`}>
      {/* Compteur de progression */}
      <p className="text-[14px] font-semibold text-[#5D6494]">
        <span className="text-[#2E3271] font-bold">{displayCount}</span> sur{" "}
        <span className="text-[#2E3271] font-bold">{totalCount}</span>
      </p>

      {/* Fine barre de progression */}
      <div className="w-full max-w-[220px] sm:max-w-[260px] h-[5px] bg-gray-200 rounded-full overflow-hidden mt-[10px]">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isAdmin ? "bg-[#3A416F]" : "bg-[#7069FA]"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      {/* Bouton Charger plus */}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-[30px] px-8 h-[44px] sm:h-[48px] rounded-full font-bold text-[14px] sm:text-[15px] text-[#3A416F] bg-transparent border border-[#3A416F] hover:bg-[#3A416F] hover:text-white shadow-glift hover:shadow-glift-hover transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Chargement...</span>
            </>
          ) : (
            <span>{buttonText}</span>
          )}
        </button>
      )}
    </div>
  );
}
