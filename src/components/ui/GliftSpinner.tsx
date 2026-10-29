"use client";

import Image from "next/image";
import clsx from "clsx";

interface GliftSpinnerProps {
  size?: number;
  className?: string;
  variant?: "white" | "purple";
  iconSrc?: string;
}

export default function GliftSpinner({
  size = 32,
  className,
  variant = "white",
  iconSrc,
}: GliftSpinnerProps) {
  const resolvedSrc =
    iconSrc ?? (variant === "purple" ? "/icons/loader_purple.svg" : "/icons/loader.svg");

  return (
    <div
      className={clsx("inline-flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={resolvedSrc}
        alt="Chargement..."
        width={size}
        height={size}
        className="animate-spin w-full h-full"
        style={{ animationDuration: "1s" }}
        priority
      />
    </div>
  );
}
