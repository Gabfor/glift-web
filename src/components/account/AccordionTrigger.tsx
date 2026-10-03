'use client'

import { AccordionTrigger as BaseTrigger } from '@/components/ui/accordion'
import { ReactNode } from 'react'

export default function AccordionTrigger({ children }: { children: ReactNode }) {
  return (
    <BaseTrigger
      onClick={(e) => {
        e.currentTarget.blur()
      }}
      className="min-h-[60px] font-bold text-[#5D6494] [@media(hover:hover)]:hover:text-[#3A416F] data-[state=open]:text-[#3A416F] transition-colors text-[16px] px-[20px] md:pl-[30px] md:pr-6 py-[18px] hover:no-underline flex items-center justify-between group appearance-none before:hidden after:hidden w-full data-[state=open]:rounded-t-[8px] rounded-[8px] focus:outline-none"
    >
      <span className="text-left">{children}</span>
    </BaseTrigger>
  )
}
