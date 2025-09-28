'use client'; // ✅ cette ligne doit absolument être la première

import { useEffect } from 'react';

export function UnlockScroll() {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const body = document.body;
      if (body.getAttribute('data-scroll-locked') === '1') {
        console.log('[UnlockScroll] Unlocking scroll');
        body.style.pointerEvents = 'auto';
        body.style.overflow = 'auto';
        body.removeAttribute('data-scroll-locked');
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
