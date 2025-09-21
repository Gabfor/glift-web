import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

export type ColumnSetting = {
  name: string;
  label: string;
  visible: boolean;
};

const FIXED_COLUMNS: ColumnSetting[] = [
  { name: "exercice", label: "Exercice", visible: true },
  { name: "series", label: "Séries", visible: true },
  { name: "repetitions", label: "Répétitions", visible: true },
  { name: "poids", label: "Poids", visible: true },
  { name: "link", label: "Lien", visible: true },
  { name: "note", label: "Note", visible: true },
];

const TOGGLABLE_COLUMNS: ColumnSetting[] = [
  { name: "materiel", label: "Matériel", visible: true },
  { name: "repos", label: "Repos", visible: true },
  { name: "effort", label: "Effort", visible: true },
];

export function useTrainingColumns(trainingId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const isAdmin = (pathname ?? "").includes("/admin");
  const tableName = isAdmin ? "trainings_admin" : "trainings";

  const [columns, setColumnsState] = useState<ColumnSetting[]>([
    ...FIXED_COLUMNS,
    ...TOGGLABLE_COLUMNS,
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColumnsSettings = async () => {
      if (!trainingId) return;

      const { data, error } = await supabase
        .from(tableName)
        .select("columns_settings")
        .eq("id", trainingId)
        .single();

      if (error) {
        console.error("❌ Erreur chargement columns_settings:", error);
        setLoading(false);
        return;
      }

      if (data?.columns_settings) {
        try {
          const visibleTogglableNames: string[] = JSON.parse(data.columns_settings);

          const updatedTogglableColumns = TOGGLABLE_COLUMNS.map((col) => ({
            ...col,
            visible: visibleTogglableNames.includes(col.name),
          }));

          setColumnsState([...FIXED_COLUMNS, ...updatedTogglableColumns]);
        } catch (err) {
          console.error("❌ Erreur parsing columns_settings:", err);
          setColumnsState([...FIXED_COLUMNS, ...TOGGLABLE_COLUMNS]);
        }
      } else {
        setColumnsState([...FIXED_COLUMNS, ...TOGGLABLE_COLUMNS]);
      }

      setLoading(false);
    };

    fetchColumnsSettings();
  }, [trainingId, supabase, tableName]);

  const saveColumnsInSupabase = async (currentColumns: ColumnSetting[]) => {
    if (!trainingId) return;

    const visibleTogglableNames = currentColumns
      .filter(
        (col) =>
          TOGGLABLE_COLUMNS.map((c) => c.name).includes(col.name) &&
          col.visible
      )
      .map((col) => col.name);

    const { error } = await supabase
      .from(tableName)
      .update({
        columns_settings: JSON.stringify(visibleTogglableNames),
      })
      .eq("id", trainingId);

    if (error) {
      console.error("❌ Erreur sauvegarde columns_settings:", error);
    }
  };

  const togglableColumns = useMemo(() => {
    return columns.filter((col) =>
      TOGGLABLE_COLUMNS.map((c) => c.name).includes(col.name)
    );
  }, [columns]);

  return {
    columns,
    setColumns: setColumnsState,
    togglableColumns,
    saveColumnsInSupabase,
    loading,
  };
}
