"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Program, Training } from "@/types/training";
import { useRouter } from "next/navigation";
import ProgramEditor from "@/components/ProgramEditor";
import ProgramDeleteModal from "@/components/ProgramDeleteModal";
import usePrograms from "@/hooks/usePrograms";
import DroppableProgram, {
  type LoadingTrainingState,
} from "@/components/DroppableProgram";
import DragPreviewItem from "@/components/training/DragPreviewItem";
import ProgramsSkeleton from "@/components/training/ProgramsSkeleton";

import {
  DndContext,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";
import { notifyTrainingChange } from "@/components/ProgramEditor";

const MINIMUM_TRAINING_SPINNER_DURATION = 2000;

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

export default function EntrainementsPage() {
  const {
    programs,
    isLoading,
    fetchProgramsWithTrainings,
    handleReorderTrainings,
    handleDuplicateTraining,
    handleSubmit,
    handleAddTraining,
    handleDeleteTraining,
    handleChangeName,
    handleDeleteProgram,
    moveTrainingToAnotherProgram,
    handleUpdateTrainingVisibility,
    reorderTrainingsLocally,
    moveTrainingLocally,
    moveProgramUp,
    moveProgramDown,
    handleDuplicateProgram,
  } = usePrograms();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [showProgramDeleteModal, setShowProgramDeleteModal] = useState(false);
  const [programIdToDelete, setProgramIdToDelete] = useState<string | null>(null);

  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  const [openVisibilityIds, setOpenVisibilityIds] = useState<string[]>([]);
  const [programsDuringDrag, setProgramsDuringDrag] = useState<Program[] | null>(null);

  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor));

  const [newlyDownloadedId, setNewlyDownloadedId] = useState<string | null>(null);
  const [loadingTraining, setLoadingTraining] = useState<LoadingTrainingState>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("newly_downloaded_program_id");
    if (id) {
      setNewlyDownloadedId(id);
      localStorage.removeItem("newly_downloaded_program_id");
    }
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel("glift-refresh");
    channel.onmessage = (event) => {
      if (event.data === "refresh-all-programs") {
        console.log("🟣 refresh-all-programs reçu");
        fetchProgramsWithTrainings();
      }
    };
    return () => channel.close();
  }, [fetchProgramsWithTrainings]);

  const handleTrainingNavigation = useCallback(
    async (trainingId: string) => {
      if (loadingTraining) return;
      setLoadingTraining({ id: trainingId, type: "open" });
      await wait(MINIMUM_TRAINING_SPINNER_DURATION);
      if (!isMountedRef.current) return;
      router.push(`/entrainements/${trainingId}`);
    },
    [loadingTraining, router]
  );

  const programsToRender = (programsDuringDrag ?? programs).filter((p, i) => {
    const isEmpty = p.trainings.length === 0;
    const isLast = i === (programsDuringDrag ?? programs).length - 1;
    return !isEmpty || isLast;
  });

  const lastActiveIndex = programsToRender.reduce(
    (lastIdx, p, i) => (p.trainings.length > 0 ? i : lastIdx),
    -1
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { id, data } = event.active;
    setActiveProgramId(data?.current?.programId ?? null);

    const current = programs
      .flatMap((p) => p.trainings)
      .find((t: Training) => t.id === id);

    setActiveTraining(current || null);
    setProgramsDuringDrag(JSON.parse(JSON.stringify(programs)));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const fromProgramId = activeProgramId;
    const toProgramId = over?.data?.current?.programId;

    if (!over || !fromProgramId || !toProgramId) return;
    if (fromProgramId === toProgramId) return;

    const training = programs
      .find((p) => p.id === fromProgramId)
      ?.trainings.find((t: Training) => t.id === active.id);

    if (!training) return;

    let newIndex = 0;
    const destProgram = (programsDuringDrag ?? programs).find((p) => p.id === toProgramId);
    const destTrainings: Training[] = destProgram?.trainings ?? [];

    if (over.id && typeof over.id === 'string') {
      if (over.id.toString().startsWith('add-button-')) {
        newIndex = destTrainings.length;
      } else {
        const index = destTrainings.findIndex((t: Training) => t.id === over.id);
        newIndex = index >= 0 ? index + 1 : destTrainings.length;
      }
    }

    setProgramsDuringDrag((prev) => {
      if (!prev) return prev;
      return moveTrainingLocallyImmutable(prev, training, fromProgramId, toProgramId, newIndex);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setProgramsDuringDrag(null);
    const { active, over } = event;
    if (!over) return;

    const fromProgramId = activeProgramId;
    const toProgramId = over?.data?.current?.programId ?? null;
    const trainingId = active.id as string;

    if (active.id === over.id && fromProgramId === toProgramId) {
      return;
    }

    if (fromProgramId && toProgramId && fromProgramId !== toProgramId) {
      const destProgram = programs.find((p) => p.id === toProgramId);
      const destTrainings = destProgram?.trainings ?? [];

      let position = destTrainings.length;

      if (over.id && typeof over.id === 'string') {
        if (over.id.toString().startsWith('add-button-')) {
          position = destTrainings.length;
        } else if (over.id === active.id) {
          position = destTrainings.length;
        } else {
          const index = destTrainings.findIndex((t: Training) => t.id === over.id);
          const containsDragged = destTrainings.some((t: Training) => t.id === active.id);

          if (!containsDragged) {
            position = index >= 0 ? index : destTrainings.length;
          } else {
            const adjustedIndex = destTrainings
              .filter((t: Training) => t.id !== active.id)
              .findIndex((t: Training) => t.id === over.id);
            position = adjustedIndex >= 0 ? adjustedIndex : destTrainings.length;
          }
        }
      }

      const alreadyInTarget = destTrainings.some((t: Training) => t.id === trainingId);
      if (!alreadyInTarget) {
        const training = programs
          .find((p) => p.id === fromProgramId)
          ?.trainings.find((t: Training) => t.id === trainingId);
        if (training) {
          moveTrainingLocally(training, fromProgramId, toProgramId, position);
        }
      }

      await moveTrainingToAnotherProgram(trainingId, fromProgramId, toProgramId, position);
      notifyTrainingChange(toProgramId);

    } else if (fromProgramId === toProgramId) {
      const program = programs.find((p) => p.id === fromProgramId);
      if (!program) return;
      const oldIndex = program.trainings.findIndex((t: Training) => t.id === active.id);
      const newIndex = program.trainings.findIndex((t: Training) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedIds = [...program.trainings];
        const [moved] = reorderedIds.splice(oldIndex, 1);
        reorderedIds.splice(newIndex, 0, moved);

        if (fromProgramId) {
          reorderTrainingsLocally(
            fromProgramId,
            reorderedIds.map((t: Training) => t.id)
          );
          await handleReorderTrainings(
            fromProgramId,
            reorderedIds.map((t: Training) => t.id)
          );
        }
      }
    }
  };

  function moveTrainingLocallyImmutable(
    currentPrograms: Program[],
    training: Training,
    fromProgramId: string,
    toProgramId: string,
    position: number
  ): Program[] {
    return currentPrograms.map((program): Program => {
      if (program.id === fromProgramId) {
        return {
          ...program,
          trainings: program.trainings.filter((t: Training) => t.id !== training.id),
        };
      }
      if (program.id === toProgramId) {
        const alreadyInTarget = program.trainings.some((t: Training) => t.id === training.id);
        let newTrainings = [...program.trainings];

        if (!alreadyInTarget) {
          newTrainings.splice(position, 0, training);
        } else {
          newTrainings = newTrainings.filter((t: Training) => t.id !== training.id);
          newTrainings.splice(position, 0, training);
        }

        return {
          ...program,
          trainings: newTrainings,
        };
      }
      return program;
    });
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div
        id="training-scroll-container"
        className="max-w-[1152px] mx-auto text-center flex flex-col items-center"
      >
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">Entraînements</h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug mb-[40px]">
          Gérez vos programmes et vos entraînements.<br className="hidden sm:block" />
          Choisissez ceux que vous souhaitez retrouver dans l’app et sur votre tableau de bord.
        </p>

        {isLoading ? (
          <ProgramsSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {programsToRender.map((program, index) => {
              const computedZIndex = programsToRender.length - index;

              return (
                <div
                  key={program.id || index}
                  className="relative w-full max-w-[1152px] mb-[20px]"
                  style={{ zIndex: computedZIndex }}
                >
                  <ProgramEditor
                    name={program.name ?? ""}
                    index={index}
                    editingIndex={editingIndex}
                    onChangeName={handleChangeName}
                    onSubmit={() => {
                      handleSubmit(index);
                      setEditingIndex(null);
                    }}
                    onStartEdit={setEditingIndex}
                    onCancel={() => setEditingIndex(null)}
                    programId={program.id}
                    isVisible={visibility[program.id] !== false}
                    onToggleVisibility={() => {
                      setVisibility((prev) => ({
                        ...prev,
                        [program.id]: !prev[program.id],
                      }));
                    }}
                    onDelete={() => {
                      if (programs.length <= 1) return;
                      setShowProgramDeleteModal(true);
                      setProgramIdToDelete(program.id);
                    }}
                    isFirst={index === 0}
                    isLastActive={index === lastActiveIndex}
                    onMoveUp={() => moveProgramUp(index)}
                    onMoveDown={() => moveProgramDown(index)}
                    onDuplicate={() => handleDuplicateProgram(index)}
                    zIndex={computedZIndex}
                    tableName="trainings"
                    programsTableName="programs"
                    isNew={program.id === newlyDownloadedId}
                  />

                  <DroppableProgram
                    programId={program.id}
                    trainings={program.trainings}
                    onClickTraining={handleTrainingNavigation}
                    onReorderTrainings={(programId: string, ids: string[]) =>
                      handleReorderTrainings(programId, ids)
                    }
                    onAddTraining={async () => {
                      if (loadingTraining) return;
                      if (!program.id) return;

                      const newData = await handleAddTraining(program.id);
                      if (newData?.id) {
                        setLoadingTraining({ id: newData.id, type: "add" });
                        await wait(MINIMUM_TRAINING_SPINNER_DURATION);
                        if (!isMountedRef.current) return;
                        router.push(`/entrainements/${newData.id}?new=1`);
                      }
                    }}
                    onDeleteTraining={(id: string) =>
                      handleDeleteTraining(program.id, id)
                    }
                    onDuplicateTraining={(id: string) =>
                      handleDuplicateTraining(program.id, id)
                    }
                    onDropTraining={moveTrainingToAnotherProgram}
                    openVisibilityIds={openVisibilityIds}
                    setOpenVisibilityIds={setOpenVisibilityIds}
                    onUpdateTrainingVisibility={handleUpdateTrainingVisibility}
                    loadingTraining={loadingTraining}
                  />
                </div>
              );
            })}

            <DragOverlay>
              {activeTraining && (
                <DragPreviewItem training={activeTraining} />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <ProgramDeleteModal
        show={showProgramDeleteModal}
        onCancel={() => {
          setShowProgramDeleteModal(false);
          setProgramIdToDelete(null);
        }}
        onConfirm={async () => {
          if (!programIdToDelete) return;
          await handleDeleteProgram(programIdToDelete);
          setShowProgramDeleteModal(false);
          setProgramIdToDelete(null);
        }}
      />
    </main>
  );
}
