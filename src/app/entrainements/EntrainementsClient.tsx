"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Program, Training } from "@/types/training";
import { useRouter, notFound } from "next/navigation";
import ProgramEditor from "@/components/ProgramEditor";
import ProgramDeleteModal from "@/components/ProgramDeleteModal";
import usePrograms from "@/hooks/usePrograms";
import { useUser } from "@/context/UserContext";
import DroppableProgram, {
  type LoadingTrainingState,
} from "@/components/DroppableProgram";
import DragPreviewItem from "@/components/training/DragPreviewItem";
import ProgramsSkeleton, {
  type ProgramSkeletonMeta,
} from "@/components/training/ProgramsSkeleton";
import AddTrainingLockedModal from "@/components/AddTrainingLockedModal";
import UnlockTrainingModal from "@/components/UnlockTrainingModal";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import { useSmoothAutoScroll } from "@/hooks/useSmoothAutoScroll";
import { cn } from "@/lib/utils";

import { useSupabaseClient } from "@supabase/auth-helpers-react";

import {
  DndContext,
  rectIntersection,
  pointerWithin,
  closestCenter,
  MeasuringStrategy,
  type CollisionDetection,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  AutoScrollActivator,
  DragOverlay,
} from "@dnd-kit/core";
import { notifyTrainingChange } from "@/components/ProgramEditor";

import TrainingDeleteWarningModal from "@/components/TrainingDeleteWarningModal";

