"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import clsx from "clsx"

type TooltipSide = "right" | "left" | "bottom"

type Props = {
  message: string
  iconSize?: number
  ariaLabel: string
}

export default function InfoTooltipAdornment({
  message,
  iconSize = 18,
  ariaLabel,
}: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    side: TooltipSide
    arrowLeft?: number
  }>(() => ({
    top: 0,
    left: 0,
    side: "right",
  }))

  const GAP = 12
  const PAD = 8
  const WIDTH = 220

  const compute = () => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    const viewportWidth = window.innerWidth

    // 1. Try placing on the right (tooltip on the right with arrow on the left)
    if (rect.right + GAP + WIDTH + PAD <= viewportWidth) {
      const side: TooltipSide = "right"
      const left = Math.round(rect.right + GAP)
      const top = Math.round(rect.top + rect.height / 2)
      setPosition({ top, left, side })
      setReady(true)
      return
    }

    // 2. Try placing on the left (tooltip on the left with arrow on the right)
    if (rect.left - GAP - WIDTH - PAD >= 0) {
      const side: TooltipSide = "left"
      const left = Math.round(rect.left - GAP - WIDTH)
      const top = Math.round(rect.top + rect.height / 2)
      setPosition({ top, left, side })
      setReady(true)
      return
    }

    // 3. Fallback: position below with arrow pointing up
    const side: TooltipSide = "bottom"
    const centerX = rect.left + rect.width / 2
    let left = centerX - WIDTH / 2
    left = Math.max(PAD, Math.min(viewportWidth - WIDTH - PAD, left))
    const top = Math.round(rect.bottom + GAP)
    const arrowLeft = Math.max(10, Math.min(WIDTH - 26, centerX - left - 8))
    setPosition({ top, left, side, arrowLeft })
    setReady(true)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) {
      setReady(false)
      return
    }

    compute()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleScroll = () => compute()
    const handleResize = () => compute()

    const handlePointerDown = (event: PointerEvent) => {
      const anchor = anchorRef.current
      const tip = tipRef.current
      const target = event.target as Node
      if (anchor && anchor.contains(target)) return
      if (tip && tip.contains(target)) return
      setIsOpen(false)
      setReady(false)
    }

    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleResize)
    document.addEventListener("pointerdown", handlePointerDown, true)

    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [isOpen])

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    compute()
    setIsOpen(true)
  }

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setReady(false)
    }, 150)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!isOpen) {
        compute()
        setIsOpen(true)
      } else {
        setIsOpen(false)
        setReady(false)
      }
    } else if (event.key === "Escape") {
      setIsOpen(false)
      setReady(false)
    }
  }

  return (
    <>
      <span
        ref={anchorRef}
        className="relative inline-block group select-none cursor-pointer"
        style={{ width: iconSize, height: iconSize }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!isOpen) {
            compute()
            setIsOpen(true)
          } else {
            setIsOpen(false)
            setReady(false)
          }
        }}
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <Image
          src="/icons/info.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          className="pointer-events-none block [@media(hover:hover)]:group-hover:opacity-0"
        />
        <Image
          src="/icons/info_hover.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          className="pointer-events-none absolute inset-0 opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        />
      </span>

      {mounted && isOpen && ready && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tipRef}
            className="fixed z-[10000] pointer-events-auto"
            style={{
              top: position.top,
              left: position.left,
              transform: position.side === "bottom" ? "none" : "translateY(-50%)",
            }}
            role="tooltip"
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <div
              className={clsx(
                "relative bg-[#2F3247] text-white text-[14px] leading-snug font-medium px-3 py-2 rounded-[8px] shadow-glift-hover break-words",
                "animate-in fade-in duration-150",
                position.side === "bottom" && "slide-in-from-top-1",
                position.side === "right" && "slide-in-from-left-1",
                position.side === "left" && "slide-in-from-right-1"
              )}
              style={{ width: WIDTH }}
            >
              {message}
              {position.side === "right" && (
                <span className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-r-[8px] border-r-[#2F3247]" />
              )}
              {position.side === "left" && (
                <span className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-l-[8px] border-l-[#2F3247]" />
              )}
              {position.side === "bottom" && (
                <span
                  className="absolute top-[-8px] w-0 h-0 border-x-[8px] border-x-transparent border-b-[8px] border-b-[#2F3247]"
                  style={{ left: position.arrowLeft ?? 16 }}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
