"use client"

import clsx from "clsx"
import { ReactNode } from "react"
import { usePathname } from "next/navigation"

type ModalMessageVariant = "warning" | "info" | "success" | "error"

const VARIANT_STYLES: Record<ModalMessageVariant, {
  background: string
  titleColor: string
  textColor: string
  barColor: string
}> = {
  warning: {
    background: "#FFE3E3",
    titleColor: "#BA2524",
    textColor: "#EF4F4E",
    barColor: "#EF4F4E",
  },
  error: {
    background: "#FFF1F1",
    titleColor: "#BA2524",
    textColor: "#EF4F4E",
    barColor: "#EF4F4E",
  },
  info: {
    background: "#F4F5FE",
    titleColor: "#7069FA",
    textColor: "#A1A5FD",
    barColor: "#A1A5FD",
  },
  success: {
    background: "#E3F9E5",
    titleColor: "#207227",
    textColor: "#57AE5B",
    barColor: "#57AE5B",
  },
}

interface ModalMessageProps {
  variant: ModalMessageVariant
  title: ReactNode
  description?: ReactNode
  className?: string
  onClose?: () => void
}

export default function ModalMessage({
  variant,
  title,
  description,
  className,
  onClose,
}: ModalMessageProps) {
  const pathname = usePathname()
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const isPageAdmin =
    pathname?.startsWith("/admin") ||
    hostname.startsWith("admin.") ||
    hostname.includes("admin") ||
    pathname?.startsWith("/program") ||
    pathname?.startsWith("/program-store") ||
    pathname?.startsWith("/offer-shop") ||
    pathname?.startsWith("/content-blog") ||
    pathname?.startsWith("/help") ||
    pathname?.startsWith("/users") ||
    pathname?.startsWith("/create-") ||
    pathname?.startsWith("/slider") ||
    pathname?.startsWith("/legal") ||
    pathname?.startsWith("/administrateurs") ||
    pathname?.startsWith("/auteurs") ||
    pathname?.startsWith("/settings")

  const baseStyles = VARIANT_STYLES[variant]
  const styles = isPageAdmin && variant === "info"
    ? {
        ...baseStyles,
        titleColor: "#3A416F",
        textColor: "#5D6494",
        barColor: "#5D6494",
      }
    : baseStyles

  return (
    <div
      className={clsx(
        "w-full max-w-[564px] rounded-br-[5px] rounded-tr-[5px] border-l-[3px] px-4 py-3 text-left",
        className
      )}
      style={{
        backgroundColor: styles.background,
        borderLeftColor: styles.barColor,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-bold" style={{ color: styles.titleColor }}>
            {title}
          </div>
          {description ? (
            <div className="text-[12px] font-semibold mt-1" style={{ color: styles.textColor }}>
              {description}
            </div>
          ) : null}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fermer"
          >
            <img
              src="/icons/close.svg"
              alt=""
              className="w-3 h-3"
              style={{ filter: variant === 'warning' || variant === 'error' ? 'invert(23%) sepia(52%) saturate(3061%) hue-rotate(338deg) brightness(87%) contrast(92%)' : undefined }}
            />
          </button>
        )}
      </div>
    </div>
  )
}
