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
import Tooltip from '@/components/Tooltip'
import { Training } from '@/types/training'

type Props = {
  training: Training
  programId: string
  onClick: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisibility: () => void
  showVisibility: boolean
  dragDisabled: boolean
  onUpdateTrainingVisibility: (id: string, updates: Partial<{ app: boolean }>) => void
  simulateDrag?: boolean
  isLoading?: boolean
  isLocked?: boolean
  onUnlockClick?: () => void
  enableRestrictedMenu?: boolean
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
  isLocked = false,
  onUnlockClick,
  enableRestrictedMenu = false,
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
    disabled: simulateDrag || dragDisabled || isLocked,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
    willChange: 'transform',
    opacity: isDragging ? 0 : 1,
    // Only force pointer-events: none when dragging. Otherwise let it inherit (auto).
    ...(isDragging ? { pointerEvents: 'none' } : {}),
  };

  const handleVisibilityUpdate = async (
    updates: Partial<{ app: boolean }>
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
  const spinnerColorClass = 'text-[#D7D4DC]'

  const handleMainClick = () => {
    console.log("Item clicked:", training.id, "Locked:", isLocked);
    if (isLocked) {
      if (onUnlockClick) onUnlockClick();
      return;
    }
    onClick(training.id);
  };

  const content = (
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
          "w-[270px] h-[60px] flex items-center justify-between px-4 font-semibold text-[16px] transition-transform duration-300 ease-in-out",
          showVisibility
            ? "rounded-t-[8px] rounded-b-none"
            : "rounded-[8px]",
          isLocked
            ? "bg-[#F2F1F6] border border-[#D7D4DC] text-[#D7D4DC]"
            : "bg-white border border-[#D7D4DC] text-[#3A416F]"
        )}
      >
        {/* Zone de gauche : Drag ou Lock */}
        <div
          className={cn(
            "w-[25px] h-[25px] group relative flex items-center justify-center",
            dragDisabled || isLocked
              ? "cursor-default" // Pas de drag si bloqué
              : "cursor-grab active:cursor-grabbing"
          )}
          {...(!dragDisabled && !isLocked ? listeners : {})}
          onClick={(e) => e.stopPropagation()}
        >
          {isLocked ? (
            <Image
              src="/icons/cadena_defaut.svg"
              alt="Bloqué"
              width={25}
              height={25}
            />
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Titre */}
        <div
          className="flex-1 px-6 flex items-center justify-center min-w-0 h-full cursor-pointer"
          onClick={handleMainClick}
        >
          {showLoader ? (
            <Spinner
              size="lg"
              className={cn(spinnerColorClass)}
              ariaLabel="Chargement de l’entraînement"
            />
          ) : (
            <span className="block w-full truncate text-center">{training.name}</span>
          )}
        </div>

        {/* Menu (caché si locked) */}
        <div
          className="w-[25px] h-[25px] z-10 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {!isLocked && (
            <TrainingCardMenu
              onOpen={() => onClick(training.id)}
              onDuplicate={() => onDuplicate(training.id)}
              onToggleVisibility={onToggleVisibility}
              onDelete={() => onDelete(training.id)}
              onOpenChange={setMenuOpen}
              enableRestrictedMenu={enableRestrictedMenu}
            />
          )}
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
  );

  if (isLocked) {
    return (
      <Tooltip content="Entraînement bloqué" placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
}
