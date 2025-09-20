"use client";
import React from "react";

type AvatarUrls = Partial<{ xs: string; sm: string; md: string; lg: string; xl: string }>;

type Props = {
  name: string;
  url?: string | null;
  urls?: AvatarUrls;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
};

const PX = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 } as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const text = parts.map(p => p[0]?.toUpperCase() ?? "").join("");
  return text || "👤";
}

export default function Avatar({ name, url, urls, size = "md", className = "", onClick }: Props) {
  const [errored, setErrored] = React.useState(false);
  const dim = PX[size];
  const src = urls?.[size] ?? url ?? null;
  const classes = `inline-flex items-center justify-center rounded-full overflow-hidden select-none ${className}`;

  if (!src || errored) {
    return (
      <div
        role={onClick ? "button" : "img"}
        aria-label={name}
        onClick={onClick}
        className={`${classes} bg-gray-100`}
        style={{ width: dim, height: dim }}
      >
        <span className="text-xs font-semibold text-[#5D6494]">{initials(name)}</span>
      </div>
    );
  }

  return (
    <img
      alt={name}
      src={src}
      onError={() => setErrored(true)}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={classes}
      style={{ width: dim, height: dim, borderRadius: "9999px", objectFit: "cover" }}
      onClick={onClick}
    />
  );
}
