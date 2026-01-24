"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimation,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
  type Collision,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement
} from "@dnd-kit/modifiers";
import { Row } from "@/types/training";
import TrainingRow from "./TrainingRow";
import TrainingRowOverlay from "./TrainingRowOverlay";
import UnlockTrainingModal from "./UnlockTrainingModal";

const centerVerticalCollision: CollisionDetection = ({ active, droppableContainers }) => {
  const activeRect = active.rect.current.translated;
  if (!activeRect) return [];

  return droppableContainers
    .map((container) => {
      const rect = container.rect.current;
      if (!rect) return null;

      const isOver =
        activeRect.top < rect.bottom &&
        activeRect.bottom > rect.top;

      const crossedCenter =
        activeRect.top < rect.top + rect.height / 2 &&
        activeRect.bottom > rect.top + rect.height / 2;

      if (isOver && crossedCenter) {
        const intersectionArea =
          Math.min(activeRect.bottom, rect.bottom) -
          Math.max(activeRect.top, rect.top);
        return { id: container.id, data: { value: intersectionArea } };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.data.value - a!.data.value) as Collision[];
};

type Props = {
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  handleEffortChange: (rowIndex: number, subIndex: number, direction: "up" | "down") => void;
  handleCheckboxChange: (id: string) => void;
  handleIncrementSeries: (index: number) => void;
  handleDecrementSeries: (index: number) => void;
  handleIconHover: (index: number, value: boolean) => void;
  columns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
  setIsEditing: (val: boolean) => void;
  onDragActiveChange?: (active: boolean) => void;
  adminMode?: boolean;
};

export default function TrainingTable({
  rows,
  setRows,
  handleEffortChange,
  handleCheckboxChange,
  handleIncrementSeries,
  handleDecrementSeries,
  handleIconHover,
  columns,
  setIsEditing,
  onDragActiveChange,
  adminMode,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const dragOverlayDropAnimation = {
    ...defaultDropAnimation,
    duration: 360,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  } as const;

  const [dragActive, setDragActive] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const router = useRouter();

  const isVisible = (name: string) => columns.find(c => c.name === name)?.visible;
  const [dragGroup, setDragGroup] = useState<Row[]>([]);
  const dragGroupRef = useRef<Row[]>([]);
  const lastOverIdRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cancelScheduledReorder = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resetIconHoverState = useCallback(() => {
    setRows((previousRows) => {
      let hasChanges = false;
      const updatedRows = previousRows.map((row) => {
        if (!row.iconHovered) {
          return row;
        }

        hasChanges = true;
        return {
          ...row,
          iconHovered: false,
        };
      });

      return hasChanges ? updatedRows : previousRows;
    });
  }, [setRows]);

  const applyScheduledReorder = useCallback(() => {
    animationFrameRef.current = null;
    const overId = lastOverIdRef.current;
    if (!overId) {
      return;
    }

    let nextGroup: Row[] | null = null;

    setRows((prevRows) => {
      const currentGroup = dragGroupRef.current;
      if (currentGroup.length === 0) {
        return prevRows;
      }

      const groupSet = new Set(currentGroup);
      const sortedGroupRows = prevRows.filter((row) => groupSet.has(row));
      if (sortedGroupRows.length === 0) {
        return prevRows;
      }

      const overIndex = prevRows.findIndex((row) => (row.id ?? "").toString() === overId);
      if (overIndex === -1) {
        return prevRows;
      }

      const overRow = prevRows[overIndex];
      if (groupSet.has(overRow)) {
        return prevRows;
      }

      const firstGroupIndex = prevRows.findIndex((row) => row === sortedGroupRows[0]);
      if (firstGroupIndex === -1) {
        return prevRows;
      }

      const remainingRows = prevRows.filter((row) => !groupSet.has(row));

      const insertIndex =
        overIndex < firstGroupIndex
          ? overIndex
          : overIndex - sortedGroupRows.length + 1;

      const clampedInsertIndex = Math.max(0, Math.min(insertIndex, remainingRows.length));

      const updatedRows = [
        ...remainingRows.slice(0, clampedInsertIndex),
        ...sortedGroupRows,
        ...remainingRows.slice(clampedInsertIndex),
      ];

      const didChange = updatedRows.some((row, index) => row !== prevRows[index]);
      if (!didChange) {
        return prevRows;
      }

      nextGroup = sortedGroupRows;
      dragGroupRef.current = sortedGroupRows;
      return updatedRows;
    });

    if (nextGroup) {
      setDragGroup(nextGroup);
    }
  }, [setRows, setDragGroup]);

  const scheduleReorder = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(applyScheduledReorder);
    }
  }, [applyScheduledReorder]);

  useEffect(() => () => {
    cancelScheduledReorder();
  }, [cancelScheduledReorder]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedRow = rows.find((r) => r.id === event.active.id);
    if (!draggedRow) return;

    lastOverIdRef.current = null;

    if (draggedRow.superset_id) {
      const group = rows.filter((r) => r.superset_id === draggedRow.superset_id);
      setDragGroup(group);
      dragGroupRef.current = group;
    } else {
      setDragGroup([draggedRow]);
      dragGroupRef.current = [draggedRow];
    }

    setDragActive(true);
    onDragActiveChange?.(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!active?.id || !over?.id || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = rows.findIndex(r => r.id?.toString() === activeId);
    const overIndex = rows.findIndex(r => r.id?.toString() === overId);
    if (oldIndex === -1 || overIndex === -1) return;
    if (oldIndex === overIndex) return;

    const overRow = rows[overIndex];
    const draggedIsSameGroup =
      dragGroup.length > 0 &&
      dragGroup.every(r => r.superset_id === overRow.superset_id);

    if (overRow.superset_id && !draggedIsSameGroup) {
      const group = rows.filter(r => r.superset_id === overRow.superset_id);
      const start = rows.findIndex(r => r.id === group[0].id);
      const end = start + group.length - 1;

      const isInGroup = overIndex >= start && overIndex <= end;
      if (isInGroup) return;
    }

    lastOverIdRef.current = overId;
    scheduleReorder();
  };

  const handleDragEnd = () => {
    resetIconHoverState();
    setDragActive(false);
    onDragActiveChange?.(false);
    setDragGroup([]);
    dragGroupRef.current = [];
    lastOverIdRef.current = null;
    cancelScheduledReorder();
  };

  const getSupersetGroups = () => {
    const groups: { id: string; start: number; end: number; locked: boolean }[] = [];
    let currentId: string | null = null;
    let startIndex = -1;

    rows.forEach((row, index) => {
      if (row.superset_id && row.superset_id !== currentId) {
        if (currentId !== null && startIndex !== -1) {
          const groupRows = rows.slice(startIndex, index);
          const isLocked = groupRows.some(r => r.locked || r.superset_id_locked);
          groups.push({ id: currentId, start: startIndex, end: index - 1, locked: isLocked });
        }
        currentId = row.superset_id;
        startIndex = index;
      } else if (!row.superset_id && currentId !== null) {
        const groupRows = rows.slice(startIndex, index);
        const isLocked = groupRows.some(r => r.locked || r.superset_id_locked);
        groups.push({ id: currentId, start: startIndex, end: index - 1, locked: isLocked });
        currentId = null;
        startIndex = -1;
      }
    });

    if (currentId && startIndex !== -1) {
      const groupRows = rows.slice(startIndex);
      const isLocked = groupRows.some(r => r.locked || r.superset_id_locked);
      groups.push({ id: currentId, start: startIndex, end: rows.length - 1, locked: isLocked });
    }

    return groups;
  };

  const groups = getSupersetGroups();

  const isLastSupersetAtBottom =
    groups.length > 0 &&
    groups[groups.length - 1].end === rows.length - 1;

  return (
    <div className="relative overflow-hidden rounded-tl-[5px] rounded-tr-[5px] border border-[#ECE9F1]">
      {getSupersetGroups().map((group) => (
        !dragActive || !dragGroup.some(r => r.superset_id === group.id) ? (
          <div
            key={group.id}
            className="absolute left-0 right-0 border-[2px] border-dotted pointer-events-none"
            style={{
              top: `${group.start * 40 + 40}px`,
              border: "none",
              zIndex: 5,
              pointerEvents: "none",
              width: "1150px",
              borderColor: group.locked ? "#D7D4DC" : "#7069FA",
              height: `${(group.end - group.start + 1) * 40 + 1}px`,
              backgroundImage:
                `linear-gradient(to right, ${group.locked ? "#D7D4DC" : "#7069FA"} 4px, transparent 4px), ` +
                `linear-gradient(to bottom, ${group.locked ? "#D7D4DC" : "#7069FA"} 4px, transparent 4px), ` +
                `linear-gradient(to right, ${group.locked ? "#D7D4DC" : "#7069FA"} 4px, transparent 4px), ` +
                `linear-gradient(to bottom, ${group.locked ? "#D7D4DC" : "#7069FA"} 4px, transparent 4px)`,
              backgroundRepeat: "repeat-x, repeat-y, repeat-x, repeat-y",
              backgroundPosition: "top left, top right, bottom left, top left",
              backgroundSize: "8px 2px, 2px 8px, 8px 2px, 2px 8px"
            }}
          />
        ) : null
      ))}

      <DndContext
        sensors={sensors}
        collisionDetection={centerVerticalCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={rows.map((row, index) => (row.id ?? `temp-${index}`).toString())}
          strategy={verticalListSortingStrategy}
        >
          <table
            className="w-full text-[14px] font-medium border-collapse bg-[#E0E0E0] table-fixed"
            style={{
              borderSpacing: "0px",
              marginBottom: isLastSupersetAtBottom ? "1px" : "0px"
            }}
          >
            <thead className="bg-[#7069FA] text-white text-left h-10">
              <tr>
                <th className="text-[15px] border-r rounded-tl-[5px] px-3 py-2 font-semibold" style={{ maxWidth: "60px", width: "60px" }}></th>
                <th className="text-[15px] border-r px-3 py-2 font-semibold">Exercices</th>
                {isVisible("materiel") && (
                  <th className="text-[15px] border-r px-3 py-2 font-semibold text-left" style={{ maxWidth: "135px", width: "135px" }}>Matériel</th>
                )}
                <th className="text-[15px] border-r font-semibold text-center" style={{ maxWidth: "60px", width: "60px" }}>Séries</th>
                <th className="text-[15px] border-r font-semibold text-center" style={{ maxWidth: "157px", width: "157px" }}>Répétitions</th>
                <th className="text-[15px] border-r px-3 py-2 font-semibold text-center" style={{ maxWidth: "157px", width: "157px" }}>Poids</th>
                {isVisible("repos") && (
                  <th className="text-[15px] border-r px-2 py-2 font-semibold text-center" style={{ maxWidth: "60px", width: "60px" }}>Repos</th>
                )}
                {isVisible("effort") && (
                  <th className="text-[15px] px-3 py-2 font-semibold text-center" style={{ maxWidth: "237px", width: "237px" }}>Effort</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <TrainingRow
                  key={row.id ?? `temp-${index}`}
                  row={row}
                  index={index}
                  setRows={setRows}
                  handleEffortChange={handleEffortChange}
                  handleCheckboxChange={handleCheckboxChange}
                  handleIncrementSeries={handleIncrementSeries}
                  handleDecrementSeries={handleDecrementSeries}
                  handleIconHover={handleIconHover}
                  columns={columns}
                  setIsEditing={setIsEditing}
                  isHidden={dragActive && dragGroup.some(d => d.id === row.id)}
                  adminMode={adminMode}
                  onUnlockClick={() => setIsUnlockModalOpen(true)}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
        <DragOverlay dropAnimation={dragOverlayDropAnimation}>
          {dragGroup.length > 0 && (
            <div className="relative">
              {dragGroup.length > 1 && (
                <div
                  className="absolute left-0 right-0 z-[100] pointer-events-none"
                  style={{
                    top: 0,
                    width: "1150px",
                    height: `${dragGroup.length * 40 + 1}px`,
                    backgroundImage:
                      "linear-gradient(to right, #7069FA 4px, transparent 4px), " +
                      "linear-gradient(to bottom, #7069FA 4px, transparent 4px), " +
                      "linear-gradient(to right, #7069FA 4px, transparent 4px), " +
                      "linear-gradient(to bottom, #7069FA 4px, transparent 4px)",
                    backgroundRepeat: "repeat-x, repeat-y, repeat-x, repeat-y",
                    backgroundPosition: "top left, top right, bottom left, top left",
                    backgroundSize: "8px 2px, 2px 8px, 8px 2px, 2px 8px"
                  }}
                />
              )}
              <table className="w-full text-[14px] font-medium border-collapse table-fixed" style={{ borderSpacing: "0px" }}>
                <tbody>
                  {dragGroup.map((row, index) => (
                    <TrainingRowOverlay
                      key={row.id ?? `temp-${index}`}
                      row={row}
                      columns={columns}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <UnlockTrainingModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlock={() => {
          setIsUnlockModalOpen(false);
          router.push("/compte");
        }}
      />
    </div>
  );
}
