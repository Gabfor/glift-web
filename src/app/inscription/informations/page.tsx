// src/app/inscription/informations/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import StepDots from "@/components/onboarding/StepDots";
import Spinner from "@/components/ui/Spinner";

// Champs réutilisés (mêmes comportements visuels que ta page compte)
import DropdownField from "@/components/account/fields/DropdownField";
import ToggleField from "@/components/account/fields/ToggleField";
import BirthDateField from "@/components/account/fields/BirthDateField";
import FieldRow from "@/components/account/fields/FieldRow";

// Persist helper (même logique que la page Mes informations)
import { useProfileSubmit } from "@/components/account/MesInformationsForm/hooks/useProfileSubmit";

// Options locales (pas d’imports fragiles)
const GOALS = ["Perte de poids", "Prise de muscle", "Remise en forme", "Performance"];

// Construit YYYY-MM-DD si J/M/A sont présents
function buildBirthDate(day: string, month: string, year: string) {
  return day && month && year ? `${year}-${month}-${day}` : "";
}

// ✅ Helper : conserve le camelCase et supprime les champs vides
function cleanCamel(values: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export default function InformationsPage() {
  const router = useRouter();
  const { submit, loading: hookLoading, error: hookError } = useProfileSubmit();

  // States
  const [gender, setGender] = useState<string>("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [mainGoal, setMainGoal] = useState<string>("");

  // État local de soumission (pour le style du bouton + logs)
  const [submitting, setSubmitting] = useState(false);

  // Touched
  const [touched, setTouched] = useState({
    gender: false,
    birthDay: false,
    birthMonth: false,
    birthYear: false,
    experience: false,
    mainGoal: false,
  });
  const markTouched = (k: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [k]: true }));

  // Validité globale (CTA)
  const isFormValid = Boolean(
    gender && birthDay && birthMonth && birthYear && experience && mainGoal
  );

  // Handlers BirthDateField (et marquage touched)
  const setBDay = (v: string) => {
    setBirthDay(v);
    markTouched("birthDay");
  };
  const setBMonth = (v: string) => {
    setBirthMonth(v);
    markTouched("birthMonth");
  };
  const setBYear = (v: string) => {
    setBirthYear(v);
    markTouched("birthYear");
  };

  // Messages de succès
  const genderSuccess = useMemo(() => {
    if (!touched.gender || !gender) return "";
    if (gender === "Homme") return "Men power !";
    if (gender === "Femme") return "Women power !";
    return "C'est noté.";
  }, [gender, touched.gender]);

  const birthDateSuccess = useMemo(() => {
    const anyTouched = touched.birthDay || touched.birthMonth || touched.birthYear;
    if (anyTouched && birthDay && birthMonth && birthYear)
      return "Super, maintenant on connaît la date de ton anniversaire !";
    return "";
  }, [birthDay, birthMonth, birthYear, touched.birthDay, touched.birthMonth, touched.birthYear]);

  const experienceSuccess = useMemo(() => {
    if (!touched.experience || !experience) return "";
    return "Merci, on va passer les prochaines années ensemble !";
  }, [experience, touched.experience]);

  const mainGoalSuccess = useMemo(() => {
    if (!touched.mainGoal || !mainGoal) return "";
    return "C’est un bel objectif, let’s go !";
  }, [mainGoal, touched.mainGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hookLoading || !isFormValid) return;

    setSubmitting(true);
    console.log("[onboarding] handleSubmit: START");

    // 1) build payload
    const t0 = performance.now();
    const birthDate = buildBirthDate(birthDay, birthMonth, birthYear);
    const camelValues = { birthDate, gender, experience, mainGoal };
    const valuesForDb = cleanCamel(camelValues);
    console.log("[onboarding] valuesForDb =", valuesForDb);
    console.log("[onboarding] build payload:", (performance.now() - t0).toFixed(3), "ms");

    // 2) petit logger de progression (toutes les 5s)
    const startedAt = Date.now();
    const progress = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      console.log(
        `[onboarding/submit] en cours... ${s}s écoulées | gender=${gender || "(vide)"} | birth=${birthDate || "(vide)"} | exp=${experience || "(vide)"} | goal=${mainGoal || "(vide)"}`
      );
    }, 5000);

    try {
      console.time("[onboarding] submit()");
      const ok = await submit({
        values: valuesForDb,          // ✅ camelCase, le hook mappe vers la DB
        applyInitials: () => console.log("[onboarding] applyInitials called"),
        onAfterPersist: () => {},
        debugLabel: "onboarding",
        returnRow: false,             // ✅ pas de SELECT derrière → évite les blocages
      });
      console.timeEnd("[onboarding] submit()");
      console.log(`[onboarding] submit() resolved, success = ${ok}`);

      if (ok) {
        console.log("[onboarding] navigation vers /entrainements");
        router.push("/entrainements");
      }
    } catch (err) {
      console.error("[onboarding] submit() erreur inattendue:", err);
    } finally {
      clearInterval(progress);
      setSubmitting(false);
      console.log("[onboarding] handleSubmit: END");
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px] flex flex-col items-center">
      {/* Titre + sous-titre */}
      <div className="w-full max-w-[760px] text-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">
          Bienvenue&nbsp;!
        </h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug">
          Nous sommes ravis de vous compter parmi nous.
          <br />
          Vous pouvez dès à présent créer votre première entraînement.
        </p>
        <StepDots className="mt-4 mb-6" />
      </div>

      {/* Alerte “Complétez votre profil” */}
      <div className="w-[564px] max-w-full mb-6">
        <div className="relative bg-[#F4F5FE] rounded-[5px] px-5 py-3 text-left">
          <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A1A5FD] rounded-l-[5px]" />
          <p className="text-[#7069FA] font-bold text-[12px] mb-1">Complétez votre profil</p>
          <p className="text-[#A1A5FD] font-semibold text-[12px] leading-relaxed">
            Personnalisez votre expérience avec Glift et aidez-nous à mieux vous
            connaître en répondant aux 4 questions ci-dessous.
          </p>
        </div>
      </div>

      {/* Erreur éventuelle du hook */}
      {hookError && (
        <p className="w-[368px] text-[#EF4444] text-[13px] font-medium mb-2 text-left" role="alert">
          {hookError}
        </p>
      )}

      {/* Formulaire (368px) */}
      <form className="w-[368px] max-w-full" onSubmit={handleSubmit}>
        {/* Sexe */}
        <FieldRow show={false}>
          <ToggleField
            label="Sexe"
            value={gender}
            options={["Homme", "Femme", "Non binaire"]}
            onChange={(v) => {
              setGender(gender === v ? "" : v);
              markTouched("gender");
            }}
            touched={touched.gender}
            setTouched={() => markTouched("gender")}
            success={genderSuccess}
          />
        </FieldRow>

        {/* Date de naissance */}
        <FieldRow show={false}>
          <BirthDateField
            birthDay={birthDay}
            birthMonth={birthMonth}
            birthYear={birthYear}
            setBirthDay={setBDay}
            setBirthMonth={setBMonth}
            setBirthYear={setBYear}
            touched={{
              birthDay: touched.birthDay,
              birthMonth: touched.birthMonth,
              birthYear: touched.birthYear,
            }}
            setTouched={(partial) => {
              if (partial.birthDay !== undefined) markTouched("birthDay");
              if (partial.birthMonth !== undefined) markTouched("birthMonth");
              if (partial.birthYear !== undefined) markTouched("birthYear");
            }}
            successMessage={birthDateSuccess}
            initialBirthDay=""
            initialBirthMonth=""
            initialBirthYear=""
          />
        </FieldRow>

        {/* Années de pratique */}
        <FieldRow show={false}>
          <ToggleField
            label="Années de pratique"
            value={experience}
            options={["0", "1", "2", "3", "4", "5+"]}
            onChange={(v) => {
              setExperience(experience === v ? "" : v);
              markTouched("experience");
            }}
            touched={touched.experience}
            setTouched={() => markTouched("experience")}
            success={experienceSuccess}
            variant="boxed"
            className="w-[368px]"
            itemClassName="w-[53px] h-[45px]"
          />
        </FieldRow>

        {/* Objectif principal */}
        <FieldRow show={false}>
          <DropdownField
            label="Quel est votre objectif principal ?"
            placeholder="Sélectionnez un objectif"
            selected={mainGoal}
            onSelect={(v) => {
              setMainGoal(v);
              markTouched("mainGoal");
            }}
            options={GOALS.map((v) => ({ value: v, label: v }))}
            touched={touched.mainGoal}
            setTouched={(val) => val && markTouched("mainGoal")}
            success={mainGoalSuccess}
          />
        </FieldRow>

        {/* CTA + lien Ignorer */}
        <div className="mt-5 flex flex-col items-center">
          <button
            type="submit"
            aria-busy={hookLoading || submitting}
            aria-disabled={hookLoading || submitting}
            // ❗️NE PAS désactiver pendant le loading → sinon styles globaux :disabled le grisent
            disabled={!isFormValid && !(hookLoading || submitting)}
            className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold
              ${
                hookLoading || submitting
                  ? "bg-[#7069FA] text-white opacity-100 cursor-wait pointer-events-none"
                  : !isFormValid
                  ? "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
                  : "bg-[#7069FA] text-white hover:bg-[#6660E4]"
              }
            `}
          >
            {hookLoading || submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="md" ariaLabel="En cours" />
                En cours...
              </span>
            ) : (
              "Enregistrer mes informations"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              console.log("[onboarding] clic 'Ignorer pour le moment' → /entrainements");
              router.push("/entrainements");
            }}
            className="mt-5 text-[14px] font-semibold text-[#7069FA] hover:text-[#6660E4]"
          >
            Ignorer pour le moment
          </button>
        </div>
      </form>
    </main>
  );
}
