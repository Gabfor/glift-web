"use client";

import { useEffect, useRef } from "react";

export function useVisibilityRefetch(callback: () => void, minIntervalMs = 1000) {
  const lastCallRef = useRef(0);

  useEffect(() => {
    if (!callback) {
      return;
    }

    const invoke = (reason: string) => {
      const now = Date.now();
      if (now - lastCallRef.current < minIntervalMs) {
        console.log("[useVisibilityRefetch] throttled", { reason, minIntervalMs });
        return;
      }
      lastCallRef.current = now;
      console.log("[useVisibilityRefetch] trigger", { reason, minIntervalMs });
      callback();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        invoke("visibility");
      }
    };

    const handleFocus = () => {
      invoke("focus");
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [callback, minIntervalMs]);
}
