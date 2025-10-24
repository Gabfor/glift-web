'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'

type TrainingCardMenuProps = {
  onOpen: () => void
  onDuplicate: () => void
  onToggleVisibility: () => void
  onDelete: () => void
  onOpenChange?: (isOpen: boolean) => void
}

export default function TrainingCardMenu({
  onOpen,
  onDuplicate,
  onToggleVisibility,
  onDelete,
  onOpenChange,
}: TrainingCardMenuProps) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger asChild>
        <button className="w-full h-full focus:outline-none">
          <div className="group w-[25px] h-[25px] flex items-center justify-center relative">
            <Image src="/icons/dots.svg" alt="Menu" fill sizes="100%" className="group-hover:hidden" />
            <Image src="/icons/dots_hover.svg" alt="Menu (hover)" fill sizes="100%" className="hidden group-hover:inline" />
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        align="end"
        side="bottom"
        sideOffset={8}
        avoidCollisions={false}
        className={cn(
          'z-10 w-[175px] rounded-[5px] border border-[#ECE9F1] bg-white py-2',
          'shadow-[0px_4px_16px_rgba(0,0,0,0.08)]',
          'overflow-visible animate-in fade-in zoom-in-95 duration-100 ease-out',
          'translate-x-[13px]'
        )}
      >
        <div
          className="absolute -top-2 right-[18px] w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px] z-[-1]"
        />

        <DropdownMenu.Item
          onSelect={onOpen}
          className="text-[#5D6494] hover:text-[#3A416F] w-[155px] text-left h-[40px] hover:bg-[#FAFAFF] rounded-[5px] text-[16px] px-2 mx-[10px] py-2 font-semibold focus:outline-none"
        >
          Ouvrir
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={onDuplicate}
          className="text-[#5D6494] hover:text-[#3A416F] w-[155px] text-left h-[40px] hover:bg-[#FAFAFF] rounded-[5px] text-[16px] px-2 mx-[10px] py-2 font-semibold focus:outline-none"
        >
          Dupliquer
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={onToggleVisibility}
          className="text-[#5D6494] hover:text-[#3A416F] w-[155px] text-left h-[40px] hover:bg-[#FAFAFF] rounded-[5px] text-[16px] px-2 mx-[10px] py-2 font-semibold focus:outline-none"
        >
          Régler la visibilité
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={onDelete}
          className="text-[#EF4F4E] hover:text-[#BA2524] w-[155px] text-left h-[40px] hover:bg-[#FFF1F1] rounded-[5px] text-[16px] px-2 mx-[10px] py-2 font-semibold focus:outline-none"
        >
          Supprimer
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
