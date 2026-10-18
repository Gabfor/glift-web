"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

interface ShinyAuthorImageProps {
  src: string;
  alt: string;
  isShiny?: boolean;
  cutoutSrc?: string;
  bgSrc?: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

export default function ShinyAuthorImage({
  src,
  alt,
  isShiny = false,
  cutoutSrc,
  bgSrc = "/images/holo_foil_bg.jpg",
  fill = true,
  sizes,
  className = "w-full h-full object-cover",
  containerClassName = "",
  priority = false,
  unoptimized = false,
}: ShinyAuthorImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  // Site gradient settings configured in Admin
  const siteSettings = useSiteSettings();
  const color1 = siteSettings.gradientColor1 || "#F6E9F9";
  const opacity1 = siteSettings.gradientOpacity1 ?? 65;
  const color2 = siteSettings.gradientColor2 || "#E4ECFF";
  const opacity2 = siteSettings.gradientOpacity2 ?? 65;
  const color3 = siteSettings.gradientColor3 || "#F0EBFF";
  const opacity3 = siteSettings.gradientOpacity3 ?? 80;

  const rgba1 = hexToRgba(color1, opacity1);
  const rgba2 = hexToRgba(color2, opacity2);
  const rgba3 = hexToRgba(color3, opacity3);
  const adminGradient = `linear-gradient(115deg, ${rgba1} 0%, ${rgba3} 45%, ${rgba2} 100%)`;

  const authorImgSrc = cutoutSrc || src;

  // Targets and smoothed values for gyroscope / touch animation
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  const [gyroActive, setGyroActive] = useState(false);

  // iOS Safari 13+ silent permission request on first user touch/click
  useEffect(() => {
    if (!isShiny || typeof window === "undefined") return;

    const requestIosPermission = async () => {
      if (
        typeof (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
          .DeviceOrientationEvent?.requestPermission === "function"
      ) {
        try {
          const res = await (
            window as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }
          ).DeviceOrientationEvent.requestPermission();
          if (res === "granted") {
            setGyroActive(true);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("click", requestIosPermission, { once: true });
    window.addEventListener("touchend", requestIosPermission, { once: true });

    return () => {
      window.removeEventListener("click", requestIosPermission);
      window.removeEventListener("touchend", requestIosPermission);
    };
  }, [isShiny]);

  // Gyroscope orientation listener: responds to physical device tilting
  useEffect(() => {
    if (!isShiny || typeof window === "undefined") return;

    let eventCount = 0;
    const clamp = (val: number, min: number, max: number) =>
      Math.max(min, Math.min(max, val));

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return;

      eventCount++;
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 45;

      // Sensitive mapping: ±12 degrees tilt reaches full travel
      const normX = clamp(gamma / 12, -1, 1);
      const normY = clamp((beta - 45) / 12, -1, 1);

      targetRef.current = {
        x: normX,
        y: normY,
      };

      if (!gyroActive && eventCount > 2) {
        setGyroActive(true);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [isShiny, gyroActive]);

  // Touch move support on mobile / responsive mode (e.g. testing in DevTools or swiping)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isShiny) return;
    const touch = e.touches[0];
    if (!touch || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((touch.clientX - rect.left) / rect.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, ((touch.clientY - rect.top) / rect.height) * 2 - 1));

    targetRef.current = { x, y };
  };

  // Direct 60fps GPU render loop via requestAnimationFrame
  useEffect(() => {
    if (!isShiny) return;

    let time = 0;

    const tick = () => {
      time += 0.03;

      let targetX = targetRef.current.x;
      let targetY = targetRef.current.y;

      // If no gyro events arrived yet, breathe gently so it's not frozen
      if (!gyroActive) {
        targetX += Math.sin(time) * 0.25;
        targetY += Math.cos(time * 0.7) * 0.25;
      }

      // Smooth interpolation (lerp)
      const lerpFactor = 0.15;
      currentRef.current.x += (targetX - currentRef.current.x) * lerpFactor;
      currentRef.current.y += (targetY - currentRef.current.y) * lerpFactor;

      const { x, y } = currentRef.current;

      const posX = ((x + 1) / 2) * 100;
      const posY = ((y + 1) / 2) * 100;

      // 1. Background parallax depth (large travel: ±24px)
      if (bgRef.current) {
        const px = (-x * 24).toFixed(1);
        const py = (-y * 24).toFixed(1);
        bgRef.current.style.transform = `translate3d(${px}px, ${py}px, 0) scale(1.18)`;
      }

      // 2. Rainbow Holographic Sheen
      if (holoRef.current) {
        const angle = (125 + x * 45).toFixed(1);
        holoRef.current.style.backgroundImage = `linear-gradient(
          ${angle}deg,
          rgba(255, 95, 225, 0.6) 0%,
          rgba(95, 215, 255, 0.65) 20%,
          rgba(135, 255, 215, 0.6) 40%,
          rgba(255, 245, 120, 0.65) 60%,
          rgba(255, 120, 195, 0.6) 80%,
          rgba(185, 120, 255, 0.65) 100%
        )`;
        holoRef.current.style.backgroundPosition = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`;
      }

      // 3. Diagonal Light Bar Sweep
      if (streakRef.current) {
        const streakPos = (((x + y + 2) / 4) * 260 - 80).toFixed(1);
        streakRef.current.style.backgroundPosition = `${streakPos}% ${streakPos}%`;
      }

      // 4. Sparkles / Stars parallax
      if (sparkleRef.current) {
        const sx = (x * 16).toFixed(1);
        const sy = (y * 16).toFixed(1);
        sparkleRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
        sparkleRef.current.style.backgroundPosition = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`;
      }

      // 5. Specular Glare
      if (sheenRef.current) {
        sheenRef.current.style.backgroundImage = `radial-gradient(
          farthest-corner circle at ${posX.toFixed(1)}% ${posY.toFixed(1)}%,
          rgba(255, 255, 255, 0.95) 0%,
          rgba(255, 255, 255, 0.35) 35%,
          rgba(255, 255, 255, 0) 70%
        )`;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isShiny, gyroActive]);

  // DEFAULT (isShiny === false): Admin Site Gradient Background
  if (!isShiny) {
    return (
      <div className={`relative overflow-hidden bg-white ${containerClassName}`}>
        {/* Background layer: Admin gradient */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background: siteSettings.gradientEnabled !== false ? adminGradient : "#F4F5FE",
          }}
        />
        {/* Cutout author image */}
        <div className="relative w-full h-full pointer-events-none">
          <Image
            src={authorImgSrc}
            alt={alt}
            fill={fill}
            sizes={sizes}
            className={className}
            priority={priority}
            unoptimized={unoptimized}
          />
        </div>
      </div>
    );
  }

  // SHINY ACTIVE (isShiny === true): Holographic Shiny Background
  return (
    <div
      ref={containerRef}
      onTouchMove={handleTouchMove}
      className={`relative select-none overflow-hidden bg-white ${containerClassName}`}
      style={{ touchAction: "pan-y" }}
    >
      <div
        ref={cardRef}
        className="w-full h-full relative overflow-hidden"
      >
        {/* BACK LAYER: Background with wide travel parallax */}
        <div
          ref={bgRef}
          className="absolute -inset-[25px] will-change-transform"
          style={{ transform: "translate3d(0, 0, 0) scale(1.18)" }}
        >
          <Image
            src={bgSrc}
            alt=""
            fill
            sizes={sizes}
            className="w-full h-full object-cover"
            priority={priority}
            unoptimized={unoptimized}
          />
        </div>

        {/* LAYER 1: Holographic Rainbow Iridescent Sheen */}
        <div
          ref={holoRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80"
          style={{
            backgroundSize: "220% 220%",
            backgroundPosition: "50% 50%",
            filter: "brightness(1.25) contrast(1.2)",
          }}
        />

        {/* LAYER 2: Holographic Diagonal Light Bar Sweep */}
        <div
          ref={streakRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-75"
          style={{
            backgroundImage: `linear-gradient(
              130deg,
              transparent 20%,
              rgba(255, 255, 255, 0.5) 45%,
              rgba(255, 255, 255, 1) 50%,
              rgba(255, 255, 255, 0.5) 55%,
              transparent 80%
            )`,
            backgroundSize: "250% 250%",
            backgroundPosition: "50% 50%",
          }}
        />

        {/* LAYER 3: Shimmering Sparkles / Glitter Accent */}
        <div
          ref={sparkleRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-85 will-change-transform"
          style={{
            backgroundImage: `
              radial-gradient(circle at 18% 22%, rgba(255,255,255,1) 1.5px, transparent 3px),
              radial-gradient(circle at 78% 18%, rgba(255,255,255,1) 2px, transparent 4px),
              radial-gradient(circle at 35% 75%, rgba(255,255,255,1) 1.5px, transparent 3px),
              radial-gradient(circle at 82% 70%, rgba(255,255,255,1) 2px, transparent 4px),
              radial-gradient(circle at 52% 42%, rgba(255,255,255,1) 1.8px, transparent 3.5px),
              radial-gradient(circle at 12% 62%, rgba(255,255,255,1) 1.5px, transparent 3px),
              radial-gradient(circle at 88% 42%, rgba(255,255,255,1) 1.8px, transparent 3.5px)
            `,
            backgroundSize: "140% 140%",
            backgroundPosition: "50% 50%",
          }}
        />

        {/* LAYER 4: Specular Sheen / Gloss Flash (Behind character) */}
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-55"
        />

        {/* TOP LAYER: CHARACTER CUTOUT (100% pristine, untouched by shiny effects) */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src={authorImgSrc}
            alt={alt}
            fill={fill}
            sizes={sizes}
            className={className}
            priority={priority}
            unoptimized={unoptimized}
          />
        </div>
      </div>
    </div>
  );
}
