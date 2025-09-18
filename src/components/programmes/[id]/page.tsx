"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgramEditor from "@/components/ProgramEditor";
import ProgramDeleteModal from "@/components/ProgramDeleteModal";
import usePrograms from "@/hooks/usePrograms";
import DroppableProgram from "@/components/DroppableProgram";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";

interface Training {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
  program_id: string;
  position: number;
}

export default function EntrainementsPage() {
  const {
    programs,
    handleReorderTrainings,
    handleDuplicateTraining,
    handleSubmit,
    handleAddTraining,
    handleDeleteTraining,
    handleChangeName,
    handleDeleteProgram,
    moveTrainingToAnotherProgram,
    moveProgramUp,
    moveProgramDown,
    handleDuplicateProgram,
  } = usePrograms();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [openVisibilityIds, setOpenVisibilityIds] = useState<string[]>([]);
  const [showProgramDeleteModal, setShowProgramDeleteModal] = useState(false);
  const [programIdToDelete, setProgramIdToDelete] = useState<string | null>(null);

  // Pour gestion panneau visibilité des entraînements (id ou null)
  const [showVisibilityTrainingId, setShowVisibilityTrainingId] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  const router = useRouter();

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    const { id, data } = event.active;
    setActiveId(id as string);
    setActiveProgramId(data?.current?.programId ?? null);
    console.log("🚀 DRAG START", { id, programId: data?.current?.programId });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const fromProgramId = activeProgramId;
    const toProgramId = over?.data?.current?.programId ?? null; // Correction importante ici
    const trainingId = active.id as string;

    console.log("🧩 handleDragEnd", {
      active: active.id,
      over: over.id,
      activeData: active.data?.current,
      overData: over.data?.current,
      fromProgramId,
      toProgramId,
    });

    if (fromProgramId && toProgramId && fromProgramId !== toProgramId) {
      const allTrainings = programs.find(p => p.id === toProgramId)?.trainings || [];
      const position = allTrainings.findIndex((t: Training) => t.id === over.id);
      await moveTrainingToAnotherProgram(trainingId, fromProgramId, toProgramId, position);
    } else if (fromProgramId === toProgramId) {
      const program = programs.find(p => p.id === fromProgramId);
      if (!program) return;
      const oldIndex = program.trainings.findIndex((t: Training) => t.id === active.id);
      const newIndex = program.trainings.findIndex((t: Training) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedIds = [...program.trainings];
        const [moved] = reorderedIds.splice(oldIndex, 1);
        reorderedIds.splice(newIndex, 0, moved);
        await handleReorderTrainings(fromProgramId, reorderedIds.map(t => t.id));
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">Entraînements</h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug mb-[40px]">
          Gérez vos programmes et vos entraînements.<br className="hidden sm:block" />
          Choisissez ceux que vous souhaitez retrouver dans l’app et sur votre tableau de bord.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {programs.map((program, index) => (
            <div key={program.id || index} className="relative w-full max-w-[1152px] mb-[20px]">
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
              setVisibility(prev => ({
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
            isLastActive={true}  // ou ta logique pour savoir si c'est le dernier actif
            onMoveUp={() => moveProgramUp(index)}
            onMoveDown={() => moveProgramDown(index)}
            onDuplicate={() => handleDuplicateProgram(index)}
          />

              <DroppableProgram
                programId={program.id}
                trainings={program.trainings}
                onClickTraining={(id) => router.push(`/entrainements/${id}`)}
                onReorderTrainings={(programId, ids) => handleReorderTrainings(programId, ids)}
                onAddTraining={() => handleAddTraining(program.id)}
                onDeleteTraining={(id) => handleDeleteTraining(program.id, id)}
                onDuplicateTraining={(id) => handleDuplicateTraining(program.id, id)}
                onDropTraining={moveTrainingToAnotherProgram}
                showVisibilityTrainingId={showVisibilityTrainingId}
                setShowVisibilityTrainingId={setShowVisibilityTrainingId}
                onUpdateTrainingVisibility={() => {}} 
                openVisibilityIds={openVisibilityIds}
                setOpenVisibilityIds={setOpenVisibilityIds}
                activeId={activeId}                              
              />
            </div>
          ))}
        </DndContext>
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
