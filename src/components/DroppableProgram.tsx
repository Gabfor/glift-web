"use client";

import { useEffect, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./training/SortableItem";
import { cn } from "@/lib/utils";

import { useUser } from "@/context/UserContext";
import { Training } from "@/types/training"; // Shared type

export type LoadingTrainingState = { id: string; type: "open" | "add" } | null;

interface Props {
  programId: string
  trainings: Training[]
  onClickTraining: (id: string) => void | Promise<void>
  onReorderTrainings: (programId: string, ids: string[]) => void
  onAddTraining: () => void | Promise<void>
  onDeleteTraining: (id: string) => void
  onDuplicateTraining: (id: string) => void
  onDropTraining: (
    trainingId: string,
    fromProgramId: string,
    toProgramId: string,
    position: number
  ) => Promise<void>
  openVisibilityIds: string[]
  setOpenVisibilityIds: React.Dispatch<React.SetStateAction<string[]>>
  showVisibilityTrainingId?: string | null
  setShowVisibilityTrainingId?: (id: string | null) => void
  onUpdateTrainingVisibility: (id: string, updates: Partial<{ app: boolean }>) => void
  loadingTraining?: LoadingTrainingState
  isFirstProgram?: boolean
  onUnlockClick?: () => void
  allowAddTraining?: boolean
  onAddLockedClick?: () => void
}

export default function DroppableProgram(props: Props) {
  const {
    programId,
    trainings,
    onClickTraining,
    onAddTraining,
    onDeleteTraining,
    onDuplicateTraining,
    openVisibilityIds,
    setOpenVisibilityIds,
    onUpdateTrainingVisibility,
    loadingTraining,
    isFirstProgram = false,
    allowAddTraining = false,
    onAddLockedClick,
  } = props;

  // ... (rest of the component)
  const { isPremiumUser } = useUser();

  const { setNodeRef } = useDroppable({
    id: programId,
    data: { programId },
  });



  const filteredTrainings = trainings.filter(
    (t): t is Training => t !== null && t !== undefined
  );

  const dragDisabled = openVisibilityIds.length > 0;

  const sortableItems = useMemo(() => {
    // Si Premium : tout est déplaçable
    if (isPremiumUser) {
      return [...filteredTrainings.map((t) => t.id), `add-button-${programId}`];
    }
    // Si Starter : seul le 1er du 1er programme est déplaçable (visuellement)
    if (isFirstProgram && filteredTrainings.length > 0) {
      return [filteredTrainings[0].id];
    }
    // Sinon rien n'est déplaçable
    return [];
  }, [isPremiumUser, isFirstProgram, filteredTrainings, programId]);

  const isAddEnabled = isPremiumUser || allowAddTraining; // True if Premium OR (Basic + count == 0)

  return (
    <div ref={setNodeRef}>
      <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-4 items-start">
          {filteredTrainings.map((training, index) => {
            // ... (training item rendering)
            const isTrainingLoading = loadingTraining?.id === training.id;
            const isLocked = training.locked ?? (!isPremiumUser && (!isFirstProgram || index > 0));

            return (
              <SortableItem
                key={training.id}
                training={training}
                programId={programId}
                onClick={onClickTraining}
                onDelete={onDeleteTraining}
                onDuplicate={onDuplicateTraining}
                onToggleVisibility={() => {
                  setOpenVisibilityIds((prev) =>
                    prev.includes(training.id)
                      ? prev.filter((id) => id !== training.id)
                      : [...prev, training.id]
                  );
                }}
                showVisibility={openVisibilityIds.includes(training.id)}
                dragDisabled={dragDisabled || isLocked}
                onUpdateTrainingVisibility={onUpdateTrainingVisibility}
                isLoading={isTrainingLoading}
                isLocked={isLocked}
                onUnlockClick={props.onUnlockClick}
                enableRestrictedMenu={!isPremiumUser}
              />
            );
          })}
          <div className="ml-0">
            <button
              // We always enable the button if it's Premium OR enabled.
              // If it is NOT enabled (Basic limit reached), we STILL want it clickable to show the modal.
              disabled={false}
              className={cn(
                "border-[2px] border-dashed text-[16px] font-semibold px-5 py-2 rounded-[8px] w-[270px] h-[60px] transition",
                !isAddEnabled
                  ? "border-[#D7D4DC] text-[#D7D4DC] cursor-pointer" // Gray but clickable
                  : "border-[#A1A5FD] text-[#A1A5FD] hover:border-[#7069FA] hover:text-[#7069FA]"
              )}
              onClick={() => {
                if (isAddEnabled) {
                  onAddTraining();
                } else if (onAddLockedClick) {
                  onAddLockedClick();
                }
              }}
            >
              + Ajouter un entraînement
            </button>
          </div>
        </div>
      </SortableContext>
    </div>
  );
}
