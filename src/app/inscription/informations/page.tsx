"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CTAButton from "@/components/CTAButton";
import StepDots from "@/components/onboarding/StepDots";
import DropdownField from "@/components/account/fields/DropdownField";
import ToggleField from "@/components/account/fields/ToggleField";
import BirthDateField from "@/components/account/fields/BirthDateField";
import FieldRow from "@/components/account/fields/FieldRow";
import { useProfileSubmit } from "@/components/account/MesInformationsForm/hooks/useProfileSubmit";
import { createClientComponentClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";

import { getStepMetadata, parsePlan } from "../constants";

type BirthDateParts = {
  birthDay: string;
  birthMonth: string;
  birthYear: string;
};

const GOALS = ["Perte de poids", "Prise de muscle", "Remise en forme", "Performance"];

function buildBirthDate(day: string, month: string, year: string) {
  return day && month && year ? `${year}-${month}-${day}` : "";
}

function cleanCamel(values: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined) continue;
    result[key] = value;
  }

  return result;
}

const InformationsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const { submit, loading: hookLoading, error: hookError } = useProfileSubmit();
  const emailConfirmationRedirect =
    process.env.NEXT_PUBLIC_SUPABASE_EMAIL_CONFIRM_REDIRECT_URL;

  const planParam = searchParams?.get("plan") ?? null;
  const plan = parsePlan(planParam);
  const stepMetadata = plan ? getStepMetadata(plan, "profile") : null;

  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [experience, setExperience] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initialBirthParts, setInitialBirthParts] = useState<BirthDateParts>({
    birthDay: "",
    birthMonth: "",
    birthYear: "",
  });

  const [touched, setTouched] = useState({
    gender: false,
    birthDay: false,
    birthMonth: false,
    birthYear: false,
    experience: false,
    mainGoal: false,
  });

  const [userEmail, setUserEmail] = useState("");
  const [emailConfirmedAt, setEmailConfirmedAt] = useState<string | null>(null);
  const [refreshingEmailStatus, setRefreshingEmailStatus] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const refreshAuthUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("[onboarding] récupération utilisateur échouée", error);
      return null;
    }

    const user = data?.user ?? null;

    setUserEmail(user?.email ?? "");
    setEmailConfirmedAt(user?.email_confirmed_at ?? null);

    return user;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const fetchUserMetadata = async () => {
      const user = await refreshAuthUser();
      if (!mounted || !user) {
        return;
      }

      const metadata = user.user_metadata as Record<string, unknown> | undefined;
      if (!metadata) {
        return;
      }

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

      setTouched({
        gender: false,
        birthDay: false,
        birthMonth: false,
        birthYear: false,
        experience: false,
        mainGoal: false,
      });
    };

    void fetchUserMetadata();

    return () => {
      mounted = false;
    };
  }, [refreshAuthUser]);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setUserEmail(user?.email ?? "");
        setEmailConfirmedAt(user?.email_confirmed_at ?? null);
      },
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (emailConfirmedAt) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshAuthUser();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [emailConfirmedAt, refreshAuthUser]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (!emailConfirmedAt) {
      return;
    }

    setResendFeedback(null);
  }, [emailConfirmedAt]);

  const handleRefreshEmailStatus = useCallback(async () => {
    if (refreshingEmailStatus) {
      return;
    }

    setRefreshingEmailStatus(true);

    try {
      await refreshAuthUser();
    } finally {
      setRefreshingEmailStatus(false);
    }
  }, [refreshAuthUser, refreshingEmailStatus]);

  const handleResendEmail = useCallback(async () => {
    if (!userEmail || resendLoading || resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    setResendFeedback(null);

    try {
      const options = emailConfirmationRedirect
        ? { emailRedirectTo: emailConfirmationRedirect }
        : undefined;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options,
      });

      if (error) {
        console.error(
          "[onboarding] renvoi email confirmation échoué",
          error,
        );
        setResendFeedback({
          type: "error",
          text:
            error.message ||
            "Impossible d'envoyer un nouvel email de confirmation.",
        });
        return;
      }

      setResendFeedback({
        type: "success",
        text: "Un nouvel email de confirmation vient d'être envoyé.",
      });
      setResendCooldown(60);
    } catch (err) {
      console.error(
        "[onboarding] erreur inattendue lors du renvoi d'email",
        err,
      );
      setResendFeedback({
        type: "error",
        text: "Une erreur est survenue lors de l'envoi de l'email.",
      });
    } finally {
      setResendLoading(false);
    }
  }, [
    emailConfirmationRedirect,
    resendCooldown,
    resendLoading,
    supabase,
    userEmail,
  ]);

  const markTouched = (key: keyof typeof touched) => {
    setTouched((previous) => ({ ...previous, [key]: true }));
  };

  const isFormValid = Boolean(
    gender && birthDay && birthMonth && birthYear && experience && mainGoal
  );

  const isEmailConfirmed = Boolean(emailConfirmedAt);
  const resendDisabled = resendLoading || resendCooldown > 0 || !userEmail;
  const resendHelperText = resendCooldown > 0
    ? `Tu pourras renvoyer un email dans ${resendCooldown}s.`
    : "Tu n'as rien reçu ? Vérifie tes spams ou renvoie un email de confirmation.";

  const genderSuccess = useMemo(() => {
    if (!touched.gender || !gender) return "";
    if (gender === "Homme") return "Men power !";
    if (gender === "Femme") return "Women power !";
    return "C'est noté.";
  }, [gender, touched.gender]);

  const birthDateSuccess = useMemo(() => {
    const anyTouched = touched.birthDay || touched.birthMonth || touched.birthYear;
    if (anyTouched && birthDay && birthMonth && birthYear) {
      return "Super, maintenant on connaît la date de ton anniversaire !";
    }
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hookLoading || submitting || !isFormValid) return;

    setSubmitting(true);
    console.log("[onboarding] handleSubmit: START");

    const birthDate = buildBirthDate(birthDay, birthMonth, birthYear);
    const camelValues = { birthDate, gender, experience, mainGoal };
    const valuesForDb = cleanCamel(camelValues);
    console.log("[onboarding] valuesForDb =", valuesForDb);

    const startedAt = Date.now();
    const progress = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      console.log(
        `[onboarding/submit] en cours... ${seconds}s écoulées | gender=${
          gender || "(vide)"
        } | birth=${birthDate || "(vide)"} | exp=${experience || "(vide)"} | goal=${
          mainGoal || "(vide)"
        }`
      );
    }, 5000);

    try {
      const ok = await submit({
        values: valuesForDb,
        applyInitials: () => console.log("[onboarding] applyInitials called"),
        onAfterPersist: () => {},
        debugLabel: "onboarding",
        returnRow: false,
      });

      console.log(`[onboarding] submit() resolved, success = ${ok}`);

      if (ok) {
        console.log("[onboarding] navigation vers /compte#mes-informations");
        router.push("/compte#mes-informations");
      }
    } catch (err) {
      console.error("[onboarding] submit() erreur inattendue:", err);
    } finally {
      clearInterval(progress);
      setSubmitting(false);
      console.log("[onboarding] handleSubmit: END");
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
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px] flex flex-col items-center">
      <div className="w-full max-w-[760px] text-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">Bienvenue&nbsp;!</h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug">
          Nous sommes ravis de vous compter parmi nous.
          <br />
          Vous pouvez dès à présent créer votre première entraînement.
        </p>
        <StepDots
          className="mt-4 mb-6"
          totalSteps={stepMetadata.totalSteps}
          currentStep={stepMetadata.currentStep}
        />
      </div>

      {!isEmailConfirmed && (
        <div className="mt-6 w-full max-w-[760px]">
          <div className="rounded-[16px] border border-[#DAD8FF] bg-[#F7F5FF] p-5 text-left shadow-[0_10px_30px_rgba(46,50,113,0.05)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-1 items-start gap-3">
                <Image
                  src="/icons/info_blue.svg"
                  alt="Information"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <div className="flex-1">
                  <p className="text-[16px] font-semibold text-[#2E3271]">
                    Confirme ton email pour sécuriser ton compte
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#5D6494]">
                    Un email de validation a été envoyé à{" "}
                    <span className="font-semibold text-[#2E3271]">
                      {userEmail || "ton adresse e-mail"}
                    </span>
                    . Clique sur le lien reçu pour activer définitivement ton compte.
                  </p>
                  {resendFeedback && (
                    <p
                      className={`mt-2 text-[14px] font-semibold ${
                        resendFeedback.type === "success"
                          ? "text-[#00A878]"
                          : "text-[#EF4444]"
                      }`}
                    >
                      {resendFeedback.text}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendDisabled}
                  className="inline-flex items-center justify-center rounded-full border border-[#7069FA] px-4 py-2 text-[14px] font-semibold text-[#7069FA] transition-colors hover:bg-[#ECEBFF] disabled:cursor-not-allowed disabled:border-[#D7D4DC] disabled:text-[#C2BFC6]"
                >
                  {resendLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" ariaLabel="Renvoi en cours" />
                      Renvoyer...
                    </span>
                  ) : (
                    "Renvoyer l'email"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshEmailStatus}
                  disabled={refreshingEmailStatus}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[14px] font-semibold text-[#5D6494] transition-colors hover:bg-white/60 disabled:cursor-not-allowed disabled:text-[#C2BFC6]"
                >
                  {refreshingEmailStatus ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" ariaLabel="Vérification en cours" />
                      Vérification...
                    </span>
                  ) : (
                    "J'ai confirmé mon email"
                  )}
                </button>
                <p className="text-left text-[12px] text-[#8A8DB5] sm:text-right">
                  {resendHelperText}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-[564px] max-w-full mb-6">
        <div className="relative bg-[#F4F5FE] rounded-[5px] px-5 py-3 text-left">
          <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A1A5FD] rounded-l-[5px]" />
          <p className="text-[#7069FA] font-bold text-[12px] mb-1">Complétez votre profil</p>
          <p className="text-[#A1A5FD] font-semibold text-[12px] leading-relaxed">
            Personnalisez votre expérience avec Glift et aidez-nous à mieux vous connaître en répondant aux 4 questions ci-dessous.
          </p>
        </div>
      </div>

      {hookError && (
        <p className="w-[368px] text-[#EF4444] text-[13px] font-medium mb-2 text-left" role="alert">
          {hookError}
        </p>
      )}

      <form className="w-[368px] max-w-full" onSubmit={handleSubmit}>
        <FieldRow show={false}>
          <ToggleField
            label="Sexe"
            value={gender}
            options={["Homme", "Femme", "Non binaire"]}
            onChange={(value) => {
              setGender(gender === value ? "" : value);
              markTouched("gender");
            }}
            touched={touched.gender}
            setTouched={() => markTouched("gender")}
            success={genderSuccess}
          />
        </FieldRow>

        <FieldRow show={false}>
          <BirthDateField
            birthDay={birthDay}
            birthMonth={birthMonth}
            birthYear={birthYear}
            setBirthDay={(value) => {
              setBirthDay(value);
              markTouched("birthDay");
            }}
            setBirthMonth={(value) => {
              setBirthMonth(value);
              markTouched("birthMonth");
            }}
            setBirthYear={(value) => {
              setBirthYear(value);
              markTouched("birthYear");
            }}
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
            initialBirthDay={initialBirthParts.birthDay}
            initialBirthMonth={initialBirthParts.birthMonth}
            initialBirthYear={initialBirthParts.birthYear}
          />
        </FieldRow>

        <FieldRow show={false}>
          <ToggleField
            label="Années de pratique"
            value={experience}
            options={["0", "1", "2", "3", "4", "5+"]}
            onChange={(value) => {
              setExperience(experience === value ? "" : value);
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

        <FieldRow show={false}>
          <DropdownField
            label="Quel est votre objectif principal ?"
            placeholder="Sélectionnez un objectif"
            selected={mainGoal}
            onSelect={(value) => {
              setMainGoal(value);
              markTouched("mainGoal");
            }}
            options={GOALS.map((value) => ({ value, label: value }))}
            touched={touched.mainGoal}
            setTouched={(value) => value && markTouched("mainGoal")}
            success={mainGoalSuccess}
          />
        </FieldRow>

        <div className="mt-5 flex flex-col items-center">
          <CTAButton
            type="submit"
            className="px-[30px] font-semibold"
            disabled={!isFormValid && !(hookLoading || submitting)}
            loading={hookLoading || submitting}
            loadingText="En cours..."
          >
            Enregistrer mes informations
          </CTAButton>

          <button
            type="button"
            onClick={() => {
              console.log(
                "[onboarding] clic 'Ignorer pour le moment' → /compte#mes-informations"
              );
              router.push("/compte#mes-informations");
            }}
            className="mt-5 text-[14px] font-semibold text-[#7069FA] hover:text-[#6660E4]"
          >
            Ignorer pour le moment
          </button>
        </div>
      </form>
    </main>
  );
};

export default InformationsPage;
