import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import VisibilityPanel from '@/components/training/VisibilityPanel'
import TrainingCardMenu from '@/components/TrainingCardMenu'
import EditableTitle from '@/components/EditableTitle'
import Image from 'next/image'
import type * as React from 'react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import GliftSpinner from '@/components/ui/GliftSpinner'
import Tooltip from '@/components/Tooltip'
import { Training } from '@/types/training'

type Props = {
  training: Training
  programId: string
  onClick: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRename?: (id: string, newName: string) => void | Promise<void>
  onToggleVisibility: () => void
  showVisibility: boolean
  dragDisabled: boolean
  onUpdateTrainingVisibility: (id: string, updates: Partial<{ app: boolean; dashboard: boolean }>) => void
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
  onRename,
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

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(training.name)

  useEffect(() => {
    if (!isEditing) {
      setEditedName(training.name)
    }
  }, [training.name, isEditing])

  const handleSaveRename = () => {
    const trimmed = editedName.trim()
    if (trimmed && trimmed !== training.name && onRename) {
      onRename(training.id, trimmed)
    } else {
      setEditedName(training.name)
    }
    setIsEditing(false)
  }

  const handleCancelRename = () => {
    setEditedName(training.name)
    setIsEditing(false)
  }

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
    disabled: simulateDrag || dragDisabled || isLocked || isEditing,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
    willChange: 'transform',
    opacity: isDragging ? 0 : 1,
    // Only force pointer-events: none when dragging. Otherwise let it inherit (auto).
    ...(isDragging ? { pointerEvents: 'none' } : {}),
  }

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
  const showLoader = Boolean(isLoading)

  const handleMainClick = () => {
    if (isDragging || isEditing) return
    console.log("Item clicked:", training.id, "Locked:", isLocked)
    if (isLocked) {
      if (onUnlockClick) onUnlockClick()
      return
    }
    onClick(training.id)
  }

  const { "aria-disabled": _ariaDisabled, ...cleanAttributes } = attributes

  const content = (
    <div
      ref={setNodeRef}
      style={style}
      {...cleanAttributes}

      className={cn(
        'w-full sm:w-[270px] rounded-[8px] transition-shadow duration-300 ease-in-out',
        showVisibility ? 'shadow-glift-hover' : 'shadow-glift hover:shadow-glift-hover',
        menuOpen ? 'z-50' : 'z-0'
      )}
    >
      <div
        {...(!dragDisabled && !isLocked && !isEditing ? listeners : {})}
        style={{ WebkitTouchCallout: "none" }}
        className={cn(
          "w-full sm:w-[270px] h-[60px] flex items-center justify-between px-4 font-semibold text-[16px] select-none touch-manipulation",
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
            "w-[25px] h-[25px] flex-shrink-0 group relative flex items-center justify-center",
            dragDisabled || isLocked || isEditing
              ? "cursor-default" // Pas de drag si bloqué ou en cours d'édition
              : "cursor-grab active:cursor-grabbing"
          )}
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
          className="flex-1 px-2 sm:px-3 flex items-center justify-center min-w-0 h-full"
          onClick={isEditing ? (e) => e.stopPropagation() : handleMainClick}
        >
          {showLoader ? (
            <GliftSpinner size={22} />
          ) : isEditing ? (
            <EditableTitle
              editing={isEditing}
              setEditing={setIsEditing}
              programName={editedName}
              setProgramName={setEditedName}
              handleBlur={handleSaveRename}
              setIsEditing={setIsEditing}
              onCancel={handleCancelRename}
              className="w-full flex items-center justify-center"
              wrapperClassName="max-w-none w-full"
              inputClassName="text-[16px] sm:text-[16px] px-3.5 py-1.5 pr-9"
              autoScrollOnEdit
            />
          ) : (
            <span className={cn("block w-full truncate text-center leading-normal cursor-pointer", isLocked ? "text-[#D7D4DC]" : "text-[#3A416F]")}>
              {training.name}
            </span>
          )}
        </div>

        {/* Menu (caché si locked) */}
        <div
          className="w-[25px] h-[25px] flex-shrink-0 z-10 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {!isLocked && (
            <TrainingCardMenu
              onOpen={() => onClick(training.id)}
              onRename={() => setIsEditing(true)}
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
  )

  if (isLocked) {
    return (
      <Tooltip content="Entraînement bloqué" placement="top" asChild className="w-full sm:w-auto">
        {content}
      </Tooltip>
    )
  }

  return content
}
