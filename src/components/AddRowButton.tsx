"use client";

import Image from "next/image";

import Tooltip from "@/components/Tooltip";

type Props = {
  icon: string;
  setIcon: (src: string) => void;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
  adminMode?: boolean;
};

export default function AddRowButton({ icon, setIcon, onClick, disabled, locked, adminMode }: Props) {
  const isEffectiveAdmin = adminMode || (typeof window !== "undefined" && window.location.host.startsWith("admin."));
  const defaultPlusIcon = isEffectiveAdmin ? "/icons/admin_plus.svg" : "/icons/plus.svg";
  const hoverPlusIcon = isEffectiveAdmin ? "/icons/admin_plus_hover.svg" : "/icons/plus_hover.svg";

  const currentIcon = (icon === "/icons/plus.svg" || icon === "/icons/plus_hover.svg") && isEffectiveAdmin
    ? (icon === "/icons/plus_hover.svg" ? hoverPlusIcon : defaultPlusIcon)
    : icon;

  if (locked) {
    return (
      <div className="flex justify-center mt-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cursor-pointer"
          onClick={onClick}
        >
          <circle cx="10" cy="10" r="10" fill="#ECE9F1" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V9H14C14.5523 9 15 9.44772 15 10C15 10.5523 14.5523 11 14 11H11V11.1582V14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14V11.1582V11H6C5.44772 11 5 10.5523 5 10C5 9.44772 5.44772 9 6 9H9V6Z"
            fill="#D7D4DC"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-4">
      <Tooltip content={disabled ? "Chargement..." : "Ajouter une ligne"} placement="bottom" delay={500}>
        <Image
          src={currentIcon}
          alt="Ajouter une ligne"
          width={20}
          height={20}
          onClick={() => !disabled && onClick()}
          onMouseEnter={() => !disabled && setIcon(hoverPlusIcon)}
          onMouseLeave={() => !disabled && setIcon(defaultPlusIcon)}
          className={`w-5 h-5 ${disabled ? "opacity-30 cursor-default grayscale" : "cursor-pointer"}`}
        />
      </Tooltip>
    </div>
  );
}
