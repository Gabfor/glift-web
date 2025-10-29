"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  COUNTRIES,
  EXPERIENCE_OPTIONS,
  GENDER_OPTIONS,
  MAIN_GOALS,
  SUPPLEMENTS_OPTIONS,
  TRAINING_PLACES,
  WEEKLY_SESSIONS_OPTIONS,
} from "@/components/account/constants";
import BirthDateField from "@/components/account/fields/BirthDateField";
import DropdownField from "@/components/account/fields/DropdownField";
import SubmitButton from "@/components/account/fields/SubmitButton";
import TextField from "@/components/account/fields/TextField";
import ToggleField from "@/components/account/fields/ToggleField";
import CountryFlag from "@/components/flags/CountryFlag";
import { getCountryCode } from "@/utils/countryCodes";

type FormState = {
  name: string;
  email: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  country: string;
  experience: string;
  mainGoal: string;
  trainingPlace: string;
  weeklySessions: string;
  supplements: string;
};

type FieldTouchedState = {
  gender: boolean;
  country: boolean;
  experience: boolean;
  mainGoal: boolean;
  trainingPlace: boolean;
  weeklySessions: boolean;
  supplements: boolean;
};

type BirthTouchedState = {
  birthDay: boolean;
  birthMonth: boolean;
  birthYear: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  gender: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  country: "",
  experience: "",
  mainGoal: "",
  trainingPlace: "",
  weeklySessions: "",
  supplements: "",
};

const createInitialFieldTouched = (): FieldTouchedState => ({
  gender: false,
  country: false,
  experience: false,
  mainGoal: false,
  trainingPlace: false,
  weeklySessions: false,
  supplements: false,
});

const createInitialBirthTouched = (): BirthTouchedState => ({
  birthDay: false,
  birthMonth: false,
  birthYear: false,
});

const pickString = (
  value: unknown,
  metadata: Record<string, unknown>,
  key: string,
) => {
  if (typeof value === "string") {
    return value;
  }

  const fallback = metadata[key];
  return typeof fallback === "string" ? fallback : "";
};

const parseBirthDate = (value: unknown, metadata: Record<string, unknown>) => {
  const source =
    typeof value === "string" && value.includes("-")
      ? value
      : typeof metadata.birth_date === "string"
      ? metadata.birth_date
      : "";

  if (!source) {
    return {
      birthDay: "",
      birthMonth: "",
      birthYear: "",
    } satisfies Pick<FormState, "birthDay" | "birthMonth" | "birthYear">;
  }

  const [year, month, day] = source.split("-");

  return {
    birthYear: typeof year === "string" ? year : "",
    birthMonth:
      typeof month === "string" && month ? month.padStart(2, "0") : "",
    birthDay: typeof day === "string" && day ? day.padStart(2, "0") : "",
  } satisfies Pick<FormState, "birthDay" | "birthMonth" | "birthYear">;
};

const combineBirthDate = (form: FormState) => {
  if (form.birthDay && form.birthMonth && form.birthYear) {
    return `${form.birthYear}-${form.birthMonth}-${form.birthDay}`;
  }

  return null;
};

const cloneForm = (form: FormState): FormState => ({ ...form });

const areFormsEqual = (a: FormState | null, b: FormState | null) => {
  if (!a || !b) {
    return false;
  }

  return (
    a.name === b.name &&
    a.email === b.email &&
    a.gender === b.gender &&
    a.birthDay === b.birthDay &&
    a.birthMonth === b.birthMonth &&
    a.birthYear === b.birthYear &&
    a.country === b.country &&
    a.experience === b.experience &&
    a.mainGoal === b.mainGoal &&
    a.trainingPlace === b.trainingPlace &&
    a.weeklySessions === b.weeklySessions &&
    a.supplements === b.supplements
  );
};

type CloseOptions = {
  refresh?: boolean;
};

type Props = {
  userId: string;
  onClose: (options?: CloseOptions) => void;
};

