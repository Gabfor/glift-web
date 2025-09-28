"use client";

import Image from "next/image";

type Props = {
  columns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
  onToggle: (name: string) => void;
};

export default function ColumnMenu({ columns, onToggle }: Props) {
  return (
    <div className="absolute -right-4 top-full mt-3 w-[183px] bg-white rounded-[5px] shadow-[0px_5px_21px_0px_rgba(93,100,148,0.15)] border border-[#ECE9F1] z-50 py-3 px-3 text-[16px] text-[#5D6494]">
      {/* Flèche en haut droite */}
      <div className="absolute top-[-9px] right-4 w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />

      {columns.map((col) => (
        <button
          key={col.name}
          onClick={() => onToggle(col.name)}
          className="flex items-center gap-2 py-[6px] cursor-pointer w-full text-left"
        >
          <Image
            src={`/icons/${col.visible ? "checkbox_checked.svg" : "checkbox_unchecked.svg"}`}
            alt={col.visible ? "Coché" : "Non coché"}
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span className="font-semibold">Colonne {col.label}</span>
        </button>
      ))}
    </div>
  );
}
