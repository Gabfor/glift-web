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
    <AccordionItem value={value} id={value} className="scroll-mt-[100px] md:scroll-mt-[120px]">
      <div className="border border-[#D7D4DC] bg-white rounded-[8px]">
        <div className="overflow-hidden rounded-[8px]">
          <AccordionTrigger>{title}</AccordionTrigger>
        </div>
        <AccordionContent
          forceMount
          className="px-3 sm:px-6 py-4 bg-white border-t border-[#D7D4DC] rounded-b-[8px] overflow-hidden"
        >
          {children}
        </AccordionContent>
      </div>
    </AccordionItem>
  )
}
