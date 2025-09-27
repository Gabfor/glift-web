'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  show: boolean
  children: React.ReactNode
  /** largeur visuelle du champ (pour caler le wrapper) */
  widthPx?: number
  /** taille de l’icône */
  iconSize?: number
  /** écart entre le bord du champ et l’icône (px) */
  gapPx?: number
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
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [topPx, setTopPx] = useState<number | null>(null)

  // calcule la position verticale idéale (centre du contrôle principal)
  const compute = () => {
    const root = wrapRef.current
    if (!root) return

    // Cherche un “contrôle” probable : input, select, button-like, ou élément de ≥ 40px de haut
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>('input, select, textarea, button, [role="button"], [data-control], [data-field-root], div, span')
    )

    let best: HTMLElement | null = null
    for (const el of candidates) {
      const r = el.getBoundingClientRect()
      const h = r.height
      const w = r.width
      // on évite les labels trop petits ; on prend le premier gros bloc
      if (h >= 40 && w >= 120) {
        best = el
        break
      }
    }

    // fallback : centre global du wrapper
    const rWrap = root.getBoundingClientRect()
    const centerWrap = rWrap.top + rWrap.height / 2

    if (!best) {
      setTopPx(centerWrap - rWrap.top)
      return
    }

    const rBest = best.getBoundingClientRect()
    const centerBest = rBest.top + rBest.height / 2
    setTopPx(centerBest - rWrap.top) // coordonnée relative au wrapper
  }

  // calcule à l’affichage, et réagit aux changements
  useLayoutEffect(() => {
    compute()
  }, [])

  useEffect(() => {
    if (!wrapRef.current) return
    compute()

    const ro = new ResizeObserver(() => compute())
    ro.observe(wrapRef.current)
    // observe aussi le 1er enfant (utile quand les champs changent de taille)
    const firstChild = wrapRef.current.firstElementChild
    if (firstChild) {
      ro.observe(firstChild as Element)
    }

    const onResize = () => compute()
    const onScroll = () => compute()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{ width: widthPx }}
    >
      {children}

      {show && topPx !== null && (
        <span
          className="absolute"
          style={{
            // positionné à 10px à gauche du bord (icône 24px → 24 + 10 = 34)
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
