"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"

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
    const viewportWidth = window.innerWidth

    // 1. Try placing on the right (tooltip on the right with arrow on the left)
    if (rect.right + GAP + WIDTH + PAD <= viewportWidth) {
      const side: TooltipSide = "right"
      const left = Math.round(rect.right + GAP)
      const top = Math.round(rect.top + rect.height / 2)
      setPosition({ top, left, side })
      return
    }

    // 2. Try placing on the left (tooltip on the left with arrow on the right)
    if (rect.left - GAP - WIDTH - PAD >= 0) {
      const side: TooltipSide = "left"
      const left = Math.round(rect.left - GAP - WIDTH)
      const top = Math.round(rect.top + rect.height / 2)
      setPosition({ top, left, side })
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
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    compute()

    const handleScroll = () => compute()
    const handleResize = () => compute()

    const handlePointerDown = (event: PointerEvent) => {
      const anchor = anchorRef.current
      const tip = tipRef.current
      const target = event.target as Node
      if (anchor && anchor.contains(target)) return
      if (tip && tip.contains(target)) return
      setIsOpen(false)
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
    setIsOpen(true)
  }

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setIsOpen((prev) => !prev)
    } else if (event.key === "Escape") {
      setIsOpen(false)
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
          setIsOpen((prev) => !prev)
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

      {mounted && isOpen && typeof document !== "undefined" &&
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
              className="relative bg-[#2F3247] text-white text-[14px] leading-snug font-medium px-3 py-2 rounded-[8px] shadow-[0_5px_21px_0_rgba(93,100,148,0.15)] break-words"
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
