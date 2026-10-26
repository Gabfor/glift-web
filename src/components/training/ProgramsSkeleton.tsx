"use client";

import { useEffect, useState } from "react";

export type ProgramSkeletonMeta = {
  trainingCount: number;
};

const DEFAULT_STRUCTURE: ProgramSkeletonMeta[] = [
  { trainingCount: 3 },
  { trainingCount: 2 },
];

interface ProgramsSkeletonProps {
  structure?: ProgramSkeletonMeta[];
}

export default function ProgramsSkeleton({
  structure: propStructure,
}: ProgramsSkeletonProps) {
  const [structure, setStructure] = useState<ProgramSkeletonMeta[]>(
    propStructure || DEFAULT_STRUCTURE
  );

  useEffect(() => {
    if (propStructure && propStructure.length > 0) {
      setStructure(propStructure);
      return;
    }
    try {
      const cached = localStorage.getItem("programs_skeleton_structure");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStructure(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [propStructure]);

  return (
    <div className="w-full max-w-[1152px] animate-pulse">
      {structure.map((item, programIndex) => (
        <div key={programIndex} className="relative w-full max-w-[1152px] mb-[20px]">
          {/* Header du programme - identique à ProgramEditor */}
          <div className="relative flex items-center justify-between h-[50px] mb-2 bg-[#FBFCFE]">
            {/* Icônes de gauche (descendre, monter, dupliquer - Desktop uniquement) */}
            <div className="hidden md:flex items-center absolute left-0 z-10 p-2 bg-[#FBFCFE]">
              <div className="w-[25px] h-[25px] flex items-center justify-center">
                <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E6E8F5]" />
              </div>
              <div className="w-[25px] h-[25px] flex items-center justify-center">
                <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E6E8F5]" />
              </div>
              <div className="w-[25px] h-[25px] flex items-center justify-center">
                <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E6E8F5]" />
              </div>
            </div>

            {/* Titre centré avec fond #FBFCFE au-dessus de la ligne */}
            <div className="flex-1 flex justify-center items-center relative z-10 px-10 md:px-0">
              <div className="flex items-center p-2 bg-[#FBFCFE]">
                <div className="h-4 w-28 sm:w-36 rounded bg-[#E6E8F5]" />
                <div className="ml-1.5 w-[15px] h-[15px] rounded-full bg-[#E6E8F5]" />
              </div>
            </div>

            {/* Icônes de droite (app, dashboard, poubelle - Desktop uniquement) */}
            <div className="hidden md:flex items-center gap-3 absolute right-0 z-10 p-2 bg-[#FBFCFE]">
              <div className="w-[25px] h-[25px] flex items-center justify-center">
                <div className="w-[20px] h-[20px] rounded-[4px] bg-[#E6E8F5]" />
              </div>
              <div className="w-[25px] h-[25px] flex items-center justify-center">
                <div className="w-[20px] h-[20px] rounded-[4px] bg-[#E6E8F5]" />
              </div>
              <div className="w-[20px] h-[20px] flex items-center justify-center">
                <div className="w-[16px] h-[16px] rounded-[3px] bg-[#E6E8F5]" />
              </div>
            </div>

            {/* Menu kebab mobile */}
            {item.trainingCount > 0 && (
              <div className="flex md:hidden items-center absolute right-0 z-10 p-2 bg-[#FBFCFE]">
                <div className="w-[30px] h-[30px] flex items-center justify-center">
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E6E8F5]" />
                </div>
              </div>
            )}

            {/* Ligne horizontale traversant toute la largeur */}
            <div className="absolute bottom-6 left-0 w-full h-[1px] bg-[#ECE9F1] z-0" />
          </div>

          {/* Grille des entraînements - identique à DroppableProgram */}
          <div className="flex flex-wrap gap-4 items-start">
            {Array.from({ length: item.trainingCount }).map((_, trainingIndex) => (
              <div
                key={trainingIndex}
                className="w-full sm:w-[270px] rounded-[8px] shadow-glift"
              >
                <div className="w-full sm:w-[270px] h-[60px] flex items-center justify-between px-4 font-semibold text-[16px] rounded-[8px] bg-white border border-[#D7D4DC]">
                  {/* Icône de drag */}
                  <div className="w-[25px] h-[25px] flex-shrink-0 flex items-center justify-center">
                    <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E6E8F5]" />
                  </div>

                  {/* Titre de l'entraînement */}
                  <div className="flex-1 px-6 flex items-center justify-center min-w-0 h-full">
                    <div className="h-4 w-24 sm:w-28 rounded bg-[#E6E8F5]" />
                  </div>

                  {/* Menu kebab 3 points */}
                  <div className="w-[25px] h-[25px] flex-shrink-0 flex items-center justify-center">
                    <div className="flex flex-col gap-0.5 items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#E6E8F5]" />
                      <div className="w-1 h-1 rounded-full bg-[#E6E8F5]" />
                      <div className="w-1 h-1 rounded-full bg-[#E6E8F5]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bouton "+ Ajouter un entraînement" */}
            <div className="ml-0 w-full sm:w-auto">
              <div className="border-[2px] border-dashed border-[#D7D4DC] text-[#D7D4DC] text-[16px] font-semibold px-5 py-2 rounded-[8px] w-full sm:w-[270px] h-[60px] flex items-center justify-center select-none">
                + Ajouter un entraînement
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
