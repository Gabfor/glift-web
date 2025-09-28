'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import VisibilityPanel from '@/components/training/VisibilityPanel'
import TrainingCardMenu from '@/components/TrainingCardMenu'
import Image from 'next/image'
import type * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Training {
  id: string
  name: string
  app: boolean
  dashboard: boolean
}

type Props = {
  training: Training
  programId: string
  onClick: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisibility: () => void
  showVisibility: boolean
  dragDisabled: boolean
  onUpdateTrainingVisibility: (id: string, updates: Partial<{ app: boolean; dashboard: boolean }>) => void
  simulateDrag?: boolean;
}

export default function SortableItem({
  training,
  programId,
  onClick,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  showVisibility,
  dragDisabled,
  onUpdateTrainingVisibility,
  simulateDrag = false,
}: Props) {
  const supabase = useSupabaseClient()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: training.id,
    data: { programId },
    disabled: simulateDrag || dragDisabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
    willChange: 'transform',
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const handleVisibilityUpdate = async (
    updates: Partial<{ app: boolean; dashboard: boolean }>
  ) => {
    const { error } = await supabase
      .from('trainings')
      .update(updates)
      .eq('id', training.id)

    if (error) {
      console.error('Erreur mise à jour visibilité :', error)
      return
    }

    onUpdateTrainingVisibility(training.id, updates)
  }

  const [menuOpen, setMenuOpen] = useState(false)

  return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn(
          'w-[270px] transition-shadow duration-300 ease-in-out',
          showVisibility ? 'shadow-[0px_1px_15px_rgba(0,0,0,0.05)]' : 'shadow-none',
          menuOpen ? 'z-50' : 'z-0' // 👈 priorité plus haute si le menu est ouvert
        )}
      >
      <div
        className={`w-[270px] h-[60px] bg-white border border-[#ECE9F1] flex items-center px-4 text-[#3A416F] font-semibold text-[16px]
          ${showVisibility ? 'rounded-t-[5px] rounded-b-none' : 'rounded-[5px]'}
          ${showVisibility ? '' : 'hover:shadow-[0px_1px_15px_rgba(0,0,0,0.05)]'}
          transition-transform duration-300 ease-in-out cursor-pointer`}
        onClick={() => onClick(training.id)}
      >
        <div className="relative w-full flex items-center justify-center">
          <div
            className={`absolute left-[-16px] top-1/2 -translate-y-1/2 w-[25px] h-[25px] z-10 group relative ${
              dragDisabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
            } bg-[rgba(0,0,0,0.001)]`}
            {...(!dragDisabled ? listeners : {})}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src="/icons/drag.svg"
              alt="Déplacer"
              fill
              sizes="100%"
              className="absolute top-0 left-0 w-full h-full group-hover:hidden"
            />
            <Image
              src="/icons/drag_hover.svg"
              alt="Déplacer (hover)"
              fill
              sizes="100%"
              className="absolute top-0 left-0 w-full h-full hidden group-hover:inline"
            />
          </div>
          <span className="truncate text-center px-6">{training.name}</span>
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[25px] h-[25px] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <TrainingCardMenu
              onOpen={() => onClick(training.id)}
              onDuplicate={() => onDuplicate(training.id)}
              onToggleVisibility={onToggleVisibility}
              onDelete={() => onDelete(training.id)}
              onOpenChange={setMenuOpen}
            />
          </div>
        </div>
      </div>

      {showVisibility && (
        <VisibilityPanel
          training={training}
          onClose={onToggleVisibility}
          onUpdateVisibility={handleVisibilityUpdate}
        />
      )}
    </div>
  )
}
