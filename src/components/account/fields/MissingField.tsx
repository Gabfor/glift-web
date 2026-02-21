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
      return
    }

    const rBest = best.getBoundingClientRect()
    const centerBest = rBest.top + rBest.height / 2
    setTopPx(centerBest - rWrap.top)
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
    <div ref={wrapRef} id={id} className="relative" style={{ width: widthPx }}>
      {children}

      {show && topPx !== null && (
        <span
          className="absolute"
          style={{
            left: -(iconSize + gapPx),
            top: topPx,
            transform: 'translateY(-50%)',
          }}
          aria-hidden="true"
        >
          <Image src="/icons/missing.svg" alt="" width={iconSize} height={iconSize} />
        </span>
      )}
    </div>
  )
}
