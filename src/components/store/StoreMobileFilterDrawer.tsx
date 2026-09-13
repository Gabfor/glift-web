"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { StoreProgram } from "@/types/store";
import CheckboxCheckedIcon from "/public/icons/checkbox_checked.svg";
import CheckboxUncheckedIcon from "/public/icons/checkbox_unchecked.svg";

export type FilterSectionData = {
  title: string;
  options: string[];
};

interface StoreMobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sections: FilterSectionData[];
  selectedFilters: Record<string, Set<string>>;
  onApply: (newFilters: Record<string, Set<string>>) => void;
  allPrograms: StoreProgram[];
  isPremiumUser: boolean;
  isAuthenticated: boolean;
}

export default function StoreMobileFilterDrawer({
  isOpen,
  onClose,
  sections,
  selectedFilters,
  onApply,
  allPrograms,
  isPremiumUser,
  isAuthenticated,
}: StoreMobileFilterDrawerProps) {
  const [mounted, setMounted] = useState(false);
  // Temporary state inside the drawer
  const [tempFilters, setTempFilters] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize when drawer opens
  useEffect(() => {
    if (isOpen) {
      const copy: Record<string, Set<string>> = {};
      sections.forEach((sec) => {
        if (selectedFilters[sec.title]) {
          copy[sec.title] = new Set(selectedFilters[sec.title]);
        } else {
          // Default: empty set for additive filtering
          copy[sec.title] = new Set<string>();
        }
      });
      setTempFilters(copy);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, sections, selectedFilters]);

  // Check if any filter is active (i.e. at least one option is selected)
  const hasActiveFilters = useMemo(() => {
    return sections.some((sec) => {
      const selected = tempFilters[sec.title];
      return selected && selected.size > 0;
    });
  }, [sections, tempFilters]);

  // Toggle single option
  const toggleOption = (sectionTitle: string, option: string) => {
    setTempFilters((prev) => {
      const currentSet = new Set(prev[sectionTitle] || []);
      if (currentSet.has(option)) {
        currentSet.delete(option);
      } else {
        currentSet.add(option);
      }
      return {
        ...prev,
        [sectionTitle]: currentSet,
      };
    });
  };

  // Toggle all options for a section
  const toggleSectionAll = (section: FilterSectionData) => {
    setTempFilters((prev) => {
      const currentSet = prev[section.title] || new Set();
      const hasSelected = currentSet.size > 0;
      return {
        ...prev,
        [section.title]: hasSelected ? new Set<string>() : new Set(section.options),
      };
    });
  };

  // Live calculation of matching programs
  const matchingCount = useMemo(() => {
    if (!allPrograms || allPrograms.length === 0) return 0;

    return allPrograms.filter((program) => {
      // 1. Genre / Sexe
      const genreSet = tempFilters["Genre"] || tempFilters["Sexe"];
      if (genreSet && genreSet.size > 0) {
        const g = (program.gender || "").toLowerCase().trim();
        const isWildcard = !g || g === "tous" || g === "mixte" || g === "unisexe";
        if (!isWildcard) {
          const hasMatch = Array.from(genreSet).some(
            (s) => s.toLowerCase().trim() === g
          );
          if (!hasMatch) return false;
        }
      }

      // 2. Objectif
      if (tempFilters["Objectif"] && tempFilters["Objectif"].size > 0) {
        const selected = tempFilters["Objectif"];
        if (program.goal && !selected.has(program.goal)) {
          return false;
        }
      }

      // 3. Niveau
      if (tempFilters["Niveau"] && tempFilters["Niveau"].size > 0) {
        const selected = tempFilters["Niveau"];
        const l = (program.level || "").trim();
        const isWildcard = l.toLowerCase() === "tous niveaux";
        if (!isWildcard && l && !selected.has(l)) {
          return false;
        }
      }

      // 4. Lieu
      if (tempFilters["Lieu"] && tempFilters["Lieu"].size > 0) {
        const selected = tempFilters["Lieu"];
        const loc = (program.location || "").trim();
        if (loc && !selected.has(loc)) {
          return false;
        }
      }

      // 5. Durée max.
      if (tempFilters["Durée max."] && tempFilters["Durée max."].size > 0) {
        const selected = tempFilters["Durée max."];
        const maxMinutes = Math.max(
          ...Array.from(selected).map((s) => parseInt(s, 10) || 0)
        );
        const progDuration = parseInt(String(program.duration), 10) || 0;
        if (progDuration > 0 && maxMinutes > 0 && progDuration > maxMinutes) {
          return false;
        }
      }

      // 6. Partenaire
      if (tempFilters["Partenaire"] && tempFilters["Partenaire"].size > 0) {
        const selected = tempFilters["Partenaire"];
        const partner = (program.partner_name || "").trim();
        if (partner && !selected.has(partner)) {
          return false;
        }
      }

      // 7. Disponibilité
      if (tempFilters["Disponibilité"] && tempFilters["Disponibilité"].size > 0) {
        const selected = tempFilters["Disponibilité"];
        const isDownloadable = program.plan === "starter" || isPremiumUser;
        const matchOui = selected.has("Téléchargeable") && isDownloadable;
        const matchNon = selected.has("Non téléchargeable") && !isDownloadable;
        if (!matchOui && !matchNon) {
          return false;
        }
      }

      return true;
    }).length;
  }, [allPrograms, tempFilters, isPremiumUser]);

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-[100dvh] bg-white flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 h-[72px] border-b border-[#ECE9F1] flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <Image
            src={hasActiveFilters ? "/icons/filtres_green.svg" : "/icons/filtres_red.svg"}
            alt="Filtres"
            width={16}
            height={16}
          />
          <span className="text-[16px] font-bold text-[#3A416F]">Filtres</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#3A416F] hover:opacity-75 focus:outline-none cursor-pointer"
          aria-label="Fermer les filtres"
        >
          <svg
            className="w-5 h-5 stroke-[#3A416F]"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {sections.map((section, idx) => {
            const selectedSet = tempFilters[section.title] || new Set();
            const hasSelected = selectedSet.size > 0;

            return (
              <div key={section.title} className={idx > 0 ? "pt-5 border-t border-[#ECE9F1]" : ""}>
                {/* Section Header with Title & Action */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-bold text-[#3A416F]">
                    {section.title}
                  </h3>

                  <button
                    type="button"
                    onClick={() => toggleSectionAll(section)}
                    className="text-[13px] font-semibold text-[#7069FA] hover:text-[#5E56E8] transition"
                  >
                    {hasSelected ? "Tout effacer" : "Tout sélectionner"}
                  </button>
                </div>

                {/* Checkbox Options List */}
                <div className="space-y-3.5">
                  {section.options.map((option) => {
                    const isChecked = selectedSet.has(option);

                    return (
                      <div
                        key={option}
                        onClick={() => toggleOption(section.title, option)}
                        className="flex items-center gap-3 cursor-pointer select-none group"
                      >
                        {/* Custom Checkbox */}
                        <Image
                          src={isChecked ? CheckboxCheckedIcon : CheckboxUncheckedIcon}
                          alt={isChecked ? "Coché" : "Non coché"}
                          width={18}
                          height={18}
                          className="shrink-0"
                        />

                        {/* Label */}
                        <span className="text-[15px] font-semibold text-[#3A416F] group-hover:text-[#2E3271] transition-colors">
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-4 border-t border-[#ECE9F1] bg-white shrink-0">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-[48px] bg-[#7069FA] hover:bg-[#5E56E8] active:scale-[0.99] text-white font-bold text-[16px] rounded-[25px] flex items-center justify-center transition"
          >
            {matchingCount === 0
              ? "Aucun résultat"
              : `Voir ${matchingCount} résultat${matchingCount > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>,
    document.body
  );
}
