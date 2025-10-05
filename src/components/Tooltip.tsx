"use client";

import React, { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  content: string;
  placement?: "top" | "bottom";
  delay?: number;
  offset?: number;
  forceVisible?: boolean;
  disableHover?: boolean;
};

export default function Tooltip({
  children,
  content,
  placement = "top",
  delay = 500,
  offset = 20,
  forceVisible = false,
  disableHover = false,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearDelayTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!disableHover) return;

    clearDelayTimeout();
    setVisible(false);
    setReady(false);
  }, [clearDelayTimeout, disableHover]);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    const left = triggerRect.left + window.scrollX + triggerRect.width / 2;

    if (placement === "top") {
      top = triggerRect.top + window.scrollY - tooltipRect.height - offset;
    } else {
      top = triggerRect.bottom + window.scrollY + offset;
    }

    setCoords({ top, left });
    setReady(true);
  }, [offset, placement]);

  const handleMouseEnter = () => {
    if (disableHover) return;
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = useCallback(() => {
    clearDelayTimeout();
    setVisible(false);
    setReady(false);
  }, [clearDelayTimeout]);

  const handleMouseLeave = () => {
    hideTooltip();
  };

  useEffect(() => {
    if ((visible || forceVisible) && mounted) {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [calculatePosition, forceVisible, mounted, visible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={disableHover ? undefined : handleMouseEnter}
        onMouseLeave={disableHover ? undefined : handleMouseLeave}
        onClick={hideTooltip}
        className="inline-flex items-center"
      >
        {children}
      </div>

      {mounted && (visible || forceVisible) && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            transform: "translateX(-50%)",
            zIndex: 9999,
            opacity: ready ? 1 : 0,
            pointerEvents: ready ? "auto" : "none",
            transition: "opacity 0.1s ease",
          }}
        >
          <div className="relative bg-[#2E3142] text-white text-[14px] font-medium px-3 h-[40px] flex items-center justify-center rounded-md shadow-md whitespace-nowrap">
            {content}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2E3142] rotate-45 ${
                placement === "top" ? "top-full mt-[-6px]" : "bottom-full mb-[-6px]"
              }`}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
