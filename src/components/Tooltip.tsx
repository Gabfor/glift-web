"use client";

import React, {
  ReactElement,
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

export type TooltipProps = {
  children: ReactNode;
  content: string;
  placement?: "top" | "bottom";
  delay?: number;
  offset?: number;
  forceVisible?: boolean;
  disableHover?: boolean;
  asChild?: boolean;
};

type TooltipChildProps = {
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onPointerEnter?: React.PointerEventHandler<HTMLElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLElement>;
  onPointerOver?: React.PointerEventHandler<HTMLElement>;
  onPointerOut?: React.PointerEventHandler<HTMLElement>;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

type TooltipChildElement = ReactElement<TooltipChildProps> & {
  ref?: React.Ref<HTMLElement> | string;
};

export default function Tooltip({
  children,
  content,
  placement = "top",
  delay = 500,
  offset = 20,
  forceVisible = false,
  disableHover = false,
  asChild = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setTriggerRef = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

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

  const handlePointerOver: React.PointerEventHandler<HTMLElement> = (event) => {
    if (disableHover) return;
    if (triggerRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }

    clearDelayTimeout();
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = useCallback((event?: React.SyntheticEvent) => {
    if (event) {
      event.stopPropagation();
    }
    clearDelayTimeout();
    setVisible(false);
    setReady(false);
  }, [clearDelayTimeout]);

  const handlePointerOut: React.PointerEventHandler<HTMLElement> = (event) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && triggerRef.current?.contains(nextTarget)) {
      return;
    }

    hideTooltip();
  };

  useEffect(() => {
    if ((visible || forceVisible) && mounted) {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [calculatePosition, forceVisible, mounted, visible]);

  const mountTooltip =
    mounted && (visible || forceVisible) &&
    createPortal(
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
      document.body,
    );

  const combineHandlers = <T extends React.SyntheticEvent>(
    ...handlers: Array<((event: T) => void) | undefined>
  ) =>
    (event: T) => {
      handlers.forEach((handler) => {
        if (handler) {
          handler(event);
        }
      });
    };

  const mergeRefs = <T,>(
    ...refs: Array<React.Ref<T> | null | undefined>
  ): React.RefCallback<T> => {
    return (value) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === "function") {
          ref(value);
        } else {
          (ref as React.MutableRefObject<T | null>).current = value;
        }
      });
    };
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as TooltipChildElement;
    const existingRef =
      typeof child.ref === "string"
        ? undefined
        : child.ref;
    const mergedRef = mergeRefs<HTMLElement>(existingRef, setTriggerRef);

    const childProps: TooltipChildProps & { ref: React.RefCallback<HTMLElement> } = {
      ref: mergedRef,
      onMouseEnter: child.props.onMouseEnter,
      onMouseLeave: child.props.onMouseLeave,
      onPointerEnter: child.props.onPointerEnter,
      onPointerLeave: child.props.onPointerLeave,
      onPointerOver: disableHover
        ? child.props.onPointerOver
        : combineHandlers(child.props.onPointerOver, handlePointerOver),
      onPointerOut: disableHover
        ? child.props.onPointerOut
        : combineHandlers(child.props.onPointerOut, handlePointerOut),
      onClick: combineHandlers(child.props.onClick, hideTooltip),
    };

    return (
      <>
        {React.cloneElement(child, childProps)}
        {mountTooltip}
      </>
    );
  }

  return (
    <>
      <div
        ref={setTriggerRef}
        onPointerOver={disableHover ? undefined : handlePointerOver}
        onPointerOut={disableHover ? undefined : handlePointerOut}
        onClick={hideTooltip}
        className="inline-flex items-center"
      >
        {children}
      </div>
      {mountTooltip}
    </>
  );
}
