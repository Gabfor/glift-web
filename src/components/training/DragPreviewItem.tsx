"use client";

import Image from "next/image";

interface Training {
  id: string;
  name: string;
  app: boolean;
}

export default function DragPreviewItem({ training }: { training: Training }) {
  return (
    <div className="w-[270px] h-[60px] flex items-center justify-between px-4 font-semibold text-[16px] rounded-[8px] bg-white border border-[#D7D4DC] text-[#3A416F] shadow-glift-hover-strong cursor-grabbing select-none">
      {/* Zone de gauche : Drag */}
      <div className="w-[25px] h-[25px] flex-shrink-0 group relative flex items-center justify-center">
        <Image
          src="/icons/drag_hover.svg"
          alt="Déplacer"
          fill
          sizes="100%"
        />
      </div>

      {/* Titre */}
      <div className="flex-1 px-6 flex items-center justify-center min-w-0 h-full">
        <span className="block w-full truncate text-center leading-normal">{training.name}</span>
      </div>

      {/* Zone de droite : Menu */}
      <div className="w-[25px] h-[25px] flex-shrink-0 z-10 flex items-center justify-center">
        <div className="relative">
          <div className="w-full h-full flex items-center justify-center">
            <div className="group w-[25px] h-[25px] flex items-center justify-center relative">
              <Image src="/icons/dots.svg" alt="Menu" fill sizes="100%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
