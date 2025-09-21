"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import DragPreviewItem from "./DragPreviewItem";

interface Training {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
}

interface TrainingListProps {
  trainings: Training[];
  programId: string;
  onClickTraining: (id: string) => void;
  onReorderTrainings: (
    programId: string | null,
    ids: string[]
  ) => Promise<void>;
  onAddTraining: () => void;
  onDeleteTraining: (id: string) => void;
  onDuplicateTraining: (id: string) => void;
}

export default function TrainingList({
  trainings,
  programId,
  onClickTraining,
  onAddTraining,
  onDeleteTraining,
  onDuplicateTraining,
  onReorderTrainings,
}: TrainingListProps) {
  const [items, setItems] = useState(trainings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showVisibilityTrainingId, setShowVisibilityTrainingId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setItems(trainings);
  }, [trainings]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      onReorderTrainings(programId, reordered.map((item) => item.id));
    }
  };

  const handleUpdateTrainingVisibility = (
    id: string,
    updates: Partial<{ app: boolean; dashboard: boolean }>
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const activeItem = items.find((item) => item.id === activeId) || null;

  return (
    <div className="flex flex-col gap-5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap gap-5">
            {items.map((training) => (
              <div key={training.id} className="relative z-0">
                <SortableItem
                  training={training}
                  programId={programId}
                  onClick={onClickTraining}
                  onDelete={onDeleteTraining}
                  onDuplicate={onDuplicateTraining}
                  onToggleVisibility={(id: string) =>
                    setShowVisibilityTrainingId((prev) =>
                      prev === id ? null : id
                    )
                  }
                  showVisibility={showVisibilityTrainingId === training.id} // ✅ fix
                  dragDisabled={false}
                  onUpdateTrainingVisibility={handleUpdateTrainingVisibility}
                />
              </div>
            ))}
            <button
              onClick={onAddTraining}
              className="border-[2px] border-dashed border-[#A1A5FD] text-[#A1A5FD] text-[16px] font-semibold px-5 py-2 rounded-[6px] w-[270px] h-[60px] hover:border-[#7069FA] hover:text-[#7069FA] transition"
            >
              + Ajouter un entraînement
            </button>
          </div>
        </SortableContext>
        <DragOverlay
          wrapperElement="div"
          className="cursor-grabbing select-none z-50"
        >
          {activeItem ? <DragPreviewItem training={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
