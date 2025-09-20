import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export function useProgramName(trainingId: string, setEditing: (val: boolean) => void) {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isNew = searchParams?.get("new") === "1";
  const isAdmin = pathname?.includes("/admin");

  const tableName = isAdmin ? "trainings_admin" : "trainings";

  const [programName, setProgramName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trainingId) return;

    if (isNew) {
      setProgramName("");
      setLoading(false);
      return;
    }

    const fetchName = async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("name")
        .eq("id", trainingId)
        .single();

      if (error) {
        console.error("❌ Erreur chargement nom entraînement :", error);
        return;
      }

      setProgramName(data.name ?? "");
      setLoading(false);
    };

    fetchName();
  }, [trainingId, supabase, isNew, tableName]);

  const handleBlur = async () => {
    setEditing(false);

    const trimmedName = programName.trim() || "Nom de l’entraînement";
    setProgramName(trimmedName);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from(tableName)
      .update({ name: trimmedName })
      .eq("id", trainingId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Erreur enregistrement nom :", error);
    } else {
      console.log("✅ Nom enregistré :", trimmedName);
    }

    // ✅ Nettoie l'URL en retirant le paramètre ?new=1
    const url = new URL(window.location.href);
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.toString());
    }
  };

  return {
    programName,
    setProgramName,
    loading,
    handleBlur,
  };
}