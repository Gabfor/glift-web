"use client";

import { useCallback, useState } from "react";

import { useUser } from "@/context/UserContext";
import { createClientComponentClient } from "@/lib/supabase/client";

const KEY_OVERRIDES: Record<string, string> = {
  birthDate: "birth_date",
  experience: "experience",
  mainGoal: "main_goal",
  trainingPlace: "training_place",
  weeklySessions: "weekly_sessions",
};

const camelToSnake = (input: string) =>
  input.replace(/([a-z0-9])([A-Z])/g, (_, a: string, b: string) => `${a}_${b.toLowerCase()}`).toLowerCase();

const mapValuesToProfilePatch = (values: Record<string, unknown>) => {
  const metadata: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;

    const normalizedKey = KEY_OVERRIDES[key] ?? (key.includes("_") ? key : camelToSnake(key));

    if (normalizedKey === "birth_date" && value === "") {
      metadata[normalizedKey] = null;
      continue;
    }

    metadata[normalizedKey] = value;
  }

  return metadata;
};

type SubmitOptions = {
  values: Record<string, unknown>;
  applyInitials?: () => void;
  onAfterPersist?: () => void;
  debugLabel?: string;
  returnRow?: boolean;
};

export const useProfileSubmit = () => {
  const supabase = createClientComponentClient();
  const { updateUserMetadata } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async ({
      values,
      applyInitials,
      onAfterPersist,
      debugLabel = "profile",
      returnRow = true,
    }: SubmitOptions) => {
      if (loading) {
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        applyInitials?.();

        const profilePatch = mapValuesToProfilePatch(values);
        const {
          data: userResult,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !userResult?.user?.id) {
          setError("Vous devez être connecté pour enregistrer vos informations.");
          return false;
        }

        const userId = userResult.user.id;

        const upsertPayload = {
          id: userId,
          ...profilePatch,
        };

        const query = supabase
          .from("profiles")
          .upsert(upsertPayload, { onConflict: "id" });

        let persisted = true;

        if (returnRow) {
          const { error: updateError, data } = await query.select("id").maybeSingle();

          if (updateError) {
            setError(
              updateError.message || "Impossible d'enregistrer vos informations.",
            );
            return false;
          }

          persisted = Boolean(data?.id);
        } else {
          const { error: updateError } = await query;

          if (updateError) {
            setError(
              updateError.message || "Impossible d'enregistrer vos informations.",
            );
            return false;
          }
        }

        updateUserMetadata(profilePatch);
        onAfterPersist?.();

        return persisted;
      } catch (err) {
        console.error(`[${debugLabel}] submit() unexpected error`, err);
        setError("Une erreur est survenue lors de l'enregistrement.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, supabase, updateUserMetadata]
  );

  return { submit, loading, error };
};