export default function EntrainementsPage({
  initialPageContent,
}: {
  initialPageContent: { surtitre: string; titre: string; description: string };
}) {
  const {
    programs,
    isLoading,
    fetchProgramsWithTrainings,
    handleReorderTrainings,
    handleDuplicateTraining,
    handleRenameTraining,
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

  const { isPremiumUser, isUserDataLoaded } = useUser();

  const showSkeleton = useMinimumVisibility(isLoading || !isUserDataLoaded, 400); // 400ms masks the very fast client fetch to match SSR feeling

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showProgramDeleteModal, setShowProgramDeleteModal] = useState(false);
  const [programIdToDelete, setProgramIdToDelete] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAddTrainingLockedModal, setShowAddTrainingLockedModal] = useState(false);

  const [showTrainingDeleteWarningModal, setShowTrainingDeleteWarningModal] = useState(false);
  const [trainingIdToDelete, setTrainingIdToDelete] = useState<string | null>(null);
  const [programIdForTrainingDelete, setProgramIdForTrainingDelete] = useState<string | null>(null);

  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  useSmoothAutoScroll(Boolean(activeTraining));

  const [openVisibilityIds, setOpenVisibilityIds] = useState<string[]>([]);
  const [programsDuringDrag, setProgramsDuringDrag] = useState<Program[] | null>(null);

  const router = useRouter();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const pageIntro = initialPageContent;

  const [newlyDownloadedId, setNewlyDownloadedId] = useState<string | null>(null);
  const [loadingTraining, setLoadingTraining] = useState<LoadingTrainingState>(null);
  const isMountedRef = useRef(true);

  const [cachedStructure, setCachedStructure] = useState<ProgramSkeletonMeta[] | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("programs_skeleton_structure");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedStructure(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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

  const scrolledProgramIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!newlyDownloadedId || showSkeleton || scrolledProgramIdRef.current === newlyDownloadedId) return;

    let retryTimeout: NodeJS.Timeout;
    let attempts = 0;

    const tryScroll = () => {
      attempts++;
      const targetElement = document.getElementById(`program-${newlyDownloadedId}`);
      if (targetElement) {
        scrolledProgramIdRef.current = newlyDownloadedId;
        requestAnimationFrame(() => {
          const isMobile = window.innerWidth < 768;
          const headerOffset = isMobile ? 85 : 110;
          const rect = targetElement.getBoundingClientRect();
          const targetY = rect.top + window.scrollY - headerOffset;

          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "smooth",
          });
        });
      } else if (attempts < 10) {
        retryTimeout = setTimeout(tryScroll, 100);
      }
    };

    const initialTimer = setTimeout(tryScroll, 100);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(retryTimeout);
    };
  }, [showSkeleton, newlyDownloadedId, programs]);

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
    if (isLoading || !programs || !isUserDataLoaded) return;

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
  }, [programs, isPremiumUser, isLoading, isUserDataLoaded, supabase]);

  const handleTrainingNavigation = useCallback(
    (trainingId: string) => {
      setLoadingTraining({ id: trainingId, type: "open" });
      router.push(`/entrainements/${trainingId}`);
    },
    [router]
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

  useEffect(() => {
    if (!isLoading && isUserDataLoaded && programsToRender.length > 0) {
      try {
        const struct: ProgramSkeletonMeta[] = programsToRender.map(({ program }) => ({
          trainingCount: program.trainings ? program.trainings.length : 0,
        }));
        localStorage.setItem("programs_skeleton_structure", JSON.stringify(struct));
      } catch {
        // ignore
      }
    }
  }, [isLoading, isUserDataLoaded, programsToRender]);

  const lastOverId = useRef<string | null>(null);
  const programsDuringDragRef = useRef(programsDuringDrag);
  programsDuringDragRef.current = programsDuringDrag;
  const programsRef = useRef(programs);
  programsRef.current = programs;

  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // 1. Check pointerWithin first
    const pointerCollisions = pointerWithin(args);
    let collisions = pointerCollisions;

    // 2. If no direct pointer collisions, check rectIntersection
    if (collisions.length === 0) {
      collisions = rectIntersection(args);
    }

    // 3. Fallback to closestCenter
    if (collisions.length === 0) {
      collisions = closestCenter(args);
    }

    if (collisions.length > 0) {
      const currentPrograms = programsDuringDragRef.current ?? programsRef.current;
      // Prioritize SortableItem (training card) over DroppableProgram (container)
      const itemCollision = collisions.find((c) =>
        currentPrograms.some((p) => p.trainings.some((t) => t.id === c.id))
      );

      const selectedCollision = itemCollision ?? collisions[0];
      lastOverId.current = String(selectedCollision.id);
      return [selectedCollision];
    }

    // 4. If completely outside, return lastOverId if still in droppableContainers
    if (lastOverId.current) {
      const lastContainer = args.droppableContainers.find(
        (c) => c.id === lastOverId.current
      );
      if (lastContainer) {
        return [{ id: lastOverId.current, data: { droppableContainer: lastContainer } }];
      }
    }

    return [];
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch {
        // ignore
      }
    }
    const { id, data } = event.active;
    setActiveProgramId(data?.current?.programId ?? null);
    lastOverId.current = String(id);

    const current = programs
      .flatMap((p) => p.trainings)
      .find((t: Training) => t.id === id);

    setActiveTraining(current || null);
    setProgramsDuringDrag(JSON.parse(JSON.stringify(programs)));
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isPremiumUser) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const currentPrograms = programsDuringDrag ?? programs;

    // Which program currently holds activeId?
    const fromProgram = currentPrograms.find((p) =>
      p.trainings.some((t) => t.id === activeId)
    );
    const fromProgramId = fromProgram?.id;

    // Which program does overId belong to?
    const toProgram = currentPrograms.find(
      (p) => p.id === overId || p.trainings.some((t) => t.id === overId)
    );
    const toProgramId = toProgram?.id ?? over.data?.current?.programId;

    if (!fromProgramId || !toProgramId) return;

    const activeTrainingItem =
      activeTraining ??
      programs
        .flatMap((p) => p.trainings)
        .find((t) => t.id === activeId);

    if (!activeTrainingItem) return;

    // Case 1: Moving between DIFFERENT programs
    if (fromProgramId !== toProgramId) {
      setProgramsDuringDrag((prev) => {
        const currentList = prev ?? programs;
        const destProgram = currentList.find((p) => p.id === toProgramId);
        const destTrainings = destProgram?.trainings ?? [];

        let newIndex: number;
        if (overId === toProgramId || overId.startsWith("add-button-")) {
          newIndex = destTrainings.length;
        } else {
          const overIndex = destTrainings.findIndex((t) => t.id === overId);
          newIndex = overIndex >= 0 ? overIndex : destTrainings.length;
        }

        return currentList.map((program) => {
          if (program.id === fromProgramId) {
            return {
              ...program,
              trainings: program.trainings.filter((t) => t.id !== activeId),
            };
          }
          if (program.id === toProgramId) {
            const trainingsWithoutActive = program.trainings.filter(
              (t) => t.id !== activeId
            );
            const clampedIndex = Math.max(
              0,
              Math.min(newIndex, trainingsWithoutActive.length)
            );
            trainingsWithoutActive.splice(clampedIndex, 0, activeTrainingItem);
            return {
              ...program,
              trainings: trainingsWithoutActive,
            };
          }
          return program;
        });
      });
      return;
    }

    // Case 2: Moving WITHIN the SAME program (reordering in real-time so other cards shift)
    if (fromProgramId === toProgramId) {
      if (overId === toProgramId || overId.startsWith("add-button-")) {
        return;
      }

      setProgramsDuringDrag((prev) => {
        const currentList = prev ?? programs;
        const program = currentList.find((p) => p.id === fromProgramId);
        if (!program) return prev;

        const oldIndex = program.trainings.findIndex((t) => t.id === activeId);
        const newIndex = program.trainings.findIndex((t) => t.id === overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prev;
        }

        const newTrainings = [...program.trainings];
        const [moved] = newTrainings.splice(oldIndex, 1);
        newTrainings.splice(newIndex, 0, moved);

        return currentList.map((p) =>
          p.id === fromProgramId ? { ...p, trainings: newTrainings } : p
        );
      });
    }
  };

  const handleDragCancel = () => {
    setActiveTraining(null);
    setActiveProgramId(null);
    setProgramsDuringDrag(null);
    lastOverId.current = null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const finalPrograms = programsDuringDrag;
    const initialFromProgramId = activeProgramId;

    setActiveTraining(null);
    setActiveProgramId(null);
    setProgramsDuringDrag(null);
    lastOverId.current = null;

    if (!isPremiumUser) return;

    const { active, over } = event;
    if (!over) return;

    const trainingId = String(active.id);

    // Find where the training is in finalPrograms
    const currentProgram = finalPrograms?.find((p) =>
      p.trainings.some((t) => t.id === trainingId)
    );
    const finalProgramId = currentProgram?.id ?? over.data?.current?.programId;

    if (!initialFromProgramId || !finalProgramId) return;

    // Case A: Moved to a DIFFERENT program
    if (initialFromProgramId !== finalProgramId) {
      const position = currentProgram
        ? currentProgram.trainings.findIndex((t) => t.id === trainingId)
        : 0;
      const validPosition = position >= 0 ? position : 0;

      const training = programs
        .find((p) => p.id === initialFromProgramId)
        ?.trainings.find((t) => t.id === trainingId);

      if (training) {
        moveTrainingLocally(training, initialFromProgramId, finalProgramId, validPosition);
      }

      await moveTrainingToAnotherProgram(
        trainingId,
        initialFromProgramId,
        finalProgramId,
        validPosition
      );
      notifyTrainingChange(finalProgramId);
      return;
    }

    // Case B: Reordered within the SAME program
    if (initialFromProgramId === finalProgramId) {
      const originalProgram = programs.find((p) => p.id === initialFromProgramId);
      const originalTrainings = originalProgram?.trainings ?? [];
      const newTrainings = currentProgram?.trainings ?? [];

      const newIds = newTrainings.map((t) => t.id);
      const oldIds = originalTrainings.map((t) => t.id);

      const hasChanged =
        newIds.length !== oldIds.length ||
        newIds.some((id, idx) => id !== oldIds[idx]);

      if (hasChanged) {
        reorderTrainingsLocally(initialFromProgramId, newIds);
        await handleReorderTrainings(initialFromProgramId, newIds);
      }
    }
  };

  return (
    <main
      className={cn(
        "flex-1 bg-[#FBFCFE] px-5 pt-[100px] md:pt-[140px] transition-[padding] duration-200 ease-out",
        activeTraining ? "pb-[65vh]" : "pb-[60px] md:pb-[80px]"
      )}
    >
      <div
        id="training-scroll-container"
        className="max-w-[1152px] mx-auto text-center flex flex-col items-center"
      >
        {pageIntro?.surtitre && (
          <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
            {pageIntro.surtitre}
          </div>
        )}
        <h1 
          className="text-[24px] sm:text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: pageIntro?.titre || "Entraînements" }}
        />
        <div 
          className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8 [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: pageIntro?.description || "Organise tes entraînements et choisis les séances que tu souhaites synchroniser dans ton app ou sur ton tableau de bord." }}
        />

        {showSkeleton ? (
          <ProgramsSkeleton structure={cachedStructure ?? undefined} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            autoScroll={false}
          >
            {programsToRender.map(({ program, originalIndex }, index) => {
              const computedZIndex = programsToRender.length - index;

              return (
                <div
                  key={program.id || originalIndex}
                  id={`program-${program.id}`}
                  className="relative w-full max-w-[1152px] mb-[20px] scroll-mt-[100px]"
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
                      program.app !== false &&
                      program.trainings.some(
                        (t, idx) =>
                          t.locked === false ||
                          (programs.find((p) => p.trainings.length > 0)?.id === program.id && idx === 0 && t.locked !== true)
                      )
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
                      if (!program.id || loadingTraining) return;

                      setLoadingTraining({ id: program.id, type: "add" });
                      try {
                        const newData = await handleAddTraining(program.id);
                        if (newData?.id) {
                          router.push(`/entrainements/${newData.id}?new=1`);
                        } else {
                          setLoadingTraining(null);
                        }
                      } catch (err) {
                        console.error("Erreur lors de l'ajout d'entraînement :", err);
                        setLoadingTraining(null);
                      }
                    }}
                    onDeleteTraining={(id: string) => {
                      if (!isPremiumUser) {
                        setShowTrainingDeleteWarningModal(true);
                        setTrainingIdToDelete(id);
                        setProgramIdForTrainingDelete(program.id);
                        return;
                      }

                      handleDeleteTraining(program.id, id);
                    }}
                    onDuplicateTraining={(id: string) =>
                      handleDuplicateTraining(program.id, id)
                    }
                    onRenameTraining={handleRenameTraining}
                    onDropTraining={moveTrainingToAnotherProgram}
                    openVisibilityIds={openVisibilityIds}
                    setOpenVisibilityIds={setOpenVisibilityIds}
                    onUpdateTrainingVisibility={handleUpdateTrainingVisibility}
                    loadingTraining={loadingTraining}
                    isFirstProgram={index === 0}
                    onUnlockClick={() => setShowUnlockModal(true)}
                    allowAddTraining={
                      !isPremiumUser &&
                      programs.flatMap(p => p.trainings).filter(t => t.locked === false).length === 0
                    }
                    onAddLockedClick={() => setShowAddTrainingLockedModal(true)}
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
        isStarterActiveWarning={
          !isPremiumUser &&
          Boolean(
            programIdToDelete &&
            programs
              .find((p) => p.id === programIdToDelete)
              ?.trainings.some(
                (t, idx) =>
                  t.locked === false ||
                  (programs.find((p) => p.trainings.length > 0)?.id === programIdToDelete && idx === 0)
              )
          )
        }
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
        type="training"
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={() => router.push("/compte#mon-abonnement")}
      />
      <AddTrainingLockedModal
        isOpen={showAddTrainingLockedModal}
        onClose={() => setShowAddTrainingLockedModal(false)}
        onUnlock={() => {
          setShowAddTrainingLockedModal(false);
          router.push("/compte#mon-abonnement");
        }}
      />
    </main>
  );
}
