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

import Spinner from "@/components/ui/Spinner";

type CTAElement = HTMLButtonElement | HTMLAnchorElement;

type BaseProps = {
  children: ReactNode;
  href?: string;
  variant?: "active" | "inactive" | "danger" | "secondary";
  loading?: boolean;
  loadingText?: string;
  keepWidthWhileLoading?: boolean;
  disableAutoLoading?: boolean;
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
      disableAutoLoading = false,
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
          if (!isControlled && !disableAutoLoading) {
            setInternalLoading(true);
          }
          try {
            await result;
          } finally {
            if (
              (!shouldNavigate || event.defaultPrevented) &&
              !isControlled &&
              !disableAutoLoading
            ) {
              setInternalLoading(false);
            }
          }
        }

        if (shouldNavigate) {
          if (!isControlled && !disableAutoLoading) {
            setInternalLoading(true);
          }
          router.push(href!);
        }
      },
      [disableAutoLoading, href, isControlled, router, target]
    );

    const handleClick = useCallback(
      (event: MouseEvent<CTAElement>) => {
        if (disabled || effectiveLoading) {
          event.preventDefault();
          return;
        }

        if (!disableAutoLoading && keepWidthWhileLoading && elementRef.current) {
          const currentWidth = elementRef.current.getBoundingClientRect().width;
          setStoredWidth(currentWidth);
        }

        const result = onClick?.(event);
        void handleAsyncResult(result, event);
      },
      [
        disableAutoLoading,
        disabled,
        effectiveLoading,
        handleAsyncResult,
        keepWidthWhileLoading,
        onClick,
      ]
    );

    const isDisabledOrLoading = disabled || effectiveLoading;
    const resolvedVariant = isDisabledOrLoading ? "inactive" : variant;

    const baseClasses = clsx(
      "inline-flex items-center justify-center gap-2 h-[44px] px-[30px] rounded-full font-semibold text-[16px] whitespace-nowrap",
      "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      resolvedVariant === "active" &&
      "bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] focus-visible:ring-[var(--color-brand-primary)]",
      resolvedVariant === "inactive" &&
      "bg-[var(--color-surface-muted)] text-[var(--color-border-soft)] hover:bg-[var(--color-surface-subtle)] focus-visible:ring-[var(--color-border-soft)]",
      resolvedVariant === "danger" &&
      "bg-[var(--color-accent-danger)] text-white hover:bg-[var(--color-accent-danger-hover)] focus-visible:ring-[var(--color-accent-danger)]",
      resolvedVariant === "secondary" &&
      "border border-[#3A416F] bg-transparent text-[#3A416F] hover:bg-[#3A416F] hover:text-white focus-visible:ring-[#3A416F]",
      isDisabledOrLoading && "cursor-not-allowed opacity-100",
      className
    );

    const content = effectiveLoading ? (
      <span className="inline-flex items-center gap-2">
        <Spinner
          size="sm"
          ariaLabel={typeof loadingText === "string" ? loadingText : undefined}
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
          aria-disabled={isDisabledOrLoading}
          aria-busy={effectiveLoading || undefined}
          tabIndex={isDisabledOrLoading ? -1 : rest.tabIndex}
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
        disabled={isDisabledOrLoading}
        onClick={handleClick as unknown as (event: MouseEvent<HTMLButtonElement>) => void}
        className={baseClasses}
        aria-busy={effectiveLoading || undefined}
        style={computedStyle}
      >
        {content}
      </button>
    );
  }
);

CTAButton.displayName = "CTAButton";

export default CTAButton;
