"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"

type TooltipSide = "right" | "left"

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

  const [overAnchor, setOverAnchor] = useState(false)
  const [overTip, setOverTip] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number; side: TooltipSide }>(() => ({
    top: 0,
    left: 0,
    side: "right",
  }))

  const open = overAnchor || overTip

  const GAP = 12
  const PAD = 8
  const WIDTH = 220

  const compute = () => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const viewportWidth = window.innerWidth

    let side: TooltipSide = "right"
    let left = rect.right + GAP
    if (left + WIDTH + PAD > viewportWidth) {
      side = "left"
      left = Math.max(PAD, rect.left - GAP - WIDTH)
    }
    const top = Math.round(rect.top + rect.height / 2)
    setPosition({ top, left, side })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    compute()

    const handleScroll = () => compute()
    const handleResize = () => compute()

    const handlePointerMove = (event: PointerEvent) => {
      const { clientX, clientY } = event
      const anchorRect = anchorRef.current?.getBoundingClientRect()
      const tipRect = tipRef.current?.getBoundingClientRect()

      const inAnchor = !!anchorRect &&
        clientX >= anchorRect.left &&
        clientX <= anchorRect.right &&
        clientY >= anchorRect.top &&
        clientY <= anchorRect.bottom

      const inTip = !!tipRect &&
        clientX >= tipRect.left &&
        clientX <= tipRect.right &&
        clientY >= tipRect.top &&
        clientY <= tipRect.bottom

      setOverAnchor(inAnchor)
      setOverTip(inTip)
    }

    const handlePointerDown = (event: PointerEvent) => {
      const anchor = anchorRef.current
      const tip = tipRef.current
      if (anchor && anchor.contains(event.target as Node)) return
      if (tip && tip.contains(event.target as Node)) return
      setOverAnchor(false)
      setOverTip(false)
    }

    const handleWindowBlur = () => {
      setOverAnchor(false)
      setOverTip(false)
    }

    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleResize)
    document.addEventListener("pointermove", handlePointerMove, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
    window.addEventListener("blur", handleWindowBlur)

    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("pointermove", handlePointerMove, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      window.removeEventListener("blur", handleWindowBlur)
    }
  }, [open])

  const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (open) {
        setOverAnchor(false)
        setOverTip(false)
      } else {
        setOverAnchor(true)
      }
    } else if (event.key === "Escape") {
      setOverAnchor(false)
      setOverTip(false)
    }
  }

  return (
    <>
      <span
        ref={anchorRef}
        className="relative inline-block group select-none"
        style={{ width: iconSize, height: iconSize }}
        onMouseEnter={() => setOverAnchor(true)}
        onMouseLeave={() => setOverAnchor(false)}
        onFocus={() => setOverAnchor(true)}
        onBlur={() => setOverAnchor(false)}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (open) {
            setOverAnchor(false)
            setOverTip(false)
          } else {
            setOverAnchor(true)
          }
        }}
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <Image
          src="/icons/info.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          className="block group-hover:opacity-0"
        />
        <Image
          src="/icons/info_hover.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
        />
      </span>

      {mounted && open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tipRef}
            className="fixed z-[10000] pointer-events-auto"
            style={{ top: position.top, left: position.left, transform: "translateY(-50%)" }}
            role="tooltip"
            onMouseEnter={() => setOverTip(true)}
            onMouseLeave={() => setOverTip(false)}
          >
            <div
              className="relative bg-[#2F3247] text-white text-[14px] leading-snug font-medium px-3 py-2 rounded-[8px] shadow-[0_5px_21px_0_rgba(93,100,148,0.15)] break-words"
              style={{ width: WIDTH }}
            >
              {message}
              {position.side === "right" ? (
                <span className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-r-[8px] border-r-[#2F3247]" />
              ) : (
                <span className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-l-[8px] border-l-[#2F3247]" />
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
