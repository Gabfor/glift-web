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

const days = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const months = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

const years = Array.from({ length: 100 }, (_, index) =>
  String(new Date().getFullYear() - index),
);

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

type Props = {
  userId: string;
  onClose: () => void;
};

export default function AdminUserEditor({ userId, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDirty = useMemo(
    () => (initialForm ? !areFormsEqual(form, initialForm) : false),
    [form, initialForm],
  );

  const resetState = useCallback(() => {
    setForm(EMPTY_FORM);
    setInitialForm(null);
    setError(null);
    setSuccess(null);
    setLoading(true);
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
      setSuccess(null);
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
    setSuccess(null);

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
      setSuccess("Modifications enregistrées avec succès.");
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

  const fieldLabelClass = "text-[16px] font-bold text-[#3A416F] mb-[6px]";
  const inputClass =
    "h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#3A416F] placeholder:text-[#C2BFC6] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] focus:border-transparent";

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center">
          Modifier un utilisateur
        </h2>
        <div className="w-full max-w-3xl rounded-[16px] bg-white p-8 shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
          <div className="space-y-4">
            <div className="h-[45px] rounded-[5px] bg-[#ECE9F1]" />
            <div className="h-[45px] rounded-[5px] bg-[#ECE9F1]" />
            <div className="h-[45px] rounded-[5px] bg-[#ECE9F1]" />
            <div className="h-[45px] rounded-[5px] bg-[#ECE9F1]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClose}
        className="mb-6 self-start text-[14px] font-semibold text-[#7069FA] hover:text-[#3A416F]"
      >
        ← Retour à la liste
      </button>

      <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[30px]">
        Modifier un utilisateur
      </h2>

      <div className="w-full max-w-3xl rounded-[16px] bg-white p-8 shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
        {error && (
          <div className="mb-4 rounded-[8px] bg-[#FFE3E3] px-4 py-3 text-[14px] font-semibold text-[#EF4F4E]">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-[8px] bg-[#DCFAF1] px-4 py-3 text-[14px] font-semibold text-[#00B47D]">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <label className={fieldLabelClass} htmlFor="name">
                Prénom
              </label>
              <input
                id="name"
                className={inputClass}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Prénom"
              />
            </div>

            <div className="flex flex-col">
              <label className={fieldLabelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Sexe</span>
              <SegmentedToggle
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(value) => updateField("gender", value)}
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Date de naissance</span>
              <div className="flex gap-2">
                <SelectField
                  placeholder="Jour"
                  options={days.map((day) => ({ value: day, label: day }))}
                  value={form.birthDay}
                  onChange={(value) => updateField("birthDay", value)}
                />
                <SelectField
                  placeholder="Mois"
                  options={months}
                  value={form.birthMonth}
                  onChange={(value) => updateField("birthMonth", value)}
                />
                <SelectField
                  placeholder="Année"
                  options={years.map((year) => ({ value: year, label: year }))}
                  value={form.birthYear}
                  onChange={(value) => updateField("birthYear", value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Pays de résidence</span>
              <SelectField
                placeholder="Sélectionner un pays"
                options={COUNTRIES.map((country) => ({
                  value: country,
                  label: country,
                }))}
                value={form.country}
                onChange={(value) => updateField("country", value)}
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Années de pratique</span>
              <SegmentedToggle
                options={EXPERIENCE_OPTIONS}
                value={form.experience}
                onChange={(value) => updateField("experience", value)}
                variant="boxed"
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Objectif principal</span>
              <SelectField
                placeholder="Sélectionner un objectif"
                options={MAIN_GOALS.map((goal) => ({ value: goal, label: goal }))}
                value={form.mainGoal}
                onChange={(value) => updateField("mainGoal", value)}
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Lieu d&apos;entraînement</span>
              <SegmentedToggle
                options={TRAINING_PLACES}
                value={form.trainingPlace}
                onChange={(value) => updateField("trainingPlace", value)}
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Nombre de séances par semaine</span>
              <SegmentedToggle
                options={WEEKLY_SESSIONS_OPTIONS}
                value={form.weeklySessions}
                onChange={(value) => updateField("weeklySessions", value)}
                variant="boxed"
              />
            </div>

            <div className="flex flex-col">
              <span className={fieldLabelClass}>Prise de compléments alimentaires</span>
              <SegmentedToggle
                options={SUPPLEMENTS_OPTIONS}
                value={form.supplements}
                onChange={(value) => updateField("supplements", value)}
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={!isDirty || saving}
              className={`h-[48px] rounded-[30px] px-8 text-[16px] font-semibold text-white transition-colors duration-150 ${
                !isDirty || saving
                  ? "bg-[#C2C1F0]"
                  : "bg-[#7069FA] hover:bg-[#5B55E0]"
              }`}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ToggleProps = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  variant?: "segmented" | "boxed";
};

function SegmentedToggle({
  options,
  value,
  onChange,
  variant = "segmented",
}: ToggleProps) {
  if (variant === "segmented") {
    return (
      <div className="flex h-[45px]">
        {options.map((option, index) => {
          const selected = value === option;
          const baseClasses =
            "flex-1 border text-[16px] font-semibold transition-all duration-150";
          const radiusClasses = `${
            index === 0
              ? "rounded-l-[5px]"
              : index === options.length - 1
              ? "rounded-r-[5px]"
              : ""
          }`;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(selected ? "" : option)}
              className={`${baseClasses} ${
                index > 0 ? "-ml-px" : ""
              } ${radiusClasses} ${
                selected
                  ? "bg-[#F2F1FF] text-[#3A416F] border-[#7069FA] z-10"
                  : "bg-white text-[#D7D4DC] border-[#D7D4DC] hover:border-[#C2BFC6]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(selected ? "" : option)}
            className={`h-[45px] min-w-[53px] rounded-[8px] border px-4 text-[16px] font-semibold transition-all duration-150 ${
              selected
                ? "bg-[#F2F1FF] text-[#3A416F] border-[#7069FA]"
                : "bg-white text-[#D7D4DC] border-[#D7D4DC] hover:border-[#C2BFC6]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

type SelectFieldProps = {
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
};

function SelectField({ placeholder, options, value, onChange }: SelectFieldProps) {
  return (
    <select
      className="h-[45px] flex-1 rounded-[5px] border border-[#D7D4DC] bg-white px-[15px] text-[16px] font-semibold text-[#3A416F] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] focus:border-transparent"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
