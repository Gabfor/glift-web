"use client"

import Image from "next/image"
import { createPortal } from "react-dom"
import clsx from "clsx"
import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import { useScrollLock } from "@/utils/scrollLock"

type ModalProps = PropsWithChildren<{
  open: boolean
  title: ReactNode
  onClose?: () => void
  closeDisabled?: boolean
  footer?: ReactNode
  footerWrapperClassName?: string
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
  footerWrapperClassName,
  closeLabel = "Fermer",
  className,
  contentClassName,
  titleClassName,
  showCloseButton = true,
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [closeHovered, setCloseHovered] = useState(false)
  const [showBottomGradient, setShowBottomGradient] = useState(false)
  const [showTopGradient, setShowTopGradient] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkScroll = useCallback(() => {
    const target = dialogRef.current
    if (!target) return
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 2
    const isAtTop = target.scrollTop < 2
    const hasScroll = target.scrollHeight > target.clientHeight

    setShowBottomGradient(hasScroll && !isAtBottom)
    setShowTopGradient(hasScroll && !isAtTop)
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

  useEffect(() => {
    if (!open) {
      setShowBottomGradient(false)
      setShowTopGradient(false)
      return
    }

    checkScroll()

    const target = dialogRef.current
    if (!target) return

    const rafId = requestAnimationFrame(checkScroll)

    const ro = new ResizeObserver(() => {
      checkScroll()
    })
    ro.observe(target)

    window.addEventListener("resize", checkScroll)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener("resize", checkScroll)
    }
  }, [open, checkScroll, children, footer])

  useScrollLock(open)

  if (!mounted || !open) {
    return null;
  }

  const handleOverlayClick = () => {
    if (closeDisabled) return;
    onClose?.();
  };

  const handleClose = () => {
    if (closeDisabled) return;
    onClose?.();
  };

  const closeIcon =
    closeHovered && !closeDisabled
      ? "/icons/close_hover.svg"
      : "/icons/close.svg";

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 modal-overlay-container z-[1000] flex items-center justify-center p-4 sm:p-6",
        className
      )}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="absolute inset-0 bg-[#2E3142]/60 animate-in fade-in duration-300 touch-none"
        onClick={handleOverlayClick}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      <div className="relative max-w-full">
        {/* Dégradé en haut quand on défile */}
        <div
          className={clsx(
            "absolute top-0 left-0 right-0 h-[28px] sm:h-[36px] bg-gradient-to-b from-white to-transparent pointer-events-none transition-opacity duration-200 z-20 rounded-t-[20px]",
            showTopGradient ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          ref={dialogRef}
          onScroll={checkScroll}
          className={clsx(
            "relative z-10 w-[564px] max-w-[92vw] modal-dialog-container overflow-y-auto no-scrollbar rounded-[20px] bg-white p-5 sm:p-8 shadow-glift-hover animate-in fade-in zoom-in-95 duration-300",
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
                "absolute right-4 top-4 z-30 h-6 w-6 transition-opacity",
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

          {footer && (
            <div className={clsx("mt-6", footerWrapperClassName)}>{footer}</div>
          )}
        </div>

        {/* Dégradé en bas quand le contenu est tronqué */}
        <div
          className={clsx(
            "absolute bottom-0 left-0 right-0 h-[28px] sm:h-[36px] bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-200 z-20 rounded-b-[20px]",
            showBottomGradient ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>,
    document.body
  )
}
