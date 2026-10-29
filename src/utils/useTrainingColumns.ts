import { useState, useEffect, useMemo } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

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
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const pathname = usePathname();
  const isAdmin =
    (pathname?.includes("/admin") ?? false) ||
    (typeof window !== "undefined" && window.location.host.startsWith("admin."));
  const tableName = isAdmin ? "trainings_admin" : "trainings";

  const [columns, setColumnsState] = useState<ColumnSetting[]>([
    ...FIXED_COLUMNS,
    ...TOGGLABLE_COLUMNS,
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColumnsSettings = async () => {
      if (!trainingId) return;

      let { data } = await supabase
        .from(tableName)
        .select("columns_settings")
        .eq("id", trainingId)
        .maybeSingle();

      if (!data && !isAdmin) {
        const { data: adminData } = await supabase
          .from("trainings_admin")
          .select("columns_settings")
          .eq("id", trainingId)
          .maybeSingle();
        if (adminData) {
          data = adminData;
        }
      }

      if (data?.columns_settings) {
        try {
          const visibleTogglableNames: string[] = JSON.parse(data.columns_settings);

          if (Array.isArray(visibleTogglableNames)) {
            const updatedTogglableColumns = TOGGLABLE_COLUMNS.map((col) => ({
              ...col,
              visible: visibleTogglableNames.includes(col.name),
            }));

            setColumnsState([...FIXED_COLUMNS, ...updatedTogglableColumns]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("❌ Erreur parsing columns_settings:", err);
        }
      }

      // Fallback when columns_settings is null/undefined: initialize from global preferences
      let showEffort = true;
      let showMateriel = true;
      let showRepos = true;

      if (user?.id) {
        const { data: prefData } = await supabase
          .from("preferences")
          .select("show_effort, show_materiel, show_repos")
          .eq("id", user.id)
          .maybeSingle();

        if (prefData) {
          if (prefData.show_effort !== undefined && prefData.show_effort !== null) {
            showEffort = prefData.show_effort;
          }
          if (prefData.show_materiel !== undefined && prefData.show_materiel !== null) {
            showMateriel = prefData.show_materiel;
          }
          if (prefData.show_repos !== undefined && prefData.show_repos !== null) {
            showRepos = prefData.show_repos;
          }
        }
      }

      const updatedTogglableColumns = TOGGLABLE_COLUMNS.map((col) => {
        if (col.name === "effort") {
          return { ...col, visible: showEffort };
        }
        if (col.name === "materiel") {
          return { ...col, visible: showMateriel };
        }
        if (col.name === "repos") {
          return { ...col, visible: showRepos };
        }
        return { ...col, visible: true };
      });

      const initialVisibleNames = updatedTogglableColumns
        .filter((col) => col.visible)
        .map((col) => col.name);

      // Persist initial columns_settings so this training stays independent from future preference changes
      await supabase
        .from(tableName)
        .update({
          columns_settings: JSON.stringify(initialVisibleNames),
        })
        .eq("id", trainingId);

      setColumnsState([...FIXED_COLUMNS, ...updatedTogglableColumns]);
      setLoading(false);
    };

    fetchColumnsSettings();
  }, [trainingId, supabase, tableName, isAdmin, user?.id]);

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
