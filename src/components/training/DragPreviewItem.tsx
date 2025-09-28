"use client";

import Image from "next/image";

interface Training {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
}

export default function DragPreviewItem({ training }: { training: Training }) {
  return (
    <div className="w-[270px] h-[60px] bg-white border border-[#ECE9F1] rounded-[5px] flex items-center justify-between px-4 text-[#3A416F] font-semibold text-[16px] shadow-[0px_1px_15px_rgba(0,0,0,0.08)] cursor-grabbing select-none">
      <div className="w-[25px] h-[25px] group relative">
        <Image
          src="/icons/drag.svg"
          alt="Déplacer"
          fill
          sizes="100%"
          className="group-hover:hidden"
        />
        <Image
          src="/icons/drag_hover.svg"
          alt="Déplacer (hover)"
          fill
          sizes="100%"
          className="hidden group-hover:inline"
        />
      </div>

      <span className="truncate text-center flex-1 px-6">{training.name}</span>

      <div className="w-[25px] h-[25px] z-10">
        <div className="group w-[25px] h-[25px] flex items-center justify-center relative">
          <Image src="/icons/dots.svg" alt="Menu" fill sizes="100%" className="group-hover:hidden" />
          <Image src="/icons/dots_hover.svg" alt="Menu (hover)" fill sizes="100%" className="hidden group-hover:inline" />
        </div>
      </div>
    </div>
  );
}
