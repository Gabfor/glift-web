"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CTAButton from "@/components/CTAButton";
import { EXPERIENCE_OPTIONS, GENDER_OPTIONS, MAIN_GOALS } from "@/components/account/constants";
import BirthDateField from "@/components/account/fields/BirthDateField";
import DropdownField from "@/components/account/fields/DropdownField";
import ToggleField from "@/components/account/fields/ToggleField";
import { createClientComponentClient } from "@/lib/supabase/client";

import StepIndicator from "../components/StepIndicator";
import { getNextStepPath, getStepMetadata, parsePlan } from "../constants";

type BirthDateParts = {
  birthDay: string;
  birthMonth: string;
  birthYear: string;
};

type BirthTouchedState = {
  birthDay: boolean;
  birthMonth: boolean;
  birthYear: boolean;
};

const InformationsPage = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = parsePlan(searchParams.get("plan"));
  const stepMetadata = getStepMetadata(plan, "profile");

  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [experience, setExperience] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [genderTouched, setGenderTouched] = useState(false);
  const [experienceTouched, setExperienceTouched] = useState(false);
  const [mainGoalTouched, setMainGoalTouched] = useState(false);
  const [birthTouched, setBirthTouched] = useState<BirthTouchedState>({
    birthDay: false,
    birthMonth: false,
    birthYear: false,
  });
  const [initialBirthParts, setInitialBirthParts] = useState<BirthDateParts>({
    birthDay: "",
    birthMonth: "",
    birthYear: "",
  });

  useEffect(() => {
    const fetchUserMetadata = async () => {
      const { data } = await supabase.auth.getUser();
      const metadata = data?.user?.user_metadata as Record<string, unknown> | undefined;

      if (!metadata) return;

      if (typeof metadata.gender === "string") {
        setGender(metadata.gender);
      }

      if (typeof metadata.experience_years === "string") {
        setExperience(metadata.experience_years);
      }

      if (typeof metadata.main_goal === "string") {
        setMainGoal(metadata.main_goal);
      }

      if (typeof metadata.birth_date === "string" && metadata.birth_date.includes("-")) {
        const [year, month, day] = metadata.birth_date.split("-");
        const nextBirthParts: BirthDateParts = {
          birthYear: year || "",
          birthMonth: month || "",
          birthDay: day || "",
        };
        setBirthYear(nextBirthParts.birthYear);
        setBirthMonth(nextBirthParts.birthMonth);
        setBirthDay(nextBirthParts.birthDay);
        setInitialBirthParts(nextBirthParts);
      }
    };

    void fetchUserMetadata();
    setGenderTouched(false);
    setExperienceTouched(false);
    setMainGoalTouched(false);
    setBirthTouched({
      birthDay: false,
      birthMonth: false,
      birthYear: false,
    });
  }, [supabase]);

  const updateBirthTouched = (partial: Partial<BirthTouchedState>) => {
    setBirthTouched((previous) => ({
      ...previous,
      ...partial,
    }));
  };

  const isFormComplete =
    gender !== "" &&
    birthDay !== "" &&
    birthMonth !== "" &&
    birthYear !== "" &&
    experience !== "" &&
    mainGoal !== "";

  const searchParamsString = searchParams.toString();

  const nextStepPath = useMemo(() => {
    if (!plan) {
      return null;
    }

    const params = new URLSearchParams(searchParamsString);
    return getNextStepPath(plan, "profile", params);
  }, [plan, searchParamsString]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormComplete || loading || !nextStepPath) {
      return;
    }

    setError(null);
    setLoading(true);

    const formattedBirthDate = `${birthYear}-${birthMonth}-${birthDay}`;

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          gender,
          birth_date: formattedBirthDate,
          experience_years: experience,
          main_goal: mainGoal,
        },
      });

      if (updateError) {
        setError(updateError.message || "Impossible d'enregistrer vos informations.");
        setLoading(false);
        return;
      }

      router.refresh();
      router.push(nextStepPath);
    } catch (submitError) {
      console.error(submitError);
      setError("Une erreur est survenue lors de l'enregistrement.");
      setLoading(false);
    }
  };

  if (!plan || !stepMetadata) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] flex flex-col items-center justify-center px-4">
        <div className="max-w-md rounded-[16px] bg-white px-6 py-8 text-center shadow-[0_10px_40px_rgba(46,50,113,0.08)]">
          <h1 className="text-[26px] font-bold text-[#2E3271]">Choisissez une formule</h1>
          <p className="mt-3 text-[15px] font-semibold text-[#5D6494]">
            Pour vous inscrire, sélectionnez d’abord une formule sur la page tarifs.
          </p>
          <Link
            href="/tarifs"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7069FA] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[#6660E4]"
          >
            Voir les tarifs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[60px]">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-center text-[26px] sm:text-[30px] font-bold text-[#2E3271]">{stepMetadata.title}</h1>
        <p className="mt-2 text-center text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug">
          {stepMetadata.subtitle}
        </p>

        <StepIndicator totalSteps={stepMetadata.totalSteps} currentStep={stepMetadata.currentStep} />

        <form onSubmit={handleSubmit} className="mt-10 mx-auto flex w-full max-w-[420px] flex-col items-center">
          <div className="w-[368px] rounded-[16px] bg-[#F4F3FF] px-6 py-5 text-center shadow-[0_10px_40px_rgba(46,50,113,0.08)]">
            <p className="text-[15px] font-semibold text-[#3A416F]">
              Complétez votre profil et aidez-nous à mieux vous connaître en répondant aux 4 questions ci-dessous.
            </p>
          </div>

          {error && (
            <p className="mt-4 w-[368px] text-left text-[13px] font-semibold text-[#EF4444]">
              {error}
            </p>
          )}

          <div className="mt-6 flex w-full flex-col items-center gap-5">
            <ToggleField
              label="Sexe"
              value={gender}
              options={Array.from(GENDER_OPTIONS)}
              onChange={(option) => setGender(option)}
              touched={genderTouched}
              setTouched={() => setGenderTouched(true)}
            />

            <BirthDateField
              birthDay={birthDay}
              birthMonth={birthMonth}
              birthYear={birthYear}
              setBirthDay={setBirthDay}
              setBirthMonth={setBirthMonth}
              setBirthYear={setBirthYear}
              touched={birthTouched}
              setTouched={updateBirthTouched}
              successMessage=""
              initialBirthDay={initialBirthParts.birthDay}
              initialBirthMonth={initialBirthParts.birthMonth}
              initialBirthYear={initialBirthParts.birthYear}
            />

            <ToggleField
              label="Années de pratique"
              value={experience}
              options={Array.from(EXPERIENCE_OPTIONS)}
              onChange={(option) => setExperience(option)}
              touched={experienceTouched}
              setTouched={() => setExperienceTouched(true)}
              variant="boxed"
            />

            <DropdownField
              label="Quel est votre objectif principal ?"
              selected={mainGoal}
              onSelect={(option) => setMainGoal(option)}
              options={Array.from(MAIN_GOALS).map((goal) => ({ value: goal, label: goal }))}
              placeholder="Sélectionnez un objectif"
              touched={mainGoalTouched}
              setTouched={(value) => setMainGoalTouched(value)}
            />
          </div>

          <CTAButton
            type="submit"
            loading={loading}
            disabled={!isFormComplete}
            variant={!isFormComplete ? "inactive" : "active"}
            className="mt-6 w-[368px] justify-center font-bold"
            loadingText="Enregistrement..."
          >
            Enregistrer mes informations
          </CTAButton>

          <Link
            href="/entrainements"
            className="mt-4 text-[14px] font-semibold text-[#7069FA] hover:text-[#6660E4]"
          >
            Ignorer pour le moment
          </Link>
        </form>
      </div>
    </main>
  );
};

export default InformationsPage;
