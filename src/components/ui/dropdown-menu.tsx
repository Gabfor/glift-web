'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-black shadow-lg',
      className
    )}
    {...props}
  />
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

// ✅ Ajout de Portal pour que TrainingCardMenu puisse l'importer
const Portal = DropdownMenuPrimitive.Portal

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Portal,
}
