"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";
import type { Program, Training } from "@/types/training";
import ProgramEditor from "@/components/ProgramEditor";
import DroppableProgram from "@/components/DroppableProgram";
import { notifyTrainingChange } from "@/components/ProgramEditor";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";
import DragPreviewItem from "@/components/TrainingList/DragPreviewItem";

export default function AdminSingleProgramPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [originalName, setOriginalName] = useState<string>("Nouveau programme");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [openVisibilityIds, setOpenVisibilityIds] = useState<string[]>([]);

  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor));

  const programIdFromUrl = searchParams?.get("id");

  // 1. Charger un programme si un id est présent
  useEffect(() => {
    const init = async () => {
      if (!programIdFromUrl) {
        setProgram({ id: "", name: "Nouveau programme", trainings: [] });
        return;
      }

      const { data: programData, error: programError } = await supabase
        .from("programs_admin")
        .select("id, name")
        .eq("id", programIdFromUrl)
        .single();

      if (programError || !programData) return;

      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings_admin")
        .select("*")
        .eq("program_id", programIdFromUrl)
        .order("position", { ascending: true });

      if (trainingsError) return;

      setProgram({ ...programData, trainings: trainings ?? [] });
      setOriginalName(programData.name);
    };

    init();
  }, [supabase, programIdFromUrl]);

  // 2. Soumettre uniquement si nom changé ET programme non encore enregistré
  const handleSubmit = async () => {
    if (!program || !program.name) return;

    // Si programme non encore inséré (pas d’id)
    if (!program.id) {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      const { data, error } = await supabase
        .from("programs_admin")
        .insert({
          name: program.name,
          user_id: user.user.id,
        })
        .select("id, name")
        .single();

      if (error || !data) return;

      setProgram({ ...program, id: data.id });
      setOriginalName(data.name);
      router.replace(`/admin/entrainements?id=${data.id}`);
    }

    // Si déjà existant et nom modifié
    if (program.id && program.name !== originalName) {
      const { error } = await supabase
        .from("programs_admin")
        .update({ name: program.name })
        .eq("id", program.id);

      if (!error) setOriginalName(program.name);
    }
  };

  const handleAddTraining = async () => {
    if (!program?.id) return;
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return;

    const { data, error } = await supabase
      .from("trainings_admin")
      .insert({
        name: "Nouvel entraînement",
        user_id: user.user.id,
        program_id: program.id,
        position: program.trainings.length,
      })
      .select()
      .single();

    if (!data || error) return;

    setProgram({ ...program, trainings: [...program.trainings, data] });
    router.push(`/admin/entrainements/${data.id}?new=1`);
  };

  const handleReorderTrainings = async (ids: string[]) => {
    if (!program) return;

    const newTrainings = ids
      .map((id) => program.trainings.find((t) => t.id === id))
      .filter(Boolean) as Training[];

    setProgram({ ...program, trainings: newTrainings });

    await Promise.all(
      newTrainings.map((t, index) =>
        supabase.from("trainings_admin").update({ position: index }).eq("id", t.id)
      )
    );
  };

  const handleDeleteTraining = async (id: string) => {
    if (!program) return;
    await supabase.from("trainings_admin").delete().eq("id", id);
    setProgram({ ...program, trainings: program.trainings.filter((t) => t.id !== id) });
  };

  const handleDuplicateTraining = async (id: string) => {
    const original = program?.trainings.find((t) => t.id === id);
    if (!original || !program?.id) return;

    const { data } = await supabase
      .from("trainings_admin")
      .insert({
        ...original,
        id: undefined,
        name: original.name + " (copie)",
        position: original.position + 1,
      })
      .select()
      .single();

    if (!data) return;

    const updatedTrainings = [...program.trainings];
    const insertAt = original.position + 1;
    updatedTrainings.splice(insertAt, 0, data);

    setProgram({
      ...program,
      trainings: updatedTrainings.map((t, idx) => ({ ...t, position: idx })),
    });

    notifyTrainingChange(program.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { id } = event.active;
    setActiveId(id as string);
    const training = program?.trainings.find((t) => t.id === id);
    if (training) setActiveTraining(training);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveTraining(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = program?.trainings.findIndex((t) => t.id === active.id) ?? -1;
    const newIndex = program?.trainings.findIndex((t) => t.id === over.id) ?? -1;
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...(program?.trainings ?? [])];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    setProgram({ ...program!, trainings: reordered });
    handleReorderTrainings(reordered.map((t) => t.id));
  };

  if (!program) return null;

  const isEditing = !!searchParams?.get("edit");

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
      <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">
        {isEditing ? "Modifier le programme" : "Créer un programme"}
      </h1>

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="relative w-full max-w-[1152px] mb-[20px] mt-[20px]">
            <ProgramEditor
              name={program.name}
              index={0}
              editingIndex={editingIndex}
              onChangeName={(_, name) => setProgram({ ...program, name })}
              onSubmit={async () => {
                await handleSubmit();
                setEditingIndex(null);
              }}
              onStartEdit={setEditingIndex}
              onCancel={() => {
                setEditingIndex(null);
                setProgram((prev) =>
                  prev ? { ...prev, name: originalName } : prev
                );
              }}
              programId={program.id}
              isVisible={true}
              onToggleVisibility={() => {}}
              onDelete={() => {}}
              isFirst={true}
              isLastActive={true}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              onDuplicate={() => {}}
              zIndex={1}
              tableName="trainings_admin"
              programsTableName="programs_admin"
              adminMode={true}
            />

            <DroppableProgram
              programId={program.id}
              trainings={program.trainings}
              onClickTraining={(id: string) => router.push(`/admin/entrainements/${id}`)}
              onReorderTrainings={(_, ids) => handleReorderTrainings(ids)}
              onAddTraining={handleAddTraining}
              onDeleteTraining={handleDeleteTraining}
              onDuplicateTraining={handleDuplicateTraining}
              onDropTraining={async () => {}}
              openVisibilityIds={openVisibilityIds}
              setOpenVisibilityIds={setOpenVisibilityIds}
              onUpdateTrainingVisibility={() => {}}
              activeId={activeId}
            />
          </div>

          <DragOverlay>
            {activeTraining && <DragPreviewItem training={activeTraining} />}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
}