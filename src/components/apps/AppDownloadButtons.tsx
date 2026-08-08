"use client";

import React from "react";
import Link from "next/link";

interface AppDownloadButtonsProps {
  androidUrl?: string;
  iosUrl?: string;
  className?: string;
}

export default function AppDownloadButtons({
  androidUrl = "#",
  iosUrl = "#",
  className = "",
}: AppDownloadButtonsProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-[500px] mx-auto px-4 sm:px-0 ${className}`}>
      {/* 1. Bouton Android (Pleine largeur sur mobile, auto sur desktop) */}
      <Link
        href={androidUrl}
        target={androidUrl.startsWith("http") ? "_blank" : undefined}
        rel={androidUrl.startsWith("http") ? "noopener noreferrer" : undefined}
        className="inline-flex items-center justify-center gap-3 h-[44px] w-full sm:w-auto px-[28px] sm:px-[30px] rounded-full border border-black bg-white text-black font-semibold text-[15px] sm:text-[16px] whitespace-nowrap select-none cursor-pointer"
        aria-label="Télécharger sur Android"
      >
        {/* Google Play / Android Icon (hauteur 20px) */}
        <svg
          viewBox="0 0 512 512"
          className="h-[20px] w-auto shrink-0"
          aria-hidden="true"
        >
          <path fill="#EA4335" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
          <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" />
          <path fill="#FBBC04" d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
          <path fill="#34A853" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
        </svg>
        <span>Télécharger sur Android</span>
      </Link>

      {/* 2. Bouton iOS / Apple (Pleine largeur sur mobile, auto sur desktop) */}
      <Link
        href={iosUrl}
        target={iosUrl.startsWith("http") ? "_blank" : undefined}
        rel={iosUrl.startsWith("http") ? "noopener noreferrer" : undefined}
        className="inline-flex items-center justify-center gap-3 h-[44px] w-full sm:w-auto px-[28px] sm:px-[30px] rounded-full bg-black text-white font-semibold text-[15px] sm:text-[16px] whitespace-nowrap select-none cursor-pointer"
        aria-label="Télécharger sur IOS"
      >
        {/* Apple Icon (hauteur 20px) */}
        <svg
          viewBox="0 0 384 512"
          fill="#FFFFFF"
          className="h-[20px] w-auto shrink-0 -mt-0.5"
          aria-hidden="true"
        >
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        <span>Télécharger sur IOS</span>
      </Link>
    </div>
  );
}
