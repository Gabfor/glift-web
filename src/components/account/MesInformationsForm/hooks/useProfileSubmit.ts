"use client";

import { useCallback, useState } from "react";

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

const mapValuesToMetadata = (values: Record<string, unknown>) => {
  const metadata: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    const normalizedKey = KEY_OVERRIDES[key] ?? (key.includes("_") ? key : camelToSnake(key));
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

        const metadata = mapValuesToMetadata(values);
        const { data, error: updateError } = await supabase.auth.updateUser({
          data: metadata,
        });

        if (updateError) {
          setError(updateError.message || "Impossible d'enregistrer vos informations.");
          return false;
        }

        onAfterPersist?.();

        if (!returnRow) {
          return true;
        }

        return Boolean(data?.user);
      } catch (err) {
        console.error(`[${debugLabel}] submit() unexpected error`, err);
        setError("Une erreur est survenue lors de l'enregistrement.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, supabase]
  );

  return { submit, loading, error };
};
