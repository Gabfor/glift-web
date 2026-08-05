"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";

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

export default function ConceptGradientBackground({ initialSettings }: ConceptGradientBackgroundProps) {
  const siteSettings = useSiteSettings();

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

  const backgroundStyle = {
    background: `
      radial-gradient(ellipse 70% 90% at 0% -10%, ${rgba1} 0%, rgba(251, 252, 254, 0) 65%),
      radial-gradient(ellipse 70% 90% at 100% -10%, ${rgba2} 0%, rgba(251, 252, 254, 0) 65%),
      radial-gradient(ellipse 60% 60% at 50% -20%, ${rgba3} 0%, rgba(251, 252, 254, 0) 80%)
    `,
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 w-full h-[340px] sm:h-[420px] md:h-[480px] pointer-events-none z-0"
      style={backgroundStyle}
    />
  );
}
