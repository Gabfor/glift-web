"use client";

import React, {
  ReactElement,
  useState,
  useRef,
  useEffect,
  cloneElement,
  MouseEvent,
  FocusEvent,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  /** Enfant unique: un élément DOM (ex: <button />) ou un composant qui accepte un ref vers un HTMLElement */
  children: ReactElement<any>;
  content: string;
  placement?: "top" | "bottom";
  delay?: number;
  offset?: number;
  offsetX?: number;
  forceVisible?: boolean;
  disableHover?: boolean;
};

export default function Tooltip({
  children,
  content,
  placement = "top",
  delay = 500,
  offset = 20,
  offsetX = 0,
  forceVisible = false,
  disableHover = false,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const left = triggerRect.left + window.scrollX + triggerRect.width / 2 + offsetX;
    const top =
      placement === "top"
        ? triggerRect.top + window.scrollY - tooltipRect.height - offset
        : triggerRect.bottom + window.scrollY + offset;

    setCoords({ top, left });
    setReady(true);
  };

  const handleEnter = (e: MouseEvent | FocusEvent) => {
    // relayer les handlers existants de l'enfant s'ils existent
    (children.props as any).onMouseEnter?.(e);
    if (disableHover) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const handleLeave = (e: MouseEvent | FocusEvent) => {
    (children.props as any).onMouseLeave?.(e);
    if (disableHover) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // on laisse la possibilité de passer sur le tooltip (il garde ouvert sur onMouseEnter)
    setTimeout(() => {
      setVisible(false);
      setReady(false);
    }, 0);
  };

  // fusionne notre ref avec celle éventuelle de l'enfant
  const mergedRef = (node: HTMLElement | null) => {
    triggerRef.current = node;
    const childRef = (children as any).ref;
    if (!childRef) return;
    if (typeof childRef === "function") {
      childRef(node);
    } else if (typeof childRef === "object") {
      (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  useEffect(() => {
    if ((visible || forceVisible) && mounted) {
      requestAnimationFrame(calculatePosition);
    }
    // re-calc si contenu/placement/offset changent
  }, [visible, forceVisible, mounted, placement, offset, content]);

  // Repositionner pendant scroll/resize
  useEffect(() => {
    if (!(visible || forceVisible)) return;
    const onMove = () => requestAnimationFrame(calculatePosition);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [visible, forceVisible]);

  // Injecte ref + handlers directement dans l'enfant (typage assoupli côté props)
  const child = cloneElement(children as ReactElement<any>, {
    ref: mergedRef as any,
    onMouseEnter: (e: MouseEvent) => handleEnter(e),
    onMouseLeave: (e: MouseEvent) => handleLeave(e),
    onFocus: (e: FocusEvent) => {
      (children.props as any).onFocus?.(e);
      if (!disableHover) {
        setVisible(true);
        requestAnimationFrame(calculatePosition);
      }
    },
    onBlur: (e: FocusEvent) => {
      (children.props as any).onBlur?.(e);
      setVisible(false);
      setReady(false);
    },
  } as any);

  return (
    <>
      {child}

      {mounted && (visible || forceVisible) &&
        createPortal(
          <div
            ref={(n) => {
              tooltipRef.current = n;
            }}
            role="tooltip"
            onMouseEnter={() => setVisible(true)} // garde ouvert si on survole le tooltip
            onMouseLeave={() => {
              setVisible(false);
              setReady(false);
            }}
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
