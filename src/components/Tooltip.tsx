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
import clsx from "clsx";

export type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  placement?: "top" | "bottom";
  delay?: number;
  offset?: number;
  forceVisible?: boolean;
  disableHover?: boolean;
  asChild?: boolean;
  contentClassName?: string;
  arrowClassName?: string;
};

type TooltipChildProps = {
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
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
  contentClassName,
  arrowClassName,
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

    const verticalAdjustment = 5;

    if (placement === "top") {
      top = triggerRect.top + window.scrollY - tooltipRect.height - offset - verticalAdjustment;
    } else {
      top = triggerRect.bottom + window.scrollY + offset - verticalAdjustment;
    }

    setCoords({ top, left });
    setReady(true);
  }, [offset, placement]);

  const handleMouseEnter: React.MouseEventHandler<HTMLElement> = () => {
    if (disableHover) return;
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

  const handleMouseLeave: React.MouseEventHandler<HTMLElement> = () => {
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
        <div
          className={clsx(
            "relative flex min-h-[40px] items-center justify-center rounded-md bg-[#2E3142] px-3 text-[14px] font-medium text-white shadow-md",
            "whitespace-nowrap",
            contentClassName,
          )}
        >
          {content}
          <div
            className={clsx(
              "absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#2E3142]",
              placement === "top" ? "top-full mt-[-6px]" : "bottom-full mb-[-6px]",
              arrowClassName,
            )}
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
      onMouseEnter: disableHover
        ? child.props.onMouseEnter
        : combineHandlers(child.props.onMouseEnter, handleMouseEnter),
      onMouseLeave: disableHover
        ? child.props.onMouseLeave
        : combineHandlers(child.props.onMouseLeave, handleMouseLeave),
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
        onMouseEnter={disableHover ? undefined : handleMouseEnter}
        onMouseLeave={disableHover ? undefined : handleMouseLeave}
        onClick={hideTooltip}
        className="inline-flex items-center"
      >
        {children}
      </div>
      {mountTooltip}
    </>
  );
}
