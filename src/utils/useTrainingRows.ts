"use client";

import { useEffect, useRef, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { User } from "@supabase/supabase-js";
import { Row } from "@/types/training";
import { usePathname } from "next/navigation";

export function useTrainingRows(trainingId: string, user: User | null) {
  const supabase = useSupabaseClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [fullyLoaded, setFullyLoaded] = useState(false);
  const [hasClearedCheckedOnce, setHasClearedCheckedOnce] = useState(false);

  const hasMountedRef = useRef(false);
  const hasInsertedFirstRow = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const previousIdsRef = useRef<string[]>([]);
  const hasEverLoadedRef = useRef(false);

  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");
  const tableName = isAdmin ? "training_rows_admin" : "training_rows";

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry && navEntry.type === 'reload') {
      console.log("♻️ Reload détecté → suppression du flag sessionStorage");
      sessionStorage.removeItem(`checkedReset:${trainingId}`);
    }
  }, [trainingId]);

  useEffect(() => {
    const cleared = sessionStorage.getItem(`checkedReset:${trainingId}`);
    if (cleared === "true") {
      setHasClearedCheckedOnce(true);
    }
  }, [trainingId]);

  useEffect(() => {
    if (!user || !trainingId) {
      setFullyLoaded(true);
      return;
    }

    if (hasEverLoadedRef.current) {
      console.log("✅ Retour d'onglet détecté → on garde l'état affiché");
      return;
    }

    setFullyLoaded(false);

    const fetchRows = async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("training_id", trainingId)
        .order("order", { ascending: true });

      if (error) {
        console.error("❌ Erreur chargement lignes :", error);
        setFullyLoaded(true);
        return;
      }

      if (data.length === 0 && !hasInsertedFirstRow.current) {
        console.log("ℹ️ Aucun training_row trouvé → création auto");
        hasInsertedFirstRow.current = true;

        const optimisticRow: Row = {
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
        };

        setRows([optimisticRow]);
        setSelectedRowIds([]);

        const { data: newRow, error: insertError } = await supabase
          .from(tableName)
          .insert({
            training_id: trainingId,
            user_id: user.id,
            order: 0,
            series: optimisticRow.series,
            repetitions: optimisticRow.repetitions,
            poids: optimisticRow.poids,
            repos: optimisticRow.repos,
            effort: optimisticRow.effort,
            checked: optimisticRow.checked,
            exercice: optimisticRow.exercice,
            materiel: optimisticRow.materiel,
            superset_id: optimisticRow.superset_id,
            link: optimisticRow.link,
            note: optimisticRow.note,
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ Erreur création première ligne :", insertError);
          setFullyLoaded(true);
          hasEverLoadedRef.current = true;
          return;
        }

        setRows([{
          id: newRow.id,
          series: newRow.series,
          repetitions: newRow.repetitions,
          poids: newRow.poids,
          repos: newRow.repos,
          effort: newRow.effort,
          checked: newRow.checked,
          iconHovered: false,
          exercice: newRow.exercice,
          materiel: newRow.materiel,
          superset_id: newRow.superset_id,
          link: newRow.link,
          note: newRow.note,
        }]);

        previousIdsRef.current = [newRow.id];
        skipNextSaveRef.current = true;
        setFullyLoaded(true);
        hasEverLoadedRef.current = true;
        return;
      }

      if (!hasClearedCheckedOnce) {
        console.log("✅ Premier vrai chargement → reset checked");

        setRows([]);
        setFullyLoaded(false);

        await supabase
          .from(tableName)
          .update({ checked: false })
          .eq("training_id", trainingId);

        console.log("✅ Tous les checked remis à false en BDD");

        sessionStorage.setItem(`checkedReset:${trainingId}`, "true");
        setHasClearedCheckedOnce(true);

        const { data: refreshedData, error: refreshError } = await supabase
          .from(tableName)
          .select("*")
          .eq("training_id", trainingId)
          .order("order", { ascending: true });

        if (refreshError) {
          console.error("❌ Erreur refetch après reset :", refreshError);
          setFullyLoaded(true);
          hasEverLoadedRef.current = true;
          return;
        }

        setRows(
          refreshedData.map((row) => ({
            id: row.id,
            series: row.series,
            repetitions: row.repetitions,
            poids: row.poids,
            repos: row.repos,
            effort: row.effort,
            checked: row.checked,
            iconHovered: false,
            exercice: row.exercice,
            materiel: row.materiel,
            superset_id: row.superset_id,
            link: row.link,
            note: row.note,
          }))
        );

        setSelectedRowIds([]);
        previousIdsRef.current = refreshedData.map((row) => row.id);
        setFullyLoaded(true);
        hasEverLoadedRef.current = true;
        return;
      }

      setRows(
        data.map((row) => ({
          id: row.id,
          series: row.series,
          repetitions: row.repetitions,
          poids: row.poids,
          repos: row.repos,
          effort: row.effort,
          checked: row.checked,
          iconHovered: false,
          exercice: row.exercice,
          materiel: row.materiel,
          superset_id: row.superset_id,
          link: row.link,
          note: row.note,
        }))
      );

      setSelectedRowIds([]);
      previousIdsRef.current = data.map((row) => row.id);
      setFullyLoaded(true);
      hasEverLoadedRef.current = true;
    };

    fetchRows();
  }, [user, trainingId, supabase, hasClearedCheckedOnce, tableName]);

  useEffect(() => {
    if (!user || !user.id || !trainingId || rows.length === 0) return;
    const cleanRows = rows.map(({ iconHovered, ...row }) => {
      void iconHovered;
      return row;
    });
    const currentSnapshot = JSON.stringify(cleanRows);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      lastSavedRef.current = currentSnapshot;
      previousIdsRef.current = rows.filter(r => r.id).map(r => r.id as string);
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      lastSavedRef.current = currentSnapshot;
      previousIdsRef.current = rows.filter(r => r.id).map(r => r.id as string);
      return;
    }

    if (currentSnapshot === lastSavedRef.current) return;

    lastSavedRef.current = currentSnapshot;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      // ✅ PATCH ajouté ici
      if (isEditing) return;

      const rowsWithOrder = rows.map((row, index) => ({ ...row, _finalOrder: index }));

      const newRowsWithOrder = rowsWithOrder.filter((row) => !row.id);
      const existingRowsWithOrder = rowsWithOrder.filter((row) => !!row.id);

      const newRows = newRowsWithOrder.map((row) => ({
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

      const existingRows = existingRowsWithOrder.map((row) => ({
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
        await supabase
          .from(tableName)
          .delete()
          .in("id", deletedIds);
      }

      let insertedRows: { id: string; order: number }[] = [];

      if (newRows.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from(tableName)
          .insert(newRows)
          .select("id, order");

        if (insertError) {
          console.error("❌ Erreur insertion lignes entraînement :", insertError);
        } else if (insertedData) {
          insertedRows = insertedData.map((row) => ({ id: row.id, order: row.order }));
        }
      }

      if (existingRows.length > 0) {
        const { error: upsertError } = await supabase.from(tableName).upsert(existingRows);
        if (upsertError) {
          console.error("❌ Erreur mise à jour lignes entraînement :", upsertError);
        }
      }

      if (insertedRows.length > 0) {
        const insertedMap = new Map(insertedRows.map((row) => [row.order, row.id]));
        setRows((previousRows) => {
          const updatedRows = previousRows.map((row, index) => {
            if (row.id) {
              return row;
            }

            const newId = insertedMap.get(index);
            if (!newId) {
              return row;
            }

            return {
              ...row,
              id: newId,
            };
          });

          lastSavedRef.current = JSON.stringify(
            updatedRows.map((row) => {
              const { iconHovered: _iconHovered, ...rest } = row;
              void _iconHovered;
              return rest;
            })
          );

          return updatedRows;
        });

        skipNextSaveRef.current = true;
      }

      saveTimeoutRef.current = null;
    }, 600);
  }, [rows, trainingId, user, supabase, tableName, isEditing]);

  return {
    rows,
    setRows,
    rowsLoading: !fullyLoaded,
    selectedRowIds,
    setSelectedRowIds,
    isEditing,
    setIsEditing,
  };
}
