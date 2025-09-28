'use client'

import { AccordionItem, AccordionContent } from '@/components/ui/accordion'
import AccordionTrigger from './AccordionTrigger'
import { ReactNode } from 'react'

type Props = {
  value: string
  title: string
  children: ReactNode
}

export default function AccountAccordionSection({ value, title, children }: Props) {
  return (
    <AccordionItem value={value}>
      <div className="shadow-glift border border-[#ECE9F1] bg-white rounded-[5px] overflow-hidden">
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent className="px-4 py-4 bg-white border-t border-[#ECE9F1] rounded-b-[5px]">
          {children}
        </AccordionContent>
      </div>
    </AccordionItem>
  )
}
