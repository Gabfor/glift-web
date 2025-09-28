"use client";

import Image from "next/image";

import Tooltip from "@/components/Tooltip";

type Props = {
  icon: string;
  setIcon: (src: string) => void;
  onClick: () => void;
};

export default function AddRowButton({ icon, setIcon, onClick }: Props) {
  return (
    <div className="flex justify-center mt-4">
      <Tooltip content="Ajouter une ligne" placement="bottom" delay={500}>
        <Image
          src={icon}
          alt="Ajouter une ligne"
          width={20}
          height={20}
          onClick={onClick}
          onMouseEnter={() => setIcon("/icons/plus_hover.svg")}
          onMouseLeave={() => setIcon("/icons/plus.svg")}
          className="cursor-pointer w-5 h-5"
        />
      </Tooltip>
    </div>
  );
}
