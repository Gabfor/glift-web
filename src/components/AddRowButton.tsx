"use client";

import Image from "next/image";

import Tooltip from "@/components/Tooltip";

type Props = {
  icon: string;
  setIcon: (src: string) => void;
  onClick: () => void;
  disabled?: boolean;
};

export default function AddRowButton({ icon, setIcon, onClick, disabled }: Props) {
  return (
    <div className="flex justify-center mt-4">
      <Tooltip content={disabled ? "Limite de 10 exercices atteinte" : "Ajouter une ligne"} placement="bottom" delay={500}>
        <Image
          src={icon}
          alt="Ajouter une ligne"
          width={20}
          height={20}
          onClick={() => !disabled && onClick()}
          onMouseEnter={() => !disabled && setIcon("/icons/plus_hover.svg")}
          onMouseLeave={() => !disabled && setIcon("/icons/plus.svg")}
          className={`w-5 h-5 ${disabled ? "opacity-30 cursor-default grayscale" : "cursor-pointer"}`}
        />
      </Tooltip>
    </div>
  );
}
