'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { AccordionItem, AccordionContent } from '@/components/ui/accordion'
import AccordionTrigger from './AccordionTrigger'

type Props = {
  value: string
  title: string
  children: ReactNode
}

const DEBUG = true
const dlog = (...a: any[]) => DEBUG && console.log('[AccountAccordionSection]', ...a)

export default function AccountAccordionSection({ value, title, children }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  // Logs: montage + suivi de l'état open/closed via l'attribut data-state de Radix
  useEffect(() => {
    dlog('mount', { value, title })
    const el = contentRef.current
    if (!el) return

    // Log état courant
    dlog('initial state', { value, state: el.getAttribute('data-state') })

    // Observe les changements d'attributs (data-state)
    const obs = new MutationObserver(() => {
      dlog('state change', { value, state: el.getAttribute('data-state') })
    })
    obs.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => obs.disconnect()
  }, [value, title])

  return (
    <AccordionItem value={value} data-section={value}>
      <div className="shadow-glift border border-[#ECE9F1] bg-white rounded-[5px] overflow-hidden">
        <AccordionTrigger>{title}</AccordionTrigger>

        <AccordionContent
          ref={contentRef}
          className="px-4 py-4 bg-white border-t border-[#ECE9F1] rounded-b-[5px]"
        >
          {children}
        </AccordionContent>
      </div>
    </AccordionItem>
  )
}
