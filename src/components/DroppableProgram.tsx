"use client";

import { useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./training/SortableItem";

interface Training {
  id: string
  name: string
  app: boolean
  dashboard: boolean
}

interface Props {
  programId: string
  trainings: Training[]
  onClickTraining: (id: string) => void
  onReorderTrainings: (programId: string, ids: string[]) => void
  onAddTraining: () => void
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
  onUpdateTrainingVisibility: (id: string, updates: Partial<{ app: boolean; dashboard: boolean }>) => void
  loadingTrainingId?: string | null
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
    loadingTrainingId,
  } = props;

  const { setNodeRef } = useDroppable({
    id: programId,
    data: { programId },
  });

  useEffect(() => {
    console.log("✅ Droppable mounted for", programId);
  }, [programId]);

  const filteredTrainings = trainings.filter(
    (t): t is Training => t !== null && t !== undefined
  );

  const dragDisabled = openVisibilityIds.length > 0;

  return (
    <div ref={setNodeRef}>
      <SortableContext
        items={[...filteredTrainings.map((t) => t.id), `add-button-${programId}`]}
        strategy={rectSortingStrategy}
      >
        <div className="flex flex-wrap gap-4 items-start">
          {filteredTrainings.map((training) => (
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
              dragDisabled={dragDisabled}
              onUpdateTrainingVisibility={onUpdateTrainingVisibility}
              isLoading={loadingTrainingId === training.id}
            />
          ))}
          <div className="ml-0">
            <button
              className="border-[2px] border-dashed text-[16px] font-semibold px-5 py-2 rounded-[6px] w-[270px] h-[60px] transition border-[#A1A5FD] text-[#A1A5FD] hover:border-[#7069FA] hover:text-[#7069FA]"
              onClick={onAddTraining}
            >
              + Ajouter un entraînement
            </button>
          </div>
        </div>
      </SortableContext>
    </div>
  );
}
