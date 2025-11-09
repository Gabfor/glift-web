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
    <AccordionItem value={value} id={value}>
      <div className="border border-[#D7D4DC] bg-white rounded-[5px]">
        <div className="overflow-hidden rounded-[5px]">
          <AccordionTrigger>{title}</AccordionTrigger>
        </div>
        <AccordionContent
          forceMount
          className="px-4 py-4 bg-white border-t border-[#D7D4DC] rounded-b-[5px]"
        >
          {children}
        </AccordionContent>
      </div>
    </AccordionItem>
  )
}
