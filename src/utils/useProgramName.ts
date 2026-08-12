import { useState, useEffect } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useSearchParams, usePathname } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";

export function useProgramName(trainingId: string, setEditing: (val: boolean) => void) {
  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isNew = searchParams?.get("new") === "1";
  const isAdmin =
    (pathname?.includes("/admin") ?? false) ||
    (typeof window !== "undefined" && window.location.host.startsWith("admin."));

  const tableName = isAdmin ? "trainings_admin" : "trainings";

  const DEFAULT_TRAINING_NAME = "Nom de l'entraînement";
  const LEGACY_DEFAULT_TRAINING_NAME = "Nom de l’entraînement";

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
      let { data, error } = await supabase
        .from(tableName)
        .select("name")
        .eq("id", trainingId)
        .maybeSingle();

      if (!data && !isAdmin) {
        const { data: adminData } = await supabase
          .from("trainings_admin")
          .select("name")
          .eq("id", trainingId)
          .maybeSingle();
        if (adminData) {
          data = adminData;
        }
      }

      if (!data) {
        setProgramName(DEFAULT_TRAINING_NAME);
        setLoading(false);
        return;
      }

      const name = data.name ?? "";
      const normalizedName =
        name === LEGACY_DEFAULT_TRAINING_NAME ? DEFAULT_TRAINING_NAME : name;

      setProgramName(normalizedName);
      setLoading(false);
    };

    fetchName();
  }, [trainingId, supabase, isNew, tableName, isAdmin]);

  const handleBlur = async () => {
    setEditing(false);

    const trimmedName = programName.trim();
    const normalizedTrimmed =
      trimmedName === LEGACY_DEFAULT_TRAINING_NAME ? DEFAULT_TRAINING_NAME : trimmedName;
    const finalName = normalizedTrimmed || DEFAULT_TRAINING_NAME;

    setProgramName(finalName);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatePayload: Record<string, any> = { name: finalName, app: true };
    if (tableName === "trainings") {
      updatePayload.dashboard = true;
    }

    let { data: updatedData, error } = await supabase
      .from(tableName)
      .update(updatePayload)
      .eq("id", trainingId)
      .select();

    if ((error || !updatedData || updatedData.length === 0) && !isAdmin) {
      const { error: adminError } = await supabase
        .from("trainings_admin")
        .update({ name: finalName, app: true })
        .eq("id", trainingId);

      if (adminError) {
        console.warn("⚠️ Impossible de mettre à jour le nom dans trainings_admin:", adminError.message || adminError);
      } else {
        console.log("✅ Nom enregistré dans trainings_admin :", finalName);
      }
    } else if (error) {
      console.warn("⚠️ Impossible de mettre à jour le nom:", error.message || error);
    } else {
      console.log("✅ Nom enregistré :", finalName);
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
