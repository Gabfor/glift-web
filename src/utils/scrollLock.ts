"use client";

import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

let activeLocksCount = 0;
let savedScrollY = 0;
let lastUnlockTimestamp = 0;
let originalStyles = {
  position: "",
  top: "",
  left: "",
  right: "",
  width: "",
  paddingRight: "",
};

let isMobileFixedLocked = false;

export const isScrollLocked = () => activeLocksCount > 0;
export const isScrollRecentlyUnlocked = () => Date.now() - lastUnlockTimestamp < 350;
export const getSavedScrollY = () => savedScrollY;

export const lockScroll = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  activeLocksCount++;
  if (activeLocksCount > 1) {
    return;
  }

  // Save current scroll position before modifying body
  savedScrollY =
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  const body = document.body;
  const docEl = document.documentElement;

  // Save original styles to restore them accurately
  originalStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  };

  docEl.classList.add("manual-scroll-lock");
  body.classList.add("manual-scroll-lock");

  // On mobile touch screens (< 768px), iOS Safari allows background touch bouncing
  // unless body is pinned with position: fixed.
  // On desktop (>= 768px), html already has `scrollbar-gutter: stable` in globals.css.
  // Setting overflow: hidden via `manual-scroll-lock` perfectly locks mouse wheel and keyboard scrolling
  // with 0px layout shift. Applying position: fixed and paddingRight on desktop causes a visible shift to the left.
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    isMobileFixedLocked = true;
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
  } else {
    isMobileFixedLocked = false;
  }
};

export const unlockScroll = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  activeLocksCount = Math.max(0, activeLocksCount - 1);
  if (activeLocksCount > 0) {
    return;
  }

  lastUnlockTimestamp = Date.now();

  const body = document.body;
  const docEl = document.documentElement;
  const scrollYToRestore = savedScrollY;

  // Disable smooth scroll temporarily so restoring scroll position is instantaneous and without visual jump
  docEl.classList.add("instant-scroll");
  docEl.classList.remove("manual-scroll-lock");
  body.classList.remove("manual-scroll-lock");

  body.style.position = originalStyles.position;
  body.style.top = originalStyles.top;
  body.style.left = originalStyles.left;
  body.style.right = originalStyles.right;
  body.style.width = originalStyles.width;
  body.style.paddingRight = originalStyles.paddingRight;

  if (isMobileFixedLocked) {
    isMobileFixedLocked = false;
    window.scrollTo({ top: scrollYToRestore, left: 0, behavior: "instant" });
  }

  requestAnimationFrame(() => {
    docEl.classList.remove("instant-scroll");
  });
};

export const forceUnlockScroll = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  activeLocksCount = 0;
  lastUnlockTimestamp = Date.now();

  const body = document.body;
  const docEl = document.documentElement;
  const scrollYToRestore = savedScrollY;

  docEl.classList.add("instant-scroll");
  docEl.classList.remove("manual-scroll-lock");
  body.classList.remove("manual-scroll-lock");

  body.style.position = originalStyles.position;
  body.style.top = originalStyles.top;
  body.style.left = originalStyles.left;
  body.style.right = originalStyles.right;
  body.style.width = originalStyles.width;
  body.style.paddingRight = originalStyles.paddingRight;

  if (isMobileFixedLocked) {
    isMobileFixedLocked = false;
    if (scrollYToRestore > 0) {
      window.scrollTo({ top: scrollYToRestore, left: 0, behavior: "instant" });
    }
  }

  requestAnimationFrame(() => {
    docEl.classList.remove("instant-scroll");
  });
};

export function useScrollLock(enabled: boolean) {
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [enabled]);
}
