"use client";

import { useRef, useEffect, useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleClear = () => {
    onChange("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="relative w-[368px] mx-auto">
      {/* Icône search.svg à gauche */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <img src="/icons/search.svg" alt="Rechercher" className="w-[18px] h-[18px]" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Rechercher..."}
        className="w-full pl-10 pr-10 py-2 rounded-[5px] bg-white text-[16px] font-semibold text-[#3A416F] placeholder-[#D7D4DC]
                   border border-[#D7D4DC] hover:border-[#C2BFC6]
                   focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                   transition-all duration-150"
      />

      {/* Icône reset à droite */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center p-1"
        >
          <Tooltip content="Effacer">
            <div className="relative w-[25px] h-[25px] flex items-center justify-center">
              <img
                src="/icons/cross_reset.svg"
                alt="Effacer"
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"}`}
              />
              <img
                src="/icons/cross_reset_hover.svg"
                alt="Effacer"
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </Tooltip>
        </button>
      )}
    </div>
  );
}
