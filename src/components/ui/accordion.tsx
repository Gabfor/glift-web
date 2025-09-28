'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between text-left py-4 text-sm font-medium transition-all hover:underline group',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <span
        className="relative w-[14px] h-[8px] mt-[2px] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
      >
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
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
