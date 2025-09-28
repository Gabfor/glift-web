'use client'

import Image from 'next/image'
import { AccordionTrigger as BaseTrigger } from '@/components/ui/accordion'
import { ReactNode } from 'react'

export default function AccordionTrigger({ children }: { children: ReactNode }) {
  return (
    <BaseTrigger
      className="h-[60px] font-bold text-[#5D6494] hover:text-[#3A416F] text-[16px] pl-4 pr-6 py-3 hover:no-underline flex items-center justify-between group appearance-none before:hidden after:hidden w-full data-[state=open]:rounded-t-[5px] rounded-[5px]"
    >
      <span>{children}</span>
      <span className="relative w-[14px] h-[8px] mt-[2px] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180">
        <Image
          src="/icons/chevron_down.svg"
          alt="Chevron"
          fill
          className="object-contain transition-opacity duration-150 group-hover:opacity-0"
        />
        <Image
          src="/icons/chevron_down_hover.svg"
          alt="Chevron hover"
          fill
          className="object-contain absolute top-0 left-0 transition-opacity duration-150 opacity-0 group-hover:opacity-100"
        />
      </span>
    </BaseTrigger>
  )
}
