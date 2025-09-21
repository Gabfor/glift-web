"use client";

import type { Row } from "./useTrainingDnD";

interface Training {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
}

// On accepte à la fois Training et Row, mais on utilise juste .name
type Props = {
  training: Training | Row;
};

export default function DragPreviewItem({ training }: Props) {
  return (
    <div className="w-[270px] h-[60px] bg-white border border-[#ECE9F1] rounded-[5px] flex items-center px-4 text-[#3A416F] font-semibold text-[16px] shadow-[0px_1px_15px_rgba(0,0,0,0.08)] cursor-grabbing select-none">
      <div className="relative w-full flex items-center justify-center">
        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-[25px] h-[25px] z-10 group">
          <img
            src="/icons/drag.svg"
            alt="Déplacer"
            className="absolute top-0 left-0 w-full h-full group-hover:hidden"
          />
          <img
            src="/icons/drag_hover.svg"
            alt="Déplacer (hover)"
            className="absolute top-0 left-0 w-full h-full hidden group-hover:inline"
          />
        </div>
        <span className="truncate text-center px-6">
          {"name" in training ? training.name : training.exercice}
        </span>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[25px] h-[25px] z-10">
          <div className="group w-[25px] h-[25px] flex items-center justify-center">
            <img src="/icons/dots.svg" alt="Menu" className="group-hover:hidden" />
            <img src="/icons/dots_hover.svg" alt="Menu (hover)" className="hidden group-hover:inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
