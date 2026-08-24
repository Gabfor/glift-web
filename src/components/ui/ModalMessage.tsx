"use client"

import clsx from "clsx"
import { ReactNode } from "react"

type ModalMessageVariant = "warning" | "info" | "success" | "error"

const VARIANT_CONFIG: Record<ModalMessageVariant, {
  background: string
  titleColor: string
  textColor: string
  iconSrc: string
}> = {
  success: {
    background: "#E6F7F2",
    titleColor: "#006646",
    textColor: "#00A370",
    iconSrc: "/icons/message_succes.svg",
  },
  error: {
    background: "#FDEDEE",
    titleColor: "#BB1111",
    textColor: "#EA1F1F",
    iconSrc: "/icons/message_erreur.svg",
  },
  warning: {
    background: "#FDEDEE",
    titleColor: "#BB1111",
    textColor: "#EA1F1F",
    iconSrc: "/icons/message_erreur.svg",
  },
  info: {
    background: "#F4F5FE",
    titleColor: "#6660E4",
    textColor: "#7069FA",
    iconSrc: "/icons/message_info.svg",
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
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.info

  return (
    <div
      className={clsx(
        "relative w-full max-w-[564px] rounded-[5px] px-[20px] py-[10px] text-left",
        className
      )}
      style={{
        backgroundColor: config.background,
      }}
    >
      {/* Icône débordant de 5px en haut et à gauche */}
      <img
        src={config.iconSrc}
        alt=""
        aria-hidden="true"
        className="absolute -top-[5px] -left-[5px] w-[20px] h-[20px] pointer-events-none select-none z-10"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <div
            className="text-[12px] font-bold leading-normal"
            style={{ color: config.titleColor }}
          >
            {title}
          </div>
          {description ? (
            <div
              className="text-[12px] font-semibold leading-relaxed mt-0.5"
              style={{ color: config.textColor }}
            >
              {description}
            </div>
          ) : null}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Fermer"
          >
            <img
              src="/icons/close.svg"
              alt=""
              className="w-3 h-3"
            />
          </button>
        )}
      </div>
    </div>
  )
}
