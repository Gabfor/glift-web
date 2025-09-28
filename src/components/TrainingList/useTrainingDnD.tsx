'use client'

import { useState } from 'react'
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableItem from './SortableItem'
import DragPreviewItem from './DragPreviewItem'

export type Row = {
  id?: string;
  series: number;
  repetitions: string[];
  poids: string[];
  repos: string;
  effort: string[];
  checked: boolean;
  iconHovered: boolean;
  exercice: string;
  materiel: string;
  superset_id?: string | null;
  link?: string;
  note?: string;
}

interface UseTrainingDnDProps {
  items: Row[]
  onMove: (items: Row[]) => void
  renderItem: (training: Row) => React.ReactNode
}

export function useTrainingDnD({ items, onMove, renderItem }: UseTrainingDnDProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))
  const activeItem = items.find(item => item.id === activeId) || null

  const handleDragStart = (event: { active: { id: string } }) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: { active: { id: string }, over: { id: string } | null }) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over?.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      onMove(newItems)
    }
    setActiveId(null)
  }

  const renderSortableList = () => (
    <SortableContext items={items.map(i => i.id!)} strategy={verticalListSortingStrategy}>
      {items.map((training) => (
        <SortableItem key={training.id} id={training.id!}>
          {renderItem(training)}
        </SortableItem>
      ))}
    </SortableContext>
  )

  const renderDndContext = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {renderSortableList()}

      <DragOverlay wrapperElement="div" className="cursor-grabbing select-none z-50">
        {activeItem ? <DragPreviewItem training={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )

  return {
    renderDndContext,
  }
}
