"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Row } from "@/types/training";
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

export default function AdminEntrainementDetailPage() {
  const params = useParams();
  const trainingId = params?.id as string;
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();

  // ✅ States
  const [editing, setEditing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredSuperset, setHoveredSuperset] = useState(false);

  // ✅ Training data
  const { rows, setRows, rowsLoading, selectedRowIds, setSelectedRowIds } = useTrainingRows(trainingId, user);

  // ✅ Column configuration
  const { columns, setColumns, togglableColumns, saveColumnsInSupabase } = useTrainingColumns(trainingId);

  // ✅ Custom hooks
  const { programName, setProgramName, loading: programNameLoading, handleBlur } = useProgramName(trainingId, setEditing);
  const { handleGroupSuperset } = useSuperset(rows, setRows, selectedRowIds, setSelectedRowIds, setHoveredSuperset);
  const handleEffortChange = useEffortChange(rows, setRows);
  const handleIconHover = useIconHover(rows, setRows);
  const handleCheckboxChange = useCheckboxChange(rows, setRows, setSelectedRowIds);
  const { handleIncrementSeries, handleDecrementSeries } = useSeriesChange(rows, setRows);
  const { showLinkModal, setShowLinkModal, selectedLinkRowIndex, setSelectedLinkRowIndex, showNoteModal, setShowNoteModal, selectedNoteRowIndex, setSelectedNoteRowIndex, handleSaveNote, handleSaveLink } = useTrainingModals(rows, setRows, selectedRowIds, setSelectedRowIds);

  const [icon, setIcon] = useState("/icons/plus.svg");
  const [iconSrc, setIconSrc] = useState("/icons/colonne.svg");
  const [dragActive, setDragActive] = useState(false);
  const [showProgramDeleteModal, setShowProgramDeleteModal] = useState(false);
  const [programIdToDelete, setProgramIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      setEditing(true);
      setIsEditing(true);
      setProgramName("");
    }
  }, [searchParams, setProgramName]);

  const handleDeleteSelectedRows = () => {
    const newRows = rows.filter((row) => !selectedRowIds.includes(row.id ?? ""));
    setRows(newRows);
    setSelectedRowIds([]);
  };

  const handleAddRow = () => {
    setRows(prev => [
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
      }
    ]);
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">

        <div
          className="flex items-center text-sm text-[#5D6494] hover:text-[#3A416F] text-[15px] font-semibold mb-6 cursor-pointer group w-fit"
            onClick={async () => {
              if (!programName.trim()) {
                await supabase.from("trainings_admin").delete().eq("id", trainingId);
                console.log("🗑️ Entraînement vide supprimé (retour)");
              }

              const isAdmin = window.location.pathname.startsWith("/admin");

              if (isAdmin) {
                const { data, error } = await supabase
                  .from("trainings_admin")
                  .select("program_id")
                  .eq("id", trainingId)
                  .single();

                if (error || !data?.program_id) {
                  console.error("❌ Impossible de récupérer le program_id", error);
                  router.push("/admin/entrainements");
                } else {
                  router.push(`/admin/entrainements?id=${data.program_id}&edit=1`);
                }
              } else {
                router.push("/entrainements");
              }
            }}
        >
          <img src="/icons/chevron_left.svg" alt="Retour" className="h-3 w-2 mr-2 group-hover:hidden" />
          <img src="/icons/chevron_left_hover.svg" alt="Retour (hover)" className="h-3 w-2 mr-2 hidden group-hover:inline" />
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
              selectedRowIds={selectedRowIds}
              handleEffortChange={handleEffortChange}
              handleCheckboxChange={handleCheckboxChange}
              handleIncrementSeries={handleIncrementSeries}
              handleDecrementSeries={handleDecrementSeries}
              handleIconHover={handleIconHover}
              columns={columns}
              setIsEditing={setIsEditing}
              onDragActiveChange={setDragActive}
              adminMode={true}
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
