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
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import DragPreviewItem from "@/components/TrainingList/DragPreviewItem";
import SortableItem from "@/components/TrainingList/SortableItem";
import AddTrainingButton from "@/components/AddTrainingButton";

type Training = {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
};

type Props = {
  trainings: Training[];
  programId: string;
  onClickTraining: (id: string) => void;
  onReorderTrainings: (programId: string | null, ids: string[]) => Promise<void>;
  onAddTraining: () => void;
  onDeleteTraining: (id: string) => void;
  onDuplicateTraining: (id: string) => void;
};

export default function TrainingList({
  trainings,
  programId,
  onClickTraining,
  onAddTraining,
  onDeleteTraining,
  onDuplicateTraining,
  onReorderTrainings,
}: Props) {
  const [items, setItems] = useState(trainings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showVisibilityTrainingId, setShowVisibilityTrainingId] = useState<string | null>(null);

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
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorderTrainings(programId, reordered.map((i) => i.id));
  };

  const onUpdateTrainingVisibility = (
    id: string,
    updates: Partial<{ app: boolean; dashboard: boolean }>
  ) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const activeItem = items.find((i) => i.id === activeId) || null;

  return (
    <div className="flex flex-col gap-5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-5">
            {items.map((training) => (
              <div key={training.id} className="relative z-0">
                <SortableItem
                  programId={programId}
                  training={training}
                  onClick={onClickTraining}
                  onDelete={onDeleteTraining}
                  onDuplicate={onDuplicateTraining}
                  onToggleVisibility={() =>
                    setShowVisibilityTrainingId((prev) =>
                      prev === training.id ? null : training.id
                    )
                  }
                  showVisibility={showVisibilityTrainingId === training.id}
                  dragDisabled={false}
                  onUpdateTrainingVisibility={onUpdateTrainingVisibility}
                  activeId={activeId}
                  simulateDrag={false}
                />
              </div>
            ))}
            <AddTrainingButton onClick={onAddTraining} />
          </div>
        </SortableContext>

        <DragOverlay>{activeItem && <DragPreviewItem training={activeItem} />}</DragOverlay>
      </DndContext>
    </div>
  );
}
