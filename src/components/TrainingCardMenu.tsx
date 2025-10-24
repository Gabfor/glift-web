'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const baseMenuItemClass =
    'w-[155px] text-left h-[40px] rounded-[5px] text-[16px] px-2 mx-[10px] py-2 font-semibold transition-colors'

  const setMenuOpen = useCallback(
    (value: boolean) => {
      setOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setMenuOpen])

  const handleToggleMenu = () => {
    setMenuOpen(!open)
  }

  const handleSelect = (callback: () => void) => {
    callback()
    setMenuOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="w-full h-full focus:outline-none"
        type="button"
        onClick={handleToggleMenu}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="group w-[25px] h-[25px] flex items-center justify-center relative">
          <Image src="/icons/dots.svg" alt="Menu" fill sizes="100%" className="group-hover:hidden" />
          <Image src="/icons/dots_hover.svg" alt="Menu (hover)" fill sizes="100%" className="hidden group-hover:inline" />
        </div>
      </button>

      {open && (
        <div className="mt-2 flex justify-end">
          <div
            className={cn(
              'relative w-[175px] rounded-[5px] border border-[#ECE9F1] bg-white py-2',
              'shadow-[0px_4px_16px_rgba(0,0,0,0.08)]'
            )}
          >
            <div className="absolute -top-2 right-[18px] w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleSelect(onOpen)}
                className={cn(
                  baseMenuItemClass,
                  'text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]'
                )}
              >
                Ouvrir
              </button>
              <button
                type="button"
                onClick={() => handleSelect(onDuplicate)}
                className={cn(
                  baseMenuItemClass,
                  'text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]'
                )}
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={() => handleSelect(onToggleVisibility)}
                className={cn(
                  baseMenuItemClass,
                  'text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]'
                )}
              >
                Régler la visibilité
              </button>
              <button
                type="button"
                onClick={() => handleSelect(onDelete)}
                className={cn(
                  baseMenuItemClass,
                  'text-[#EF4F4E] hover:text-[#BA2524] hover:bg-[#FFF1F1]'
                )}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
