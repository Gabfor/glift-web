"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";

function hexToRgba(hex: string, opacityPercent: number = 100): string {
  let cleanHex = (hex || "#FBFCFE").replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) {
    cleanHex = "FBFCFE";
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const alpha = Math.min(100, Math.max(0, isNaN(opacityPercent) ? 65 : opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ConceptGradientBackgroundProps {
  initialSettings?: Record<string, string>;
}

const ALLOWED_DISCONNECTED_PATHS = [
  "/",
  "/concept",
  "/concepts",
  "/app",
  "/apps",
  "/tarifs",
  "/creation-programmes",
  "/suivi-seances",
  "/notation-ressenti",
  "/visualisation-progression",
];

export default function ConceptGradientBackground({ initialSettings }: ConceptGradientBackgroundProps) {
  const { isAuthenticated } = useUser();
  const pathname = usePathname();
  const siteSettings = useSiteSettings();

  // 1. Ne pas afficher le dégradé en mode connecté
  if (isAuthenticated) {
    return null;
  }

  // 2. En mode déconnecté, afficher uniquement sur les pages autorisées
  const rawPath = pathname || "/";
  const cleanPath = rawPath.replace(/\/$/, "") || "/";
  const normalizedPath = cleanPath.replace(/^\/(fr|en)(\/|$)/, "$2") || "/";

  const isAllowedPath = ALLOWED_DISCONNECTED_PATHS.includes(normalizedPath);
  if (!isAllowedPath) {
    return null;
  }

  const enabled = initialSettings
    ? initialSettings["gradient_enabled"] !== "false"
    : siteSettings.gradientEnabled;

  if (!enabled) return null;

  const color1 = initialSettings?.["gradient_color1"] || siteSettings.gradientColor1 || "#F6E9F9";
  const opacity1 = parseInt(initialSettings?.["gradient_opacity1"] || String(siteSettings.gradientOpacity1 ?? 65), 10);

  const color2 = initialSettings?.["gradient_color2"] || siteSettings.gradientColor2 || "#E4ECFF";
  const opacity2 = parseInt(initialSettings?.["gradient_opacity2"] || String(siteSettings.gradientOpacity2 ?? 65), 10);

  const color3 = initialSettings?.["gradient_color3"] || siteSettings.gradientColor3 || "#F0EBFF";
  const opacity3 = parseInt(initialSettings?.["gradient_opacity3"] || String(siteSettings.gradientOpacity3 ?? 80), 10);

  const rgba1 = hexToRgba(color1, opacity1);
  const rgba2 = hexToRgba(color2, opacity2);
  const rgba3 = hexToRgba(color3, opacity3);

  const backgroundStyle: React.CSSProperties = {
    background: `linear-gradient(115deg, ${rgba1} 0%, ${rgba3} 45%, ${rgba2} 100%)`,
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)",
    maskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)",
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 w-full h-[340px] sm:h-[420px] md:h-[480px] pointer-events-none z-0"
      style={backgroundStyle}
    />
  );
}
