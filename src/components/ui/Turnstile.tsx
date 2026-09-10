"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const DUMMY_SITE_KEY = "1x00000000000000000000AA"; // Cloudflare dummy sitekey that always passes

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact" | "invisible";
          action?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      execute: (container?: HTMLElement | string, params?: any) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileRef {
  reset: () => void;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  className?: string;
  action?: string;
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(function Turnstile(
  { onVerify, onError, onExpire, className, action = "contact-form" },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || DUMMY_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.error("Failed to reset Turnstile widget:", e);
        }
      }
    },
  }));

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) {
              onVerify(token);
            }
          },
          "error-callback": (code?: string) => {
            if (isMounted && onError) {
              onError(code);
            }
          },
          "expired-callback": () => {
            if (isMounted && onExpire) {
              onExpire();
            }
          },
          size: "invisible",
          action,
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Error rendering Turnstile:", err);
      }
    };

    // Check if script is already present
    const SCRIPT_ID = "cf-turnstile-script";
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener("load", renderWidget);
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, action]);

  return <div ref={containerRef} className={className} />;
});

export default Turnstile;
