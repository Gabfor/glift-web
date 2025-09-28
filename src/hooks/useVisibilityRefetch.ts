"use client";

import { useEffect } from "react";
import { createScopedLogger } from "@/utils/logger";

type Options = {
  scope?: string;
  triggerOnMount?: boolean;
};

export function useVisibilityRefetch(
  callback: () => void,
  { scope = "VisibilityRefetch", triggerOnMount = false }: Options = {}
) {
  useEffect(() => {
    if (!callback) {
      return;
    }

    const logger = createScopedLogger(scope);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        logger.debug("Tab became visible → invoking callback");
        callback();
      }
    };

    const handleFocus = () => {
      logger.debug("Window focus → invoking callback");
      callback();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    if (triggerOnMount) {
      logger.debug("Triggering callback on mount");
      callback();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [callback, scope, triggerOnMount]);
}
