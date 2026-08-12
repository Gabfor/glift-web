"use client";

import React, { useEffect, useRef } from "react";

interface MatrixRainBackgroundProps {
  opacity?: number;
  className?: string;
}

interface ColumnData {
  x: number;
  dropY: number;
  speed: number;
  fontSize: number;
  depth: number; // Opacité et taille selon la profondeur (0.3 = arrière-plan, 1.0 = premier plan)
  trailLength: number;
}

export default function MatrixRainBackground({
  opacity = 1,
  className = "",
}: MatrixRainBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    const interval = 50; // Fluidité constante

    let columnList: ColumnData[] = [];

    const initColumns = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      canvas.height = parent ? parent.clientHeight : 480;

      const colSpacing = 10; // Haute densité de colonnes
      const count = Math.floor(canvas.width / colSpacing) + 2;
      columnList = [];

      for (let i = 0; i < count; i++) {
        // Profondeur aléatoire entre 0.35 (fond) et 1.0 (avant-plan)
        const depth = Math.random() < 0.3 ? 0.35 : Math.random() < 0.7 ? 0.65 : 1.0;
        const fontSize = Math.round(11 + depth * 5); // 13px à 16px
        const speed = depth * 0.9 + 0.3; // Les colonnes au 1er plan descendent plus vite que celles du fond

        columnList.push({
          x: i * colSpacing,
          dropY: Math.floor(Math.random() * -60),
          speed,
          fontSize,
          depth,
          trailLength: Math.floor(Math.random() * 8) + 10,
        });
      }
    };

    initColumns();
    window.addEventListener("resize", initColumns);

    const chars = ["0", "1"];

    const render = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (timestamp - lastTime < interval) return;
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columnList.length; i++) {
        const col = columnList[i];
        ctx.font = `700 ${col.fontSize}px monospace`;

        const headY = col.dropY * col.fontSize;

        for (let k = 0; k < col.trailLength; k++) {
          const charY = headY - k * col.fontSize;
          if (charY < 0 || charY > canvas.height + col.fontSize * 2) continue;

          const char = chars[Math.floor(Math.random() * chars.length)];

          // Effet de profondeur : opacité proportionnelle à la profondeur et à la position dans la traînée
          const trailFade = (1 - k / col.trailLength);
          const maxAlpha = col.depth * 0.9;
          const alpha = Math.max(0.05, trailFade * maxAlpha);

          if (k === 0) {
            // Tête de colonne (couleur principale #3A416F plus accentuée)
            ctx.fillStyle = `rgba(58, 65, 111, ${col.depth})`;
          } else if (k < 3) {
            // Haut de traînée
            ctx.fillStyle = `rgba(58, 65, 111, ${alpha})`;
          } else {
            // Queue de traînée
            ctx.fillStyle = `rgba(93, 100, 148, ${alpha})`;
          }

          ctx.fillText(char, col.x, charY);
        }

        // Réinitialisation de la colonne
        if (headY - col.trailLength * col.fontSize > canvas.height && Math.random() > 0.90) {
          col.dropY = Math.floor(Math.random() * -20);
          col.trailLength = Math.floor(Math.random() * 8) + 10;
        }

        col.dropY += col.speed;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", initColumns);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className={`absolute top-0 left-0 right-0 w-full h-[340px] sm:h-[420px] md:h-[480px] pointer-events-none -z-10 overflow-hidden ${className}`}
      style={{
        background:
          "linear-gradient(115deg, rgba(246, 233, 249, 0.85) 0%, rgba(240, 235, 255, 0.85) 45%, rgba(228, 236, 255, 0.85) 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)",
        opacity,
        zIndex: -10,
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
