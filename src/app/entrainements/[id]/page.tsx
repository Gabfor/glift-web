"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams, usePathname } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "@/context/UserContext";
import EditableTitle from "@/components/EditableTitle";
import TrainingTable from "@/components/TrainingTable";
import TableActionsBar from "@/components/TableActionsBar";
import AddRowButton from "@/components/AddRowButton";
import LinkModal from "@/components/LinkModal";
import NoteModal from "@/components/NoteModal";
import { useEffortChange } from "@/utils/useEffortChange";
import { useProgramName } from "@/utils/useProgramName";
import { useTrainingRows } from "@/utils/useTrainingRows";
import { useTrainingModals } from "@/utils/useTrainingModals";
import { useSuperset } from "@/utils/useSuperset";
import { useTrainingColumns } from "@/utils/useTrainingColumns";
import { useSeriesChange } from "@/utils/useSeriesChange";
import { useCheckboxChange } from "@/utils/useCheckboxChange";
import { useIconHover } from "@/utils/useIconHover";
import { notifyTrainingChange } from "@/components/ProgramEditor";
import type { Row } from "@/types/training";

const DEFAULT_TRAINING_NAME = "Nom de l'entraînement";
const LEGACY_DEFAULT_TRAINING_NAME = "Nom de l’entraînement";
const DEFAULT_SERIES_COUNT = 4;
const DEFAULT_EFFORT_VALUE = "parfait";

const isRowContentEmpty = (row: Row) => {
  const textFields = [
    row.exercice,
    row.materiel,
    row.repos,
    row.link ?? "",
    row.note ?? "",
  ];

  const hasTextContent = textFields.some((value) => Boolean(value && value.trim().length));
  const hasRepetitions = (row.repetitions ?? []).some((rep) => rep.trim().length > 0);
  const hasWeights = (row.poids ?? []).some((weight) => weight.trim().length > 0);
  const hasEffortChange = (row.effort ?? []).some((effort) => effort && effort !== DEFAULT_EFFORT_VALUE);
  const hasSeriesChange = typeof row.series === "number" && row.series !== DEFAULT_SERIES_COUNT;
  const hasChecked = Boolean(row.checked);
  const hasSuperset = Boolean(row.superset_id);

  return !(
    hasTextContent ||
    hasRepetitions ||
    hasWeights ||
    hasEffortChange ||
    hasSeriesChange ||
    hasChecked ||
    hasSuperset
  );
};

