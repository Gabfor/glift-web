"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"

type Props = {
  message?: string
  iconSize?: number
}

export default function EmailInfoAdornment({
  message = "Pour des raisons techniques, votre email ne peut pas être modifié.",
  iconSize = 18,
}: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const [overAnchor, setOverAnchor] = useState(false)
  const [overTip, setOverTip] = useState(false)
  const open = overAnchor || overTip

  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; side: "right" | "left" }>(
    {
      top: 0,
      left: 0,
      side: "right",
    },
  )

  const GAP = 12
  const PAD = 8
  const WIDTH = 220

  const compute = () => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const tipW = WIDTH

    let side: "right" | "left" = "right"
    let left = r.right + GAP
    if (left + tipW + PAD > vw) {
      side = "left"
      left = Math.max(PAD, r.left - GAP - tipW)
    }
    const top = Math.round(r.top + r.height / 2)
    setPos({ top, left, side })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    compute()

    const onScroll = () => compute()
    const onResize = () => compute()

    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX
      const y = e.clientY
      const a = anchorRef.current?.getBoundingClientRect()
      const t = tipRef.current?.getBoundingClientRect()

      const inA = !!a && x >= a.left && x <= a.right && y >= a.top && y <= a.bottom
      const inT = !!t && x >= t.left && x <= t.right && y >= t.top && y <= t.bottom

      setOverAnchor(inA)
      setOverTip(inT)
    }

    const onDocDown = (e: PointerEvent) => {
      const a = anchorRef.current
      const t = tipRef.current
      if (a && a.contains(e.target as Node)) return
      if (t && t.contains(e.target as Node)) return
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
    document.addEventListener("pointerdown", onDocDown, true)
    window.addEventListener("blur", onWindowBlur)

    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("pointermove", onPointerMove, true)
      document.removeEventListener("pointerdown", onDocDown, true)
      window.removeEventListener("blur", onWindowBlur)
    }
  }, [open])

  const onKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (open) {
        setOverAnchor(false)
        setOverTip(false)
      } else {
        setOverAnchor(true)
      }
    } else if (e.key === "Escape") {
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
        aria-label="Plus d’informations sur l’email"
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
            style={{ top: pos.top, left: pos.left, transform: "translateY(-50%)" }}
            role="tooltip"
            onMouseEnter={() => setOverTip(true)}
            onMouseLeave={() => setOverTip(false)}
          >
            <div
              className="relative bg-[#2F3247] text-white text-[14px] leading-snug font-medium px-3 py-2 rounded-[8px] shadow-[0_5px_21px_0_rgba(93,100,148,0.15)] break-words"
              style={{ width: WIDTH }}
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
