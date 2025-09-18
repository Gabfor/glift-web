"use client";

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
      <img
        src={icon}
        alt="Ajouter une ligne"
        onClick={onClick}
        onMouseEnter={() => setIcon("/icons/plus_hover.svg")}
        onMouseLeave={() => setIcon("/icons/plus.svg")}
        className="cursor-pointer w-5 h-5"
      />
    </Tooltip>
    </div>
  );
}