export default function AdminEntrainementDetailPage() {
  const params = useParams();
  const trainingId = params?.id as string;
  const { user, isPremiumUser } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const trainingsTableName = isAdminRoute ? "trainings_admin" : "trainings";
  const trainingRowsTableName = isAdminRoute ? "training_rows_admin" : "training_rows";
  const isNewParam = searchParams?.get("new") === "1";

  // 🔒 ACCESS CONTROL
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (isAdminRoute || isPremiumUser) {
      setAccessChecked(true);
      return;
    }

    if (!user) return;

    const checkAccess = async () => {
      // 1. Récupérer le premier programme
      const { data: firstProgram } = await supabase
        .from("programs")
        .select("id, trainings(id)")
        .eq("user_id", user.id)
        .order("position", { ascending: true })
        .limit(1)
        .single();

      if (!firstProgram) return;

      // 2. Récupérer le premier entraînement de ce programme (si non inclus/ordonné correctement)
      // Note: Supabase join order isn't guaranteed, better be safe
      const { data: firstTraining } = await supabase
        .from("trainings")
        .select("id")
        .eq("program_id", firstProgram.id)
        .order("position", { ascending: true })
        .limit(1)
        .single();

      if (!firstTraining) {
        // Cas bizarre, mais on redirige par sécu
        router.replace("/entrainements");
        return;
      }

      if (firstTraining.id !== trainingId) {
        console.warn("🚫 Accès interdit : Redirection vers /entrainements");
        router.replace("/entrainements");
      } else {
        setAccessChecked(true);
      }
    };

    void checkAccess();
  }, [user, isPremiumUser, isAdminRoute, trainingId, supabase, router]);



  const isNewTrainingRef = useRef(isNewParam);
  useEffect(() => {
    if (isNewParam) {
      isNewTrainingRef.current = true;
    }
  }, [isNewParam]);

  const shouldDeleteRef = useRef(false);
  const hasDeletedRef = useRef(false);
  const skipInitialCleanupRef = useRef(process.env.NODE_ENV !== "production");
  const deleteEmptyTrainingRef = useRef<() => Promise<void>>(async () => { });

  // ✅ States
  const [editing, setEditing] = useState(false);
  const [, setIsEditing] = useState(false);
  const [, setHoveredSuperset] = useState(false);

  // ✅ Training data
  const { rows, setRows, rowsLoading, selectedRowIds, setSelectedRowIds } = useTrainingRows(trainingId, user);

  // ✅ Column configuration
  const { columns, setColumns, togglableColumns, saveColumnsInSupabase } = useTrainingColumns(trainingId);

  // ✅ Custom hooks
  const { programName, setProgramName, loading: programNameLoading, handleBlur } = useProgramName(trainingId, setEditing);
  const { handleGroupSuperset } = useSuperset(rows, setRows, selectedRowIds, setSelectedRowIds, setHoveredSuperset);
  const handleEffortChange = useEffortChange(setRows);
  const handleIconHover = useIconHover(rows, setRows);
  const handleCheckboxChange = useCheckboxChange(rows, setRows, setSelectedRowIds);
  const { handleIncrementSeries, handleDecrementSeries } = useSeriesChange(setRows);
  const { showLinkModal, setShowLinkModal, selectedLinkRowIndex, setSelectedLinkRowIndex, showNoteModal, setShowNoteModal, selectedNoteRowIndex, setSelectedNoteRowIndex, handleSaveNote, handleSaveLink } = useTrainingModals(rows, setRows, selectedRowIds, setSelectedRowIds);

  const [icon, setIcon] = useState("/icons/plus.svg");
  const [iconSrc, setIconSrc] = useState("/icons/colonne.svg");
  const [dragActive, setDragActive] = useState(false);
  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      setEditing(true);
      setIsEditing(true);
      setProgramName("");
    }
  }, [searchParams, setProgramName]);

  useEffect(() => {
    if (!isNewTrainingRef.current) {
      shouldDeleteRef.current = false;
      return;
    }

    const normalizedName = programName.trim();
    const isNameMissing =
      normalizedName.length === 0 ||
      normalizedName === DEFAULT_TRAINING_NAME ||
      normalizedName === LEGACY_DEFAULT_TRAINING_NAME;

    const hasTableContent = rows.some((row) => !isRowContentEmpty(row));

    shouldDeleteRef.current = isNameMissing && !hasTableContent;
  }, [programName, rows]);

  const deleteEmptyTraining = useCallback(async () => {
    if (hasDeletedRef.current) return;
    if (!isNewTrainingRef.current) return;
    if (!shouldDeleteRef.current) return;
    if (!trainingId) return;

    let userId = user?.id ?? null;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }

    try {
      let rowsDeleteQuery = supabase
        .from(trainingRowsTableName)
        .delete()
        .eq("training_id", trainingId);

      if (userId) {
        rowsDeleteQuery = rowsDeleteQuery.eq("user_id", userId);
      }

      const { error: rowsError } = await rowsDeleteQuery;
      if (rowsError) {
        console.error("❌ Erreur suppression lignes entraînement vide :", rowsError);
      }

      let trainingDeleteQuery = supabase
        .from(trainingsTableName)
        .delete()
        .eq("id", trainingId);

      if (userId) {
        trainingDeleteQuery = trainingDeleteQuery.eq("user_id", userId);
      }

      const { error: trainingError } = await trainingDeleteQuery;
      if (trainingError) {
        console.error("❌ Erreur suppression entraînement vide :", trainingError);
        return;
      }

      notifyTrainingChange("all-programs");
      hasDeletedRef.current = true;
      shouldDeleteRef.current = false;
      console.log("🗑️ Entraînement vide supprimé automatiquement");
    } catch (error) {
      console.error("❌ Erreur inattendue lors de la suppression de l'entraînement vide :", error);
    }
  }, [supabase, trainingId, trainingRowsTableName, trainingsTableName, user?.id]);

  useEffect(() => {
    deleteEmptyTrainingRef.current = deleteEmptyTraining;
  }, [deleteEmptyTraining]);

  useEffect(() => {
    return () => {
      if (skipInitialCleanupRef.current) {
        skipInitialCleanupRef.current = false;
        return;
      }

      void deleteEmptyTrainingRef.current();
    };
  }, []);

  const handleDeleteSelectedRows = () => {
    const newRows = rows.filter((row) => !selectedRowIds.includes(row.id ?? ""));
    setRows(newRows);
    setSelectedRowIds([]);
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: undefined,
        series: 4,
        repetitions: Array(4).fill(""),
        poids: Array(4).fill(""),
        repos: "",
        effort: Array(4).fill("parfait"),
        checked: false,
        iconHovered: false,
        exercice: "",
        materiel: "",
        superset_id: null,
        link: "",
        note: "",
      },
    ]);
  };

  if (!isAdminRoute && !isPremiumUser && !accessChecked) {
    return <div className="min-h-screen bg-[#FBFCFE]" />;
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">

        <div
          className="flex items-center text-sm text-[#5D6494] hover:text-[#3A416F] text-[15px] font-semibold mb-6 cursor-pointer group w-fit"
          onClick={async () => {
            let adminProgramId: string | null = null;

            if (isAdminRoute) {
              const { data, error } = await supabase
                .from("trainings_admin")
                .select("program_id")
                .eq("id", trainingId)
                .single();

              if (!error && data?.program_id) {
                adminProgramId = data.program_id;
              }
            }

            await deleteEmptyTraining();

            if (isAdminRoute) {
              if (adminProgramId) {
                router.push(`/admin/entrainements?id=${adminProgramId}&edit=1`);
              } else {
                router.push("/admin/entrainements");
              }
            } else {
              router.push("/entrainements");
            }
          }}
        >
          <Image src="/icons/chevron_left.svg" alt="Retour" width={12} height={12} className="h-3 w-2 mr-2 group-hover:hidden" />
          <Image
            src="/icons/chevron_left_hover.svg"
            alt="Retour (hover)"
            width={12}
            height={12}
            className="h-3 w-2 mr-2 hidden group-hover:inline"
          />
          Entraînements
        </div>

        <EditableTitle
          loading={programNameLoading}
          editing={editing}
          setEditing={setEditing}
          programName={programName}
          setProgramName={setProgramName}
          handleBlur={handleBlur}
          setIsEditing={setIsEditing}
        />

        <TableActionsBar
          rows={rows}
          selectedRowIds={selectedRowIds}
          dragActive={dragActive}
          handleDeleteSelectedRows={handleDeleteSelectedRows}
          iconSrc={iconSrc}
          setIconSrc={setIconSrc}
          columns={columns}
          togglableColumns={togglableColumns}
          setColumns={setColumns}
          handleGroupSuperset={handleGroupSuperset}
          onLinkClick={(rowId) => {
            const index = rows.findIndex(r => r.id === rowId);
            if (index !== -1) {
              setSelectedLinkRowIndex(index);
              setShowLinkModal(true);
            }
          }}
          onNoteClick={() => {
            if (selectedRowIds.length === 0) return;
            const index = rows.findIndex(r => r.id === selectedRowIds[0]);
            if (index !== -1) setSelectedNoteRowIndex(index);
            setShowNoteModal(true);
          }}
          saveColumnsInSupabase={saveColumnsInSupabase}
        />

        <div className={`overflow-x-auto ${programNameLoading || rowsLoading ? "opacity-50" : ""}`}>
          {programNameLoading || rowsLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-[40px] w-full bg-gray-300 rounded-md" />
              <div className="h-[40px] w-full bg-gray-300 rounded-md" />
              <div className="h-[40px] w-full bg-gray-300 rounded-md" />
            </div>
          ) : (
            <TrainingTable
              rows={rows}
              setRows={setRows}
              handleEffortChange={handleEffortChange}
              handleCheckboxChange={handleCheckboxChange}
              handleIncrementSeries={handleIncrementSeries}
              handleDecrementSeries={handleDecrementSeries}
              handleIconHover={handleIconHover}
              columns={columns}
              setIsEditing={setIsEditing}
              onDragActiveChange={setDragActive}
              adminMode={false}
            />
          )}
        </div>

        <AddRowButton icon={icon} setIcon={setIcon} onClick={handleAddRow} />

        {showLinkModal && selectedLinkRowIndex !== null && (
          <LinkModal
            exercice={rows[selectedLinkRowIndex].exercice}
            initialLink={rows[selectedLinkRowIndex].link || ""}
            onCancel={() => {
              setShowLinkModal(false);
              setSelectedLinkRowIndex(null);
            }}
            onSave={handleSaveLink}
          />
        )}

        {showNoteModal && selectedNoteRowIndex !== null && (
          <NoteModal
            initialNote={rows[selectedNoteRowIndex].note || ""}
            onCancel={() => {
              setShowNoteModal(false);
              setSelectedNoteRowIndex(null);
            }}
            onSave={handleSaveNote}
          />
        )}
      </div>
    </main>
  );
}
