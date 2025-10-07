"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"

type Props = {
  message: string
  iconSrc?: string
  iconHoverSrc?: string
  iconSize?: number
  gapPx?: number
  widthPx?: number
  ariaLabel?: string
}

export default function InfoAdornment({
  message,
  iconSrc = "/icons/info_blue.svg",
  iconHoverSrc = "/icons/info_blue_hover.svg",
  iconSize = 18,
  gapPx = 12,
  widthPx = 220,
  ariaLabel = "Plus d’informations",
}: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const [overAnchor, setOverAnchor] = useState(false)
  const [overTip, setOverTip] = useState(false)
  const open = overAnchor || overTip

  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; side: "right" | "left" }>(() => ({
    top: 0,
    left: 0,
    side: "right",
  }))

  const EDGE_PADDING = 8

  const compute = useCallback(() => {
    const el = anchorRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const tipWidth = widthPx

    let side: "right" | "left" = "right"
    let left = rect.right + gapPx
    if (left + tipWidth + EDGE_PADDING > vw) {
      side = "left"
      left = Math.max(EDGE_PADDING, rect.left - gapPx - tipWidth)
    }

    const top = Math.round(rect.top + rect.height / 2)
    setPos({ top, left, side })
  }, [gapPx, widthPx])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    compute()

    const onScroll = () => compute()
    const onResize = () => compute()

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX
      const y = event.clientY
      const anchorRect = anchorRef.current?.getBoundingClientRect()
      const tipRect = tipRef.current?.getBoundingClientRect()

      const inAnchor = !!anchorRect && x >= anchorRect.left && x <= anchorRect.right && y >= anchorRect.top && y <= anchorRect.bottom
      const inTip = !!tipRect && x >= tipRect.left && x <= tipRect.right && y >= tipRect.top && y <= tipRect.bottom

      setOverAnchor(inAnchor)
      setOverTip(inTip)
    }

    const onPointerDown = (event: PointerEvent) => {
      const anchor = anchorRef.current
      const tip = tipRef.current
      if (anchor && anchor.contains(event.target as Node)) return
      if (tip && tip.contains(event.target as Node)) return
      setOverAnchor(false)
      setOverTip(false)
    }

    const onWindowBlur = () => {
      setOverAnchor(false)
      setOverTip(false)
    }

    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    document.addEventListener("pointermove", onPointerMove, true)
    document.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("blur", onWindowBlur)

    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("pointermove", onPointerMove, true)
      document.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("blur", onWindowBlur)
    }
  }, [compute, open])

  const onKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
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
        className="relative inline-block select-none group"
        style={{ width: iconSize, height: iconSize }}
        onMouseEnter={() => setOverAnchor(true)}
        onMouseLeave={() => setOverAnchor(false)}
        onFocus={() => setOverAnchor(true)}
        onBlur={() => setOverAnchor(false)}
        onKeyDown={onKeyDown}
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
          src={iconSrc}
          alt=""
          width={iconSize}
          height={iconSize}
          className="block transition-opacity duration-150 ease-in-out group-hover:opacity-0"
          style={{ opacity: open ? 0 : undefined }}
        />
        <Image
          src={iconHoverSrc}
          alt=""
          width={iconSize}
          height={iconSize}
          className="absolute inset-0 opacity-0 transition-opacity duration-150 ease-in-out group-hover:opacity-100"
          style={{ opacity: open ? 1 : undefined }}
        />
      </span>

      {mounted && open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tipRef}
            className="fixed z-[10000] pointer-events-auto"
            style={{ top: pos.top, left: pos.left, transform: "translateY(-50%)" }}
            role="tooltip"
            onMouseEnter={() => setOverTip(true)}
            onMouseLeave={() => setOverTip(false)}
          >
            <div
              className="relative bg-[#2F3247] text-white text-[14px] leading-snug font-medium px-3 py-2 rounded-[8px] shadow-[0_5px_21px_0_rgba(93,100,148,0.15)] break-words"
              style={{ width: widthPx }}
            >
              {message}
              {pos.side === "right" ? (
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

