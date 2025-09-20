import { useEffect, useRef } from "react";
import { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import { Row } from "@/types/training";

export function useAutoSaveRows(
  rows: Row[],
  trainingId: string,
  user: User | null,
  supabase: SupabaseClient,
  setRows: React.Dispatch<React.SetStateAction<Row[]>>
) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const previousIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!user || !user.id || !trainingId || rows.length === 0) return;

    const currentRowsSnapshot = JSON.stringify(rows);
    if (currentRowsSnapshot === lastSavedRef.current) return;

    lastSavedRef.current = currentRowsSnapshot;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const rowsWithOrder = rows.map((row, index) => ({ ...row, _finalOrder: index }));

      const newRows = rowsWithOrder
        .filter((row) => !row.id)
        .map((row) => ({
          training_id: trainingId,
          user_id: user.id,
          order: row._finalOrder,
          series: row.series,
          repetitions: row.repetitions,
          poids: row.poids,
          repos: row.repos,
          effort: row.effort,
          checked: row.checked,
          exercice: row.exercice,
          materiel: row.materiel,
          superset_id: row.superset_id,
          link: row.link,
          note: row.note,
        }));

      const existingRows = rowsWithOrder
        .filter((row) => !!row.id)
        .map((row) => ({
          id: row.id!,
          training_id: trainingId,
          user_id: user.id,
          order: row._finalOrder,
          series: row.series,
          repetitions: row.repetitions,
          poids: row.poids,
          repos: row.repos,
          effort: row.effort,
          checked: row.checked,
          exercice: row.exercice,
          materiel: row.materiel,
          superset_id: row.superset_id,
          link: row.link,
          note: row.note,
        }));

      const currentIds = rows.filter(r => r.id).map(r => r.id as string);
      const deletedIds = previousIdsRef.current.filter(id => !currentIds.includes(id));
      previousIdsRef.current = currentIds;

      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("training_rows")
          .delete()
          .in("id", deletedIds);
        if (deleteError) console.error("❌ Erreur suppression lignes :", deleteError);
      }

      if (newRows.length > 0) {
        const { error: insertError } = await supabase.from("training_rows").insert(newRows);
        if (insertError) console.error("❌ Erreur insertion lignes :", insertError);
      }

      if (existingRows.length > 0) {
        const { error: updateError } = await supabase.from("training_rows").upsert(existingRows);
        if (updateError) console.error("❌ Erreur mise à jour lignes :", updateError);
      }

      const { data: refreshedRows, error: fetchError } = await supabase
        .from("training_rows")
        .select("*")
        .eq("training_id", trainingId)
        .order("order", { ascending: true });

      if (fetchError) {
        console.error("❌ Erreur rechargement lignes :", fetchError);
      } else if (refreshedRows) {
        setRows(
          refreshedRows.map((row) => ({
            id: row.id,
            series: row.series,
            repetitions: row.repetitions,
            poids: row.poids,
            repos: row.repos,
            effort: row.effort,
            checked: rows.find(r => r.id === row.id)?.checked || false,
            iconHovered: rows.find(r => r.id === row.id)?.iconHovered || false,
            exercice: row.exercice,
            materiel: row.materiel,
            superset_id: row.superset_id,
            link: row.link,
            note: row.note,
          }))
        );
        console.log("✅ Lignes rechargées après sauvegarde");
      }

      saveTimeoutRef.current = null;
    }, 600);
  }, [rows, trainingId, user]);
}