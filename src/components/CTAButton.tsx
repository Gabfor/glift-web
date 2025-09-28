"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type CTAElement = HTMLButtonElement | HTMLAnchorElement;

type BaseProps = {
  children: ReactNode;
  href?: string;
  variant?: "active" | "inactive";
  loading?: boolean;
  loadingText?: string;
  keepWidthWhileLoading?: boolean;
  onClick?: (event: MouseEvent<CTAElement>) => void | Promise<void>;
};

type CTAButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "onClick" | "href">;

const CTAButton = forwardRef<CTAElement, CTAButtonProps>(
  (
    {
      children,
      className,
      disabled,
      href,
      loading,
      loadingText = "En cours...",
      keepWidthWhileLoading = true,
      onClick,
      type = "button",
      variant = "active",
      target,
      rel,
      style,
      ...rest
    },
    ref
  ) => {
    const router = useRouter();
    const elementRef = useRef<CTAElement>(null);
    useImperativeHandle(ref, () => elementRef.current as CTAElement);

    const isControlled = loading !== undefined;
    const [internalLoading, setInternalLoading] = useState(false);
    const [storedWidth, setStoredWidth] = useState<number>();
    const effectiveLoading = loading ?? internalLoading;

    useEffect(() => {
      if (!keepWidthWhileLoading) return;
      const element = elementRef.current;
      if (effectiveLoading) {
        if (element) {
          const currentWidth = element.getBoundingClientRect().width;
          setStoredWidth(currentWidth);
        }
      } else if (storedWidth !== undefined) {
        setStoredWidth(undefined);
      }
    }, [effectiveLoading, keepWidthWhileLoading, storedWidth]);

    const handleAsyncResult = useCallback(
      async (result: void | Promise<void>, event: MouseEvent<CTAElement>) => {
        const shouldNavigate =
          Boolean(href) &&
          !event.defaultPrevented &&
          (!target || target === "_self");

        if (result instanceof Promise) {
          if (!isControlled) {
            setInternalLoading(true);
          }
          try {
            await result;
          } finally {
            if ((!shouldNavigate || event.defaultPrevented) && !isControlled) {
              setInternalLoading(false);
            }
          }
        }

        if (shouldNavigate) {
          if (!isControlled) {
            setInternalLoading(true);
          }
          router.push(href!);
        }
      },
      [href, isControlled, router, target]
    );

    const handleClick = useCallback(
      (event: MouseEvent<CTAElement>) => {
        if (disabled || effectiveLoading) {
          event.preventDefault();
          return;
        }

        if (keepWidthWhileLoading && elementRef.current) {
          const currentWidth = elementRef.current.getBoundingClientRect().width;
          setStoredWidth(currentWidth);
        }

        const result = onClick?.(event);
        void handleAsyncResult(result, event);
      },
      [disabled, effectiveLoading, handleAsyncResult, keepWidthWhileLoading, onClick]
    );

    const baseClasses = clsx(
      "inline-flex items-center justify-center gap-2 h-[44px] px-[15px] rounded-full font-semibold text-[16px] whitespace-nowrap",
      "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      variant === "active" &&
        "bg-[#7069FA] text-white hover:bg-[#6660E4] focus-visible:ring-[#7069FA]",
      variant === "inactive" &&
        "bg-[#F2F1F6] text-[#D7D4DC] hover:bg-[#ECE9F1] focus-visible:ring-[#D7D4DC]",
      (disabled || effectiveLoading) &&
        "cursor-not-allowed opacity-100",
      className
    );

    const content = effectiveLoading ? (
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        />
        <span>{loadingText}</span>
      </span>
    ) : (
      children
    );

    const computedStyle = storedWidth
      ? { width: `${storedWidth}px`, ...style }
      : style;

    if (href) {
      return (
        <Link
          {...rest}
          href={href}
          ref={elementRef as React.MutableRefObject<HTMLAnchorElement>}
          onClick={handleClick as unknown as (event: MouseEvent<HTMLAnchorElement>) => void}
          className={baseClasses}
          aria-disabled={disabled || effectiveLoading}
          tabIndex={disabled || effectiveLoading ? -1 : rest.tabIndex}
          target={target}
          rel={rel}
          style={computedStyle}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        {...rest}
        ref={elementRef as React.MutableRefObject<HTMLButtonElement>}
        type={type as ButtonHTMLAttributes<HTMLButtonElement>["type"]}
        disabled={disabled || effectiveLoading}
        onClick={handleClick as unknown as (event: MouseEvent<HTMLButtonElement>) => void}
        className={baseClasses}
        style={computedStyle}
      >
        {content}
      </button>
    );
  }
);

CTAButton.displayName = "CTAButton";

export default CTAButton;
