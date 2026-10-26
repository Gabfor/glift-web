"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ProgramMenuProps = {
  isFirst: boolean;
  isLastActive: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  hasTrainings: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
};

export default function ProgramMenu({
  isFirst,
  isLastActive,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onToggleVisibility,
  onDelete,
  hasTrainings,
  onOpenChange,
  className,
}: ProgramMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setMenuOpenState] = useState(false);
  const baseMenuItemClass =
    "w-[155px] text-left h-[40px] rounded-[5px] text-[16px] px-2 mx-[10px] py-2 font-semibold transition-colors";

  const setMenuOpen = useCallback(
    (value: boolean) => {
      setMenuOpenState(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setMenuOpen]);

  const handleToggleMenu = () => {
    setMenuOpen(!open);
  };

  const handleSelect = (callback: () => void) => {
    callback();
    setMenuOpen(false);
  };

  const isMonterDisabled = isFirst || !hasTrainings;
  const isDescendreDisabled = isLastActive || !hasTrainings;
  const isDupliquerDisabled = !hasTrainings;
  const isVisibiliteDisabled = !hasTrainings;
  const isSupprimerDisabled = !hasTrainings;

  const allDisabled =
    isMonterDisabled &&
    isDescendreDisabled &&
    isDupliquerDisabled &&
    isVisibiliteDisabled &&
    isSupprimerDisabled;

  if (allDisabled) {
    return null;
  }

  return (
    <div className={cn("flex md:hidden items-center absolute right-0 z-20 p-2 bg-[#FBFCFE]", className)}>
      <div className="relative" ref={menuRef}>
        <button
        className="w-[25px] h-[25px] flex items-center justify-center focus:outline-none"
        type="button"
        onClick={handleToggleMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Options du programme"
      >
        <div className="w-[25px] h-[25px] flex items-center justify-center relative transition-opacity duration-200 hover:opacity-80">
          <Image
            src="/icons/setting_program.svg"
            alt="Options du programme"
            fill
            sizes="100%"
          />
        </div>
      </button>

      {open && (
        <div className="absolute right-[-8px] top-full mt-3 z-50">
          <div
            className={cn(
              "relative w-[175px] rounded-[5px] border border-[#ECE9F1] bg-white py-2",
              "shadow-glift-hover"
            )}
          >
            <div className="absolute -top-2 right-[12.5px] w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleSelect(onMoveUp)}
                disabled={isFirst || !hasTrainings}
                className={cn(
                  baseMenuItemClass,
                  isFirst || !hasTrainings
                    ? "text-[#D7D4DC] cursor-not-allowed"
                    : "text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]"
                )}
              >
                Monter
              </button>

              <button
                type="button"
                onClick={() => handleSelect(onMoveDown)}
                disabled={isLastActive || !hasTrainings}
                className={cn(
                  baseMenuItemClass,
                  isLastActive || !hasTrainings
                    ? "text-[#D7D4DC] cursor-not-allowed"
                    : "text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]"
                )}
              >
                Descendre
              </button>

              <button
                type="button"
                onClick={() => handleSelect(onDuplicate)}
                disabled={!hasTrainings}
                className={cn(
                  baseMenuItemClass,
                  !hasTrainings
                    ? "text-[#D7D4DC] cursor-not-allowed"
                    : "text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]"
                )}
              >
                Dupliquer
              </button>

              <button
                type="button"
                onClick={() => handleSelect(onToggleVisibility)}
                disabled={!hasTrainings}
                className={cn(
                  baseMenuItemClass,
                  !hasTrainings
                    ? "text-[#D7D4DC] cursor-not-allowed"
                    : "text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]"
                )}
              >
                Régler la visibilité
              </button>

              <button
                type="button"
                onClick={() => handleSelect(onDelete)}
                disabled={!hasTrainings}
                className={cn(
                  baseMenuItemClass,
                  !hasTrainings
                    ? "text-[#D7D4DC] cursor-not-allowed"
                    : "text-[#EF4F4E] hover:text-[#BA2524] hover:bg-[#FFF1F1]"
                )}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