export default function AdminUserEditor({ userId, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldTouched, setFieldTouched] = useState<FieldTouchedState>(() =>
    createInitialFieldTouched(),
  );
  const [birthTouched, setBirthTouched] = useState<BirthTouchedState>(() =>
    createInitialBirthTouched(),
  );

  const isDirty = useMemo(
    () => (initialForm ? !areFormsEqual(form, initialForm) : false),
    [form, initialForm],
  );

  const formContainerClass = "w-full max-w-[768px]";
  const fieldWrapperClass = "flex w-full justify-center md:justify-start";

  const resetState = useCallback(() => {
    setForm(EMPTY_FORM);
    setInitialForm(null);
    setError(null);
    setLoading(true);
    setFieldTouched(createInitialFieldTouched());
    setBirthTouched(createInitialBirthTouched());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      resetState();

      try {
        const response = await fetch(`/api/admin/users/${userId}`);

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          if (cancelled) {
            return;
          }

          setError(
            payload?.error ??
              "Impossible de récupérer les informations de l'utilisateur.",
          );
          setLoading(false);
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | {
              user?: {
                id: string;
                email?: string | null;
                name?: string | null;
                gender?: string | null;
                birth_date?: string | null;
                country?: string | null;
                experience?: string | null;
                main_goal?: string | null;
                training_place?: string | null;
                weekly_sessions?: string | null;
                supplements?: string | null;
                metadata?: Record<string, unknown>;
              };
            }
          | null;

        if (cancelled) {
          return;
        }

        const details = payload?.user;

        if (!details) {
          setError("Utilisateur introuvable.");
          setLoading(false);
          return;
        }

        const metadata =
          (details.metadata && typeof details.metadata === "object"
            ? details.metadata
            : {}) as Record<string, unknown>;

        const nextForm: FormState = {
          name: pickString(details.name, metadata, "name"),
          email: typeof details.email === "string" ? details.email : "",
          gender: pickString(details.gender, metadata, "gender"),
          country: pickString(details.country, metadata, "country"),
          experience: pickString(details.experience, metadata, "experience"),
          mainGoal: pickString(details.main_goal, metadata, "main_goal"),
          trainingPlace: pickString(
            details.training_place,
            metadata,
            "training_place",
          ),
          weeklySessions: pickString(
            details.weekly_sessions,
            metadata,
            "weekly_sessions",
          ),
          supplements: pickString(details.supplements, metadata, "supplements"),
          ...parseBirthDate(details.birth_date, metadata),
        };

        setForm(nextForm);
        setInitialForm(cloneForm(nextForm));
        setFieldTouched(createInitialFieldTouched());
        setBirthTouched(createInitialBirthTouched());
        setLoading(false);
        setError(null);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }
        console.error("[AdminUserEditor] fetch failed", fetchError);
        setError(
          "Une erreur est survenue lors du chargement de l'utilisateur.",
        );
        setLoading(false);
      }
    };

    void fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [resetState, userId]);

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setError(null);
    },
    [],
  );

  const setFieldTouchedValue = useCallback(
    <K extends keyof FieldTouchedState>(field: K, value: boolean) => {
      setFieldTouched((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!initialForm) {
      return;
    }

    const trimmedForm: FormState = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
    };

    setForm(trimmedForm);
    setSaving(true);
    setError(null);

    try {
      if (!trimmedForm.name) {
        throw new Error("Le prénom est obligatoire.");
      }

      if (!trimmedForm.email) {
        throw new Error("L'email est obligatoire.");
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedForm.name,
          email: trimmedForm.email,
          gender: trimmedForm.gender,
          birthDate: combineBirthDate(trimmedForm),
          country: trimmedForm.country,
          experience: trimmedForm.experience,
          mainGoal: trimmedForm.mainGoal,
          trainingPlace: trimmedForm.trainingPlace,
          weeklySessions: trimmedForm.weeklySessions,
          supplements: trimmedForm.supplements,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ??
            "Impossible d'enregistrer les modifications de l'utilisateur.",
        );
      }

      setInitialForm(cloneForm(trimmedForm));
      setFieldTouched(createInitialFieldTouched());
      setBirthTouched(createInitialBirthTouched());
      onClose({ refresh: true });
    } catch (submitError) {
      console.error("[AdminUserEditor] submit failed", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center px-4">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
          Modifier un utilisateur
        </h2>
        <div
          className={`${formContainerClass} grid grid-cols-1 place-items-center gap-4 md:grid-cols-2 md:gap-x-8 md:place-items-start`}
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-[45px] w-[368px] rounded-[5px] bg-[#ECE9F1]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center px-4">
      <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
        Modifier un utilisateur
      </h2>

      {error && (
        <div
          className={`${formContainerClass} rounded-[8px] bg-[#FFE3E3] px-4 py-3 text-center text-[14px] font-semibold text-[#EF4F4E] md:text-left`}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${formContainerClass} grid grid-cols-1 place-items-center gap-1 md:grid-cols-2 md:gap-x-8 md:place-items-start`}
      >
        <div className={fieldWrapperClass}>
          <TextField
            label="Prénom"
            value={form.name}
            onChange={(value) => {
              updateField("name", value);
            }}
          />
        </div>

        <div className={fieldWrapperClass}>
          <TextField
            label="Email"
            value={form.email}
            onChange={(value) => {
              updateField("email", value);
            }}
          />
        </div>

        <div className={fieldWrapperClass}>
          <ToggleField
            label="Sexe"
            value={form.gender}
            options={Array.from(GENDER_OPTIONS)}
            onChange={(value) => {
              updateField("gender", value);
              setFieldTouchedValue("gender", true);
            }}
            touched={fieldTouched.gender}
            setTouched={() => setFieldTouchedValue("gender", true)}
          />
        </div>

        <div className={fieldWrapperClass}>
          <BirthDateField
            birthDay={form.birthDay}
            birthMonth={form.birthMonth}
            birthYear={form.birthYear}
            setBirthDay={(value) => {
              updateField("birthDay", value);
              setBirthTouched((current) => ({ ...current, birthDay: true }));
            }}
            setBirthMonth={(value) => {
              updateField("birthMonth", value);
              setBirthTouched((current) => ({ ...current, birthMonth: true }));
            }}
            setBirthYear={(value) => {
              updateField("birthYear", value);
              setBirthTouched((current) => ({ ...current, birthYear: true }));
            }}
            touched={birthTouched}
            setTouched={(partial) =>
              setBirthTouched((current) => ({ ...current, ...partial }))
            }
            successMessage=""
            initialBirthDay={initialForm?.birthDay ?? ""}
            initialBirthMonth={initialForm?.birthMonth ?? ""}
            initialBirthYear={initialForm?.birthYear ?? ""}
          />
        </div>

        <div className={fieldWrapperClass}>
          <DropdownField
            label="Pays de résidence"
            placeholder="Sélectionnez un pays"
            selected={form.country}
            onSelect={(value) => {
              updateField("country", value);
              setFieldTouchedValue("country", true);
            }}
            options={COUNTRIES.map((country) => {
              const code = getCountryCode(country);

              return {
                value: country,
                label: country,
                icon: code ? <CountryFlag code={code} /> : undefined,
              };
            })}
            touched={fieldTouched.country}
            setTouched={(next) => setFieldTouchedValue("country", next)}
          />
        </div>

        <div className={fieldWrapperClass}>
          <ToggleField
            label="Années de pratique"
            value={form.experience}
            options={Array.from(EXPERIENCE_OPTIONS)}
            onChange={(value) => {
              updateField("experience", value);
              setFieldTouchedValue("experience", true);
            }}
            touched={fieldTouched.experience}
            setTouched={() => setFieldTouchedValue("experience", true)}
            variant="boxed"
          />
        </div>

        <div className={fieldWrapperClass}>
          <DropdownField
            label="Objectif principal"
            placeholder="Sélectionnez un objectif"
            selected={form.mainGoal}
            onSelect={(value) => {
              updateField("mainGoal", value);
              setFieldTouchedValue("mainGoal", true);
            }}
            options={MAIN_GOALS.map((goal) => ({ value: goal, label: goal }))}
            touched={fieldTouched.mainGoal}
            setTouched={(next) => setFieldTouchedValue("mainGoal", next)}
          />
        </div>

        <div className={fieldWrapperClass}>
          <ToggleField
            label="Lieu d’entraînement"
            value={form.trainingPlace}
            options={Array.from(TRAINING_PLACES)}
            onChange={(value) => {
              updateField("trainingPlace", value);
              setFieldTouchedValue("trainingPlace", true);
            }}
            touched={fieldTouched.trainingPlace}
            setTouched={() => setFieldTouchedValue("trainingPlace", true)}
          />
        </div>

        <div className={fieldWrapperClass}>
          <ToggleField
            label="Nombre de séances par semaine"
            value={form.weeklySessions}
            options={Array.from(WEEKLY_SESSIONS_OPTIONS)}
            onChange={(value) => {
              updateField("weeklySessions", value);
              setFieldTouchedValue("weeklySessions", true);
            }}
            touched={fieldTouched.weeklySessions}
            setTouched={() => setFieldTouchedValue("weeklySessions", true)}
            variant="boxed"
          />
        </div>

        <div className={fieldWrapperClass}>
          <ToggleField
            label="Prise de compléments alimentaires"
            value={form.supplements}
            options={Array.from(SUPPLEMENTS_OPTIONS)}
            onChange={(value) => {
              updateField("supplements", value);
              setFieldTouchedValue("supplements", true);
            }}
            touched={fieldTouched.supplements}
            setTouched={() => setFieldTouchedValue("supplements", true)}
          />
        </div>

        <div className="flex w-full justify-center md:col-span-2">
          <SubmitButton
            loading={saving}
            disabled={!isDirty || saving}
            label="Enregistrer"
          />
        </div>
      </form>
    </div>
  );
}
