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
import Spinner from '@/components/ui/Spinner'
import useMinimumVisibility from '@/hooks/useMinimumVisibility'

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
  isLoading?: boolean;
  loadingType?: 'open' | 'add' | null;
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
  isLoading = false,
  loadingType = null,
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
  const showLoader = useMinimumVisibility(isLoading, 2000)
  const spinnerColorClass = loadingType === 'add' ? 'text-[#A1A5FD]' : 'text-[#D7D4DC]'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'w-[270px] transition-shadow duration-300 ease-in-out',
        showVisibility ? 'shadow-[0px_1px_15px_rgba(0,0,0,0.05)]' : 'shadow-none',
        menuOpen ? 'z-50' : 'z-0'
      )}
    >
      <div
        className={cn(
          "w-[270px] h-[60px] bg-white border border-[#ECE9F1] flex items-center justify-between px-4 text-[#3A416F] font-semibold text-[16px] transition-transform duration-300 ease-in-out cursor-pointer",
          showVisibility
            ? "rounded-t-[5px] rounded-b-none"
            : "rounded-[5px] hover:shadow-[0px_1px_15px_rgba(0,0,0,0.05)]"
        )}
        onClick={() => onClick(training.id)}
      >
        <div
          className={cn(
            "w-[25px] h-[25px] group relative bg-[rgba(0,0,0,0.001)]",
            dragDisabled
              ? "cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing"
          )}
          {...(!dragDisabled ? listeners : {})}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src="/icons/drag.svg"
            alt="Déplacer"
            fill
            sizes="100%"
            className="group-hover:hidden"
          />
          <Image
            src="/icons/drag_hover.svg"
            alt="Déplacer (hover)"
            fill
            sizes="100%"
            className="hidden group-hover:inline"
          />
        </div>

        <div className="flex-1 px-6 flex items-center justify-center min-w-0">
          {showLoader ? (
            <Spinner
              size="sm"
              className={cn(spinnerColorClass)}
              ariaLabel="Chargement de l’entraînement"
            />
          ) : (
            <span className="block w-full truncate text-center">{training.name}</span>
          )}
        </div>

        <div
          className="w-[25px] h-[25px] z-10"
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
