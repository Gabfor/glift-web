"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Program, Training } from "@/types/training";
import { useRouter } from "next/navigation";
import ProgramEditor from "@/components/ProgramEditor";
import ProgramDeleteModal from "@/components/ProgramDeleteModal";
import usePrograms from "@/hooks/usePrograms";
import { useUser } from "@/context/UserContext";
import DroppableProgram, {
  type LoadingTrainingState,
} from "@/components/DroppableProgram";
import DragPreviewItem from "@/components/training/DragPreviewItem";
import ProgramsSkeleton from "@/components/training/ProgramsSkeleton";
import UnlockTrainingModal from "@/components/UnlockTrainingModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

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

const MINIMUM_TRAINING_SPINNER_DURATION = 1000;

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

import TrainingDeleteWarningModal from "@/components/TrainingDeleteWarningModal";

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

  const { isPremiumUser } = useUser();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showProgramDeleteModal, setShowProgramDeleteModal] = useState(false);
  const [programIdToDelete, setProgramIdToDelete] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const [showTrainingDeleteWarningModal, setShowTrainingDeleteWarningModal] = useState(false);
  const [trainingIdToDelete, setTrainingIdToDelete] = useState<string | null>(null);
  const [programIdForTrainingDelete, setProgramIdForTrainingDelete] = useState<string | null>(null);

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
        fetchProgramsWithTrainings({ showLoading: false });
      }
    };
    return () => channel.close();
  }, [fetchProgramsWithTrainings]);

  // Sync 'locked' column with subscription status and position
  const supabase = useSupabaseClient();
  useEffect(() => {
    if (isLoading || !programs) return;

    const syncLocks = async () => {
      const toLock: string[] = [];
      const toUnlock: string[] = [];
      let targetUnlockedId: string | null = null;

      if (!isPremiumUser && programs.length > 0) {
        // Check current state
        const allTrainings = programs.flatMap(p => p.trainings);
        const unlockedCount = allTrainings.filter(t => t.locked === false).length;

        // FREEZE STATE:
        // If 1 unlocked: Freeze (User choice preserved).
        // If 0 unlocked: Freeze (User deleted active, or new user).
        // Only if > 1 (e.g. Downgrade from Premium) do we intervene to lock excess.
        if (unlockedCount <= 1) {
          return;
        }

        // Unlock 1st training of 1st VISIBLE program
        for (const program of programs) {
          if (program.app === false) continue;

          const sortedTrainings = [...program.trainings].sort((a, b) => a.position - b.position);
          const firstTraining = sortedTrainings.find(t => t.app !== false);
          if (firstTraining) {
            targetUnlockedId = firstTraining.id;
            break;
          }
        }

        // Fallback: If no visible program/training found (e.g. all programs hidden),
        // fallback to the first training of the ABSOLUTE first program.
        if (!targetUnlockedId) {
          const firstProgram = programs[0];
          const sortedTrainings = [...firstProgram.trainings].sort((a, b) => a.position - b.position);

          if (sortedTrainings.length > 0) {
            targetUnlockedId = sortedTrainings[0].id;
          }
        }
      }

      programs.forEach((program) => {
        program.trainings.forEach((training) => {
          let shouldBeLocked = false;

          if (!isPremiumUser) {
            if (training.id === targetUnlockedId) {
              shouldBeLocked = false;
            } else {
              shouldBeLocked = true;
            }
          } else {
            shouldBeLocked = false;
          }

          if (training.locked !== shouldBeLocked) {
            if (shouldBeLocked) {
              toLock.push(training.id);
            } else {
              toUnlock.push(training.id);
            }
          }
        });
      });

      let hasChanges = false;
      if (toLock.length > 0) {
        const { data, error } = await supabase.from('trainings').update({ locked: true }).in('id', toLock).select('id');
        if (!error && data && data.length > 0) hasChanges = true;
      }

      if (toUnlock.length > 0) {
        const { data, error } = await supabase.from('trainings').update({ locked: false }).in('id', toUnlock).select('id');
        if (!error && data && data.length > 0) hasChanges = true;
      }

      if (hasChanges) {
        fetchProgramsWithTrainings({ showLoading: false });
      }
    };

    syncLocks();
  }, [programs, isPremiumUser, isLoading, supabase]);

  const handleTrainingNavigation = useCallback(
    async (trainingId: string) => {
      console.log("Navigating to:", trainingId);
      if (loadingTraining) {
        console.log("Navigation blocked: already loading", loadingTraining);
        return;
      }
      setLoadingTraining({ id: trainingId, type: "open" });
      await wait(MINIMUM_TRAINING_SPINNER_DURATION);
      if (!isMountedRef.current) return;
      router.push(`/entrainements/${trainingId}`);
    },
    [loadingTraining, router]
  );

  const basePrograms = programsDuringDrag ?? programs;

  const programsToRender = basePrograms
    .map((program, originalIndex) => ({ program, originalIndex }))
    .filter(({ program, originalIndex }) => {
      const isEmpty = program.trainings.length === 0;
      const isLast = originalIndex === basePrograms.length - 1;

      return !isEmpty || isLast;
    });

  const lastActiveIndex = programsToRender.reduce(
    (lastIdx, { program }, i) => (program.trainings.length > 0 ? i : lastIdx),
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
    if (!isPremiumUser) return;
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
    if (!isPremiumUser) return;

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
            {programsToRender.map(({ program, originalIndex }, index) => {
              const computedZIndex = programsToRender.length - index;

              return (
                <div
                  key={program.id || originalIndex}
                  className="relative w-full max-w-[1152px] mb-[20px]"
                  style={{ zIndex: computedZIndex }}
                >
                  <ProgramEditor
                    name={program.name ?? ""}
                    index={originalIndex}
                    editingIndex={editingIndex}
                    onChangeName={handleChangeName}
                    onSubmit={() => {
                      handleSubmit(originalIndex);
                      setEditingIndex(null);
                    }}
                    onStartEdit={setEditingIndex}
                    onCancel={() => setEditingIndex(null)}
                    programId={program.id}
                    isVisible={program.app !== false}
                    dashboardVisible={program.dashboard !== false}
                    onToggleVisibility={() => fetchProgramsWithTrainings({ showLoading: false })}
                    onDelete={() => {
                      if (programs.length <= 1) return;
                      setShowProgramDeleteModal(true);
                      setProgramIdToDelete(program.id);
                    }}
                    isFirst={originalIndex === 0}
                    isLastActive={index === lastActiveIndex}
                    onMoveUp={() => moveProgramUp(originalIndex)}
                    onMoveDown={() => moveProgramDown(originalIndex)}
                    onDuplicate={() => handleDuplicateProgram(originalIndex)}
                    zIndex={computedZIndex}
                    tableName="trainings"
                    programsTableName="programs"
                    isNew={program.id === newlyDownloadedId}
                    shouldWarnOnHide={
                      !isPremiumUser &&
                      program.app !== false && // It is currently visible
                      programsToRender.filter(p => p.program.app !== false && p.program.trainings.length > 0).length === 1 && // It is the only one visible
                      programsToRender.filter(p => p.program.app !== false && p.program.trainings.length > 0)[0].program.id === program.id // And it's this one
                    }
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
                    onDeleteTraining={(id: string) => {
                      if (!isPremiumUser) {
                        const training = program.trainings.find(t => t.id === id);
                        const isLocked = training?.locked ?? true;

                        if (!isLocked) {
                          setShowTrainingDeleteWarningModal(true);
                          setTrainingIdToDelete(id);
                          setProgramIdForTrainingDelete(program.id);
                          return;
                        }
                      }

                      handleDeleteTraining(program.id, id);
                    }}
                    onDuplicateTraining={(id: string) =>
                      handleDuplicateTraining(program.id, id)
                    }
                    onDropTraining={moveTrainingToAnotherProgram}
                    openVisibilityIds={openVisibilityIds}
                    setOpenVisibilityIds={setOpenVisibilityIds}
                    onUpdateTrainingVisibility={handleUpdateTrainingVisibility}
                    loadingTraining={loadingTraining}
                    isFirstProgram={index === 0}
                    onUnlockClick={() => setShowUnlockModal(true)}
                    allowAddTraining={
                      // Enable if NO active (unlocked) trainings exist across ALL programs
                      !isPremiumUser &&
                      programs.flatMap(p => p.trainings).filter(t => t.locked === false).length === 0
                    }
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

      <TrainingDeleteWarningModal
        show={showTrainingDeleteWarningModal}
        onCancel={() => {
          setShowTrainingDeleteWarningModal(false);
          setTrainingIdToDelete(null);
          setProgramIdForTrainingDelete(null);
        }}
        onConfirm={async () => {
          if (!trainingIdToDelete || !programIdForTrainingDelete) return;
          await handleDeleteTraining(programIdForTrainingDelete, trainingIdToDelete);
          setShowTrainingDeleteWarningModal(false);
          setTrainingIdToDelete(null);
          setProgramIdForTrainingDelete(null);
        }}
      />

      <UnlockTrainingModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={() => router.push("/compte#mon-abonnement")}
      />
    </main>
  );
}
