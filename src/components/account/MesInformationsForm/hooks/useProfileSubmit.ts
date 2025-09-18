// src/components/account/MesInformationsForm/hooks/useProfileSubmit.ts
"use client";

import { useCallback, useRef, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import type { InitialValues } from "../utils/types";

export type SubmitValues = {
  name?: string;
  birthDate?: string;       // YYYY-MM-DD
  gender?: string;
  country?: string;
  experience?: string;
  mainGoal?: string;
  trainingPlace?: string;
  weeklySessions?: string;
  supplements?: string;
  // ⚠️ pas d'avatar_url ici (pas de colonne en DB)
};

type SubmitArgs = {
  values: SubmitValues;
  applyInitials?: (patch: Partial<InitialValues>) => void;
  onAfterPersist?: () => void;
  debugLabel?: string;
  /** Si false: pas de SELECT après upsert (utile pour /inscription) */
  returnRow?: boolean;
};

// Modèle minimal de la ligne "profiles" (snake_case côté DB)
type ProfileRow = {
  id: string;
  name: string | null;
  gender: string | null;
  country: string | null;
  experience: string | null;
  main_goal: string | null;
  training_place: string | null;
  weekly_sessions: string | null;
  supplements: string | null;
  birth_date: string | null;
  // ⚠️ pas d'avatar_url ici
};

const DEBUG = true;
const dlog = (...a: any[]) => DEBUG && console.log("[useProfileSubmit]", ...a);
const derr = (...a: any[]) => DEBUG && console.error("[useProfileSubmit]", ...a);

// Convertit '' -> null (DB friendly)
const nn = (v: unknown) => (v === "" || v === undefined ? null : v);

// Construit le payload snake_case à partir des valeurs du formulaire
function toProfilesRow(userId: string, v: SubmitValues) {
  const row: Record<string, any> = { id: userId };
  if (v.name !== undefined) row.name = nn(v.name);
  if (v.gender !== undefined) row.gender = nn(v.gender);
  if (v.country !== undefined) row.country = nn(v.country);
  if (v.experience !== undefined) row.experience = nn(v.experience);
  if (v.mainGoal !== undefined) row.main_goal = nn(v.mainGoal);
  if (v.trainingPlace !== undefined) row.training_place = nn(v.trainingPlace);
  if (v.weeklySessions !== undefined) row.weekly_sessions = nn(v.weeklySessions);
  if (v.supplements !== undefined) row.supplements = nn(v.supplements);
  if (v.birthDate !== undefined) row.birth_date = nn(v.birthDate); // YYYY-MM-DD || null
  return row;
}

export function useProfileSubmit() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runRef = useRef<number>(0);

  const submit = useCallback(
    async ({
      values,
      applyInitials,
      onAfterPersist,
      debugLabel,
      returnRow = true,
    }: SubmitArgs): Promise<boolean> => {
      const runId = Date.now();
      runRef.current = runId;

      setError(null);
      setLoading(true);

      const tag = `[useProfileSubmit]${debugLabel ? ` (${debugLabel})` : ""}`;

      try {
        dlog(`${tag} START`);

        // 1) Auth
        console.time(`${tag} getUser`);
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        console.timeEnd(`${tag} getUser`);

        if (userErr || !user?.id) {
          derr(`${tag} auth error:`, userErr || "no user id");
          setError("Authentification requise.");
          return false;
        }

        console.time(`${tag} getSession`);
        const {
          data: { session },
          error: sessErr,
        } = await supabase.auth.getSession();
        console.timeEnd(`${tag} getSession`);
        if (sessErr) console.warn(`${tag} getSession warn:`, sessErr);
        dlog(`${tag} haveAccessToken=${!!session?.access_token}`);

        // 2) Payload
        const updates = toProfilesRow(user.id, values);
        const keys = Object.keys(updates).filter((k) => k !== "id");
        dlog(`${tag} updates keys=`, keys);
        if (keys.length === 0) {
          dlog(`${tag} payload vide → OK`);
          return true;
        }

        // 3) Tentative A : supabase-js
        console.time(`${tag} upsert(supabase-js)`);
        let supaOk = false;
        try {
          const q = supabase.from("profiles").upsert(updates, { onConflict: "id" });

          if (!returnRow) {
            const { error: err } = await q;
            if (!err) {
              // patch UI basé sur values
              const patch: Partial<InitialValues> = {
                ...("name" in values ? { name: values.name ?? "" } : {}),
                ...("gender" in values ? { gender: values.gender ?? "" } : {}),
                ...("country" in values ? { country: values.country ?? "" } : {}),
                ...("experience" in values ? { experience: values.experience ?? "" } : {}),
                ...("mainGoal" in values ? { mainGoal: values.mainGoal ?? "" } : {}),
                ...("trainingPlace" in values ? { trainingPlace: values.trainingPlace ?? "" } : {}),
                ...("weeklySessions" in values ? { weeklySessions: values.weeklySessions ?? "" } : {}),
                ...("supplements" in values ? { supplements: values.supplements ?? "" } : {}),
                ...("birthDate" in values ? { birthDate: values.birthDate ?? "" } : {}),
              };
              try { applyInitials?.(patch); } catch (e) { console.warn(`${tag} applyInitials(no select) warn:`, e); }
              try { onAfterPersist?.(); } catch (e) { console.warn(`${tag} onAfterPersist(no select) warn:`, e); }
              console.timeEnd(`${tag} upsert(supabase-js)`);
              dlog(`${tag} SUCCESS via supabase-js (no select)`);
              supaOk = true;
            }
          } else {
            const resp = await q
              .select(
                "id,name,gender,country,experience,main_goal,training_place,weekly_sessions,supplements,birth_date"
              )
              .single();
            const { data: row, error: err } = resp as unknown as { data: ProfileRow | null; error: any };
            if (!err) {
              const patch: Partial<InitialValues> = {
                name: row?.name ?? "",
                gender: row?.gender ?? "",
                country: row?.country ?? "",
                experience: row?.experience ?? "",
                mainGoal: row?.main_goal ?? "",
                trainingPlace: row?.training_place ?? "",
                weeklySessions: row?.weekly_sessions ?? "",
                supplements: row?.supplements ?? "",
                birthDate: row?.birth_date ?? "",
              };
              try { applyInitials?.(patch); } catch (e) { console.warn(`${tag} applyInitials warn:`, e); }
              try { onAfterPersist?.(); } catch (e) { console.warn(`${tag} onAfterPersist warn:`, e); }
              console.timeEnd(`${tag} upsert(supabase-js)`);
              dlog(`${tag} SUCCESS via supabase-js (with select)`);
              supaOk = true;
            } else {
              console.warn(`${tag} supabase-js upsert error:`, err);
            }
          }
        } catch (e) {
          console.warn(`${tag} supabase-js upsert threw:`, e);
        }
        if (supaOk) return true;
        console.timeEnd(`${tag} upsert(supabase-js)`);

        // 4) Tentative B : REST fallback (PostgREST) – verbeux pour debug
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !session?.access_token) {
          console.error(`${tag} REST fallback impossible (config/auth manquants)`, {
            hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY, hasToken: !!session?.access_token,
          });
          setError("Impossible d'enregistrer (auth ou configuration manquante).");
          return false;
        }

        console.time(`${tag} upsert(REST fallback)`);
        const prefer = `resolution=merge-duplicates,return=${returnRow ? "representation" : "minimal"}`;
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            Prefer: prefer,
          },
          body: JSON.stringify([updates]),
        });
        console.timeEnd(`${tag} upsert(REST fallback)`);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(`${tag} REST upsert failed:`, res.status, text);
          setError(`Impossible d'enregistrer : ${res.status} ${text || ""}`);
          return false;
        }

        let row: ProfileRow | null = null;
        if (returnRow) {
          const arr = (await res.json().catch(() => null)) as ProfileRow[] | null;
          row = arr?.[0] ?? null;
        }

        const patch: Partial<InitialValues> = returnRow
          ? {
              name: row?.name ?? "",
              gender: row?.gender ?? "",
              country: row?.country ?? "",
              experience: row?.experience ?? "",
              mainGoal: row?.main_goal ?? "",
              trainingPlace: row?.training_place ?? "",
              weeklySessions: row?.weekly_sessions ?? "",
              supplements: row?.supplements ?? "",
              birthDate: row?.birth_date ?? "",
            }
          : {
              ...("name" in values ? { name: values.name ?? "" } : {}),
              ...("gender" in values ? { gender: values.gender ?? "" } : {}),
              ...("country" in values ? { country: values.country ?? "" } : {}),
              ...("experience" in values ? { experience: values.experience ?? "" } : {}),
              ...("mainGoal" in values ? { mainGoal: values.mainGoal ?? "" } : {}),
              ...("trainingPlace" in values ? { trainingPlace: values.trainingPlace ?? "" } : {}),
              ...("weeklySessions" in values ? { weeklySessions: values.weeklySessions ?? "" } : {}),
              ...("supplements" in values ? { supplements: values.supplements ?? "" } : {}),
              ...("birthDate" in values ? { birthDate: values.birthDate ?? "" } : {}),
            };

        try { applyInitials?.(patch); } catch (e) { console.warn(`${tag} applyInitials(REST) warn:`, e); }
        try { onAfterPersist?.(); } catch (e) { console.warn(`${tag} onAfterPersist(REST) warn:`, e); }

        dlog(`${tag} SUCCESS via REST fallback`);
        return true;
      } catch (e: any) {
        console.error(`${tag} unexpected error:`, e);
        setError(`Erreur inattendue : ${e?.message || String(e)}`);
        return false;
      } finally {
        if (runRef.current === runId) setLoading(false);
        dlog(`${tag} END`);
      }
    },
    [supabase]
  );

  return { submit, loading, error };
}

export default useProfileSubmit;
