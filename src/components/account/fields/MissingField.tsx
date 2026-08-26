'use client'

import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type MissingFieldProps = {
  show: boolean
  children: ReactNode
  /** largeur visuelle du champ (pour caler le wrapper) */
  widthPx?: number
  /** taille de l'icône */
  iconSize?: number
  /** écart entre le bord du champ et l'icône (px) */
  gapPx?: number
  /** ID optionnel pour scroller vers ce champ */
  id?: string
}

/**
 * Place une icône "missing" 10px à gauche du contrôle principal (input/select/toggle)
 * sans impacter la mise en page. Aucun changement requis dans les composants de champ.
 */
export default function MissingField({
  show,
  children,
  widthPx = 368,
  iconSize = 24,
  gapPx = 10,
  id,
}: MissingFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [topPx, setTopPx] = useState<number | null>(null)
  const [labelOffset, setLabelOffset] = useState<{ top: number; left: number } | null>(null)

  const compute = () => {
    const root = wrapRef.current
    if (!root) return

    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(
        'input, select, textarea, button, [role="button"], [data-control], [data-field-root], div, span'
      )
    )

    let best: HTMLElement | null = null
    for (const el of candidates) {
      const rect = el.getBoundingClientRect()
      const { height, width } = rect
      if (height >= 40 && width >= 120) {
        best = el
        break
      }
    }

    const rWrap = root.getBoundingClientRect()
    const centerWrap = rWrap.top + rWrap.height / 2

    if (!best) {
      setTopPx(centerWrap - rWrap.top)
    } else {
      const rBest = best.getBoundingClientRect()
      const centerBest = rBest.top + rBest.height / 2
      setTopPx(centerBest - rWrap.top)
    }

    const labelEl = root.querySelector('label')
    if (labelEl) {
      let textRight = 0
      let textTop = 0
      let textHeight = 0

      if (labelEl.firstChild) {
        const range = document.createRange()
        range.selectNodeContents(labelEl)
        const rects = range.getClientRects()
        if (rects.length > 0) {
          const lastRect = rects[rects.length - 1]
          textRight = lastRect.right
          textTop = lastRect.top
          textHeight = lastRect.height
        }
      }

      if (textRight === 0) {
        const rLabel = labelEl.getBoundingClientRect()
        textRight = rLabel.right
        textTop = rLabel.top
        textHeight = rLabel.height
      }

      setLabelOffset({
        top: textTop - rWrap.top + textHeight / 2,
        left: textRight - rWrap.left + 8,
      })
    }
  }

  useLayoutEffect(() => {
    compute()
  }, [])

  useEffect(() => {
    if (!wrapRef.current) return
    compute()

    const observer = new ResizeObserver(() => compute())
    observer.observe(wrapRef.current)

    const firstChild = wrapRef.current.firstElementChild
    if (firstChild) {
      observer.observe(firstChild)
    }

    const onResize = () => compute()
    const onScroll = () => compute()

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  return (
    <div ref={wrapRef} id={id} className="relative w-full max-w-[368px] mx-auto">
      {children}

      {show && (
        <>
          {/* Desktop: floating indicator to the left of the input */}
          {topPx !== null && (
            <span
              className="hidden sm:flex absolute items-center justify-center pointer-events-none select-none"
              style={{
                left: -(iconSize + gapPx),
                top: topPx,
                transform: 'translateY(-50%)',
                width: iconSize,
                height: iconSize,
              }}
              aria-hidden="true"
            >
              <span className="relative flex items-center justify-center w-full h-full">
                <span className="absolute inset-0 rounded-full bg-[#E6E6FF] opacity-75 animate-ping" />
                <Image
                  src="/icons/missing.svg"
                  alt=""
                  width={iconSize}
                  height={iconSize}
                  className="relative z-10"
                />
              </span>
            </span>
          )}

          {/* Mobile: inline indicator right next to the label (pointing down towards the field) */}
          {labelOffset !== null && (
            <span
              className="flex sm:hidden absolute items-center justify-center pointer-events-none select-none"
              style={{
                left: labelOffset.left,
                top: labelOffset.top,
                transform: 'translateY(-50%)',
                width: 18,
                height: 18,
              }}
              aria-hidden="true"
            >
              <span className="relative flex items-center justify-center w-full h-full">
                <span className="absolute inset-0 rounded-full bg-[#E6E6FF] opacity-75 animate-ping" />
                <Image
                  src="/icons/missing.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="relative z-10 rotate-90"
                />
              </span>
            </span>
          )}
        </>
      )}
    </div>
  )
}
