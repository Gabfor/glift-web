"use client"

import Image from "next/image"
import { createPortal } from "react-dom"
import clsx from "clsx"
import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useId,
  useState,
} from "react"

type ModalProps = PropsWithChildren<{
  open: boolean
  title: string
  onClose?: () => void
  closeDisabled?: boolean
  footer?: ReactNode
  closeLabel?: string
  className?: string
  contentClassName?: string
  titleClassName?: string
  showCloseButton?: boolean
}>

export default function Modal({
  open,
  title,
  onClose,
  closeDisabled = false,
  footer,
  closeLabel = "Fermer",
  className,
  contentClassName,
  titleClassName,
  showCloseButton = true,
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [closeHovered, setCloseHovered] = useState(false)
  const labelId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || !onClose || closeDisabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose, closeDisabled])

  if (!mounted || !open) {
    return null
  }

  const handleOverlayClick = () => {
    if (closeDisabled) return
    onClose?.()
  }

  const handleClose = () => {
    if (closeDisabled) return
    onClose?.()
  }

  const closeIcon =
    closeHovered && !closeDisabled
      ? "/icons/close_hover.svg"
      : "/icons/close.svg"

  return createPortal(
    <div className={clsx("fixed inset-0 z-50 flex items-center justify-center", className)}>
      <div
        className="absolute inset-0 bg-[#2E3142]/60"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={clsx(
          "relative z-10 w-[564px] max-w-[92vw] rounded-[5px] bg-white p-8 shadow-lg",
          contentClassName
        )}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            className={clsx(
              "absolute right-4 top-4 h-6 w-6 transition-opacity",
              closeDisabled && "cursor-not-allowed opacity-60"
            )}
            aria-label={closeLabel}
            aria-disabled={closeDisabled}
            disabled={closeDisabled}
          >
            <Image
              src={closeIcon}
              alt="Fermer"
              width={24}
              height={24}
              className="h-full w-full"
            />
          </button>
        )}

        <h2
          id={labelId}
          className={clsx(
            "mb-6 text-center text-[22px] font-bold text-[#3A416F]",
            titleClassName
          )}
        >
          {title}
        </h2>

        {children}

        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
