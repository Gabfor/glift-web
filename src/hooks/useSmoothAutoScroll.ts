"use client";

import { useEffect, useRef } from "react";

interface SmoothAutoScrollOptions {
  /** Distance in pixels or fraction of viewport from the top/bottom edges of the viewport to trigger auto-scroll */
  threshold?: number;
  /** Minimum scroll speed in pixels per frame (at threshold boundary) */
  minSpeed?: number;
  /** Maximum scroll speed in pixels per frame (at viewport edge) */
  maxSpeed?: number;
}

/**
 * High-performance, 60fps/120fps auto-scroll hook during drag-and-drop.
 * Ensures continuous, responsive scrolling on mobile touch and desktop even
 * when the finger or cursor is held still near the edge of the viewport.
 * 
 * Key optimizations:
 * 1. Temporarily forces instant scrollBehavior on documentElement to prevent CSS
 *    `scroll-behavior: smooth` from stuttering or freezing the requestAnimationFrame loop.
 * 2. Uses capture-phase listeners on document for reliable coordinate tracking.
 * 3. Does not prematurely kill coordinates on touchcancel if drag is still active.
 * 4. Dynamic threshold (at least 24% of viewport height) and snappy acceleration curve.
 */
export function useSmoothAutoScroll(
  isDragging: boolean,
  options: SmoothAutoScrollOptions = {}
) {
  const { threshold, minSpeed = 10, maxSpeed = 38 } = options;
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  useEffect(() => {
    if (!isDragging) return;

    // Temporarily bypass CSS `scroll-behavior: smooth` which conflicts with RAF scrollBy
    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    html.classList.add("instant-scroll");

    let animationFrameId: number | null = null;
    let currentY: number | null = null;

    const updateCoordinates = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        currentY = e.touches[0].clientY;
      } else if ("clientY" in e) {
        currentY = (e as MouseEvent).clientY;
      }
    };

    const handleEnd = () => {
      currentY = null;
    };

    const scrollLoop = () => {
      if (isDraggingRef.current && currentY !== null) {
        const viewportHeight = window.innerHeight;
        const activeThreshold = threshold ?? Math.max(180, Math.round(viewportHeight * 0.24));
        const bottomZone = viewportHeight - activeThreshold;
        const topZone = activeThreshold;

        const scrollingEl = document.scrollingElement || document.documentElement || document.body;
        const maxScroll = Math.max(0, scrollingEl.scrollHeight - viewportHeight);
        const currentScroll = window.scrollY || scrollingEl.scrollTop || 0;

        if (currentY > bottomZone) {
          if (currentScroll < maxScroll - 1) {
            const distance = currentY - bottomZone;
            const progress = Math.min(1, Math.max(0, distance / (activeThreshold * 0.85)));
            const speed = Math.round(minSpeed + Math.pow(progress, 1.2) * (maxSpeed - minSpeed));
            const clampedSpeed = Math.min(speed, maxScroll - currentScroll);

            if (clampedSpeed > 0) {
              try {
                window.scrollBy({ top: clampedSpeed, left: 0, behavior: "instant" as ScrollBehavior });
              } catch {
                window.scrollBy(0, clampedSpeed);
              }
            }
          }
        } else if (currentY < topZone) {
          if (currentScroll > 1) {
            const distance = topZone - currentY;
            const progress = Math.min(1, Math.max(0, distance / (activeThreshold * 0.85)));
            const speed = Math.round(minSpeed + Math.pow(progress, 1.2) * (maxSpeed - minSpeed));
            const clampedSpeed = Math.min(speed, currentScroll);

            if (clampedSpeed > 0) {
              try {
                window.scrollBy({ top: -clampedSpeed, left: 0, behavior: "instant" as ScrollBehavior });
              } catch {
                window.scrollBy(0, -clampedSpeed);
              }
            }
          }
        }
      }

      if (isDraggingRef.current) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    // Capture phase listeners ensure updates are never blocked by inner element handlers
    document.addEventListener("pointermove", updateCoordinates, { capture: true, passive: true });
    document.addEventListener("touchmove", updateCoordinates, { capture: true, passive: true });
    document.addEventListener("touchstart", updateCoordinates, { capture: true, passive: true });
    document.addEventListener("pointerdown", updateCoordinates, { capture: true, passive: true });

    document.addEventListener("touchend", handleEnd, { capture: true, passive: true });
    document.addEventListener("pointerup", handleEnd, { capture: true, passive: true });
    document.addEventListener("mouseup", handleEnd, { capture: true, passive: true });

    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener("pointermove", updateCoordinates, true);
      document.removeEventListener("touchmove", updateCoordinates, true);
      document.removeEventListener("touchstart", updateCoordinates, true);
      document.removeEventListener("pointerdown", updateCoordinates, true);

      document.removeEventListener("touchend", handleEnd, true);
      document.removeEventListener("pointerup", handleEnd, true);
      document.removeEventListener("mouseup", handleEnd, true);

      // Restore scroll-behavior
      html.style.scrollBehavior = originalScrollBehavior;
      html.classList.remove("instant-scroll");
    };
  }, [isDragging, threshold, minSpeed, maxSpeed]);
}
