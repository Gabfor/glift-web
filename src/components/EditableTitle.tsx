"use client";

import { useRef, useEffect, useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
  loading: boolean;
  editing: boolean;
  setEditing: (val: boolean) => void;
  programName: string;
  setProgramName: (val: string) => void;
  handleBlur: () => void;
  setIsEditing: (val: boolean) => void;
};

function EditableTitle({
  loading,
  editing,
  setEditing,
  programName,
  setProgramName,
  handleBlur,
  setIsEditing,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!loading && editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, editing]);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setProgramName(""); // vide le champ
    setTimeout(() => {
      inputRef.current?.focus(); // focus reste actif
    }, 0);
  };

  // Nouvelle fonction pour tronquer
  const getDisplayName = (name: string) => {
    if (!name) return "Nom de l’entraînement";
    if (name.length > 27) {
      return name.slice(0, 27) + "...";
    }
    return name;
  };

  return (
    <div className="text-center mb-[40px]">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-[40px] w-1/3 mx-auto bg-gray-300 rounded-md" />
        </div>
      ) : editing ? (
        <div className="relative w-full max-w-[280px] mx-auto">
          <input
            type="text"
            ref={inputRef}
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={() => {
              setIsEditing(false);
              handleBlur();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") inputRef.current?.blur();
            }}
            className="text-[16px] sm:text-[18px] text-[#3A416F] placeholder-[#D7D4DC] font-semibold border border-[#D7D4DC] rounded-[5px] px-4 py-2 pr-10 text-left w-full focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD] transition"
            placeholder="Nom de l'entraînement"
          />
          {programName && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="absolute right-2 top-0 bottom-0 flex items-center p-1"
              aria-label="Effacer le nom"
            >
              <Tooltip content="Effacer">
                <div className="relative w-[25px] h-[25px] flex items-center justify-center">
                  <img
                    src="/icons/cross_reset.svg"
                    alt="Effacer"
                    className="absolute [3px] left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <img
                    src="/icons/cross_reset_hover.svg"
                    alt="Effacer"
                    className="absolute [3px] left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </Tooltip>
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="group flex justify-center items-center gap-2 cursor-pointer w-fit mx-auto hover:text-[#3A416F] transition"
        >
          <p className="text-[30px] sm:text-[30px] font-bold text-[#2E3271] group-hover:text-[#3A416F]">
            {getDisplayName(programName)}
          </p>

          <Tooltip content="Editer">
            <div className="relative w-5 h-5">
              <img
                src="/icons/edit.svg"
                alt="modifier"
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 group-hover:opacity-0"
              />
              <img
                src="/icons/edit_hover.svg"
                alt="modifier"
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100"
              />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default EditableTitle;
