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
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Portal } from "@radix-ui/react-dropdown-menu";
import Tooltip from "@/components/Tooltip";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import VisibilityPanel from './TrainingList/VisibilityPanel';
import DragPreviewItem from './TrainingList/DragPreviewItem';
import SortableItem from './TrainingList/SortableItem'
import AddTrainingButton from '@/components/AddTrainingButton'

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
  onReorderTrainings: (programId: string | null, ids: string[]) => Promise<void>;
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
  const [iconsActive, setIconsActive] = useState(false);

  useEffect(() => {
    setIconsActive(trainings.length > 0);
  }, [trainings.length]);

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

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      onReorderTrainings(programId, reordered.map((item) => item.id));
    }
  };

  const onUpdateTrainingVisibility = (id: string, updates: Partial<{ app: boolean; dashboard: boolean }>) => {
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
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-5">
            {items.map((training) => (
              <div key={training.id} className="relative z-0">
                <SortableItem
                  programId={programId}
                  training={training}
                  onClick={onClickTraining}
                  onDelete={onDeleteTraining}
                  onDuplicate={onDuplicateTraining}
                  onToggleVisibility={(id) => {
                    setShowVisibilityTrainingId((prev) => (prev === id ? null : id));
                  }}
                  showVisibilityTrainingId={showVisibilityTrainingId}
                  onUpdateTrainingVisibility={onUpdateTrainingVisibility}
                />
              </div>
            ))}
            <AddTrainingButton onClick={onAddTraining} />
          </div>
        </SortableContext>
          <DragOverlay>
            {activeItem && <DragPreviewItem training={activeItem} />}
          </DragOverlay>
      </DndContext>
    </div>
  );
}
