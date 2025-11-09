"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Program, Training } from "@/types/training";
import type { Database } from "@/lib/supabase/types";
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
import DragPreviewItem from "@/components/training/DragPreviewItem";

export default function AdminSingleProgramPage() {
  type TrainingsAdminRow = Database["public"]["Tables"]["trainings_admin"]["Row"];
  type TrainingsAdminInsert = Database["public"]["Tables"]["trainings_admin"]["Insert"];

  const [program, setProgram] = useState<Program | null>(null);
  const [originalName, setOriginalName] = useState<string>("Nouveau programme");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [openVisibilityIds, setOpenVisibilityIds] = useState<string[]>([]);

  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor));

  const programIdFromUrl = searchParams?.get("id");

  // 1. Charger un programme si un id est présent
  useEffect(() => {
    const init = async () => {
      if (!programIdFromUrl) {
        setProgram({
          id: "",
          name: "Nouveau programme",
          dashboard: true,
          trainings: [],
        });
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

      const sanitizedTrainings = (trainings ?? []).map((training) => ({
        id: training.id,
        name: training.name,
        app: Boolean(training.app),
        program_id: training.program_id ?? programIdFromUrl,
        position: training.position ?? 0,
      }));

      setProgram({
        id: programData.id,
        name: programData.name,
        dashboard: true,
        trainings: sanitizedTrainings,
      });
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
    const userId = user.user.id;

    const { data, error } = await supabase
      .from("trainings_admin")
      .insert({
        name: "Nouvel entraînement",
        user_id: userId,
        program_id: program.id,
        position: program.trainings.length,
      })
      .select()
      .single();

    if (!data || error) return;

    const defaultRow = {
      training_id: data.id,
      user_id: userId,
      order: 0,
      series: 4,
      repetitions: Array(4).fill(""),
      poids: Array(4).fill(""),
      repos: "",
      effort: Array(4).fill("parfait"),
      checked: false,
      exercice: "",
      materiel: "",
      superset_id: null,
      link: "",
      note: "",
    };

    const { error: firstRowError } = await supabase
      .from("training_rows_admin")
      .insert(defaultRow);

    if (firstRowError) {
      console.error("❌ Erreur création première ligne entraînement admin :", firstRowError);
    }

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

    const { data: trainingRow, error: trainingRowError } = await supabase
      .from("trainings_admin")
      .select("*")
      .eq("id", id)
      .single<TrainingsAdminRow>();

    if (!trainingRow || trainingRowError) {
      console.error("Erreur lors de la récupération de l'entraînement :", trainingRowError);
      return;
    }

    const { id: _id, ...baseTraining } = trainingRow;
    void _id;
    const insertPayload: TrainingsAdminInsert = {
      ...baseTraining,
      name: `${trainingRow.name} (copie)`,
      position: (trainingRow.position ?? 0) + 1,
    };

    const { data } = await supabase
      .from("trainings_admin")
      .insert([insertPayload])
      .select()
      .single<TrainingsAdminRow>();

    if (!data) return;

    const updatedTrainings = [...program.trainings];
    const insertAt = original.position + 1;
    const newTraining: Training = {
      id: data.id,
      name: data.name,
      app: Boolean(data.app),
      program_id: data.program_id ?? program.id,
      position: data.position ?? 0,
    };
    updatedTrainings.splice(insertAt, 0, newTraining);

    setProgram({
      ...program,
      trainings: updatedTrainings.map((t, idx) => ({ ...t, position: idx })),
    });

    notifyTrainingChange(program.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { id } = event.active;
    const training = program?.trainings.find((t) => t.id === id);
    if (training) setActiveTraining(training);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
        <div
          className="flex items-center text-sm text-[#5D6494] hover:text-[#3A416F] text-[15px] font-semibold mb-6 cursor-pointer group w-fit self-start"
          onClick={() => router.push("/admin/program")}
        >
          <Image src="/icons/chevron_left.svg" alt="Retour" width={12} height={12} className="h-3 w-2 mr-2 group-hover:hidden" />
          <Image
            src="/icons/chevron_left_hover.svg"
            alt="Retour (hover)"
            width={12}
            height={12}
            className="h-3 w-2 mr-2 hidden group-hover:inline"
          />
          Programmes
        </div>
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
              dashboardVisible={program.dashboard !== false}
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
