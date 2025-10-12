export type PlanType = "starter" | "premium";

export type StepKey = "account" | "payment" | "profile";

export type StepMetadata = {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
};

const STEP_DETAILS: Record<StepKey, { title: string; subtitle: string }> = {
  account: {
    title: "Création de votre compte",
    subtitle:
      "Créez un compte en moins d’une minute pour commencer à utiliser la plateforme Glift.",
  },
  payment: {
    title: "Mode de paiement",
    subtitle: "Activez votre essai gratuit en renseignant vos informations de paiement.",
  },
  profile: {
    title: "Inscription terminée !",
    subtitle: "Complétez votre profil pour personnaliser vos entraînements.",
  },
};

const STEP_SEQUENCE: Record<PlanType, StepKey[]> = {
  starter: ["account", "profile"],
  premium: ["account", "payment", "profile"],
};

export const parsePlan = (value: string | null): PlanType | null => {
  if (value === "starter" || value === "premium") {
    return value;
  }

  return null;
};

export const getStepMetadata = (plan: PlanType | null, step: StepKey): StepMetadata | null => {
  if (!plan) {
    return null;
  }

  const sequence = STEP_SEQUENCE[plan];
  const index = sequence.indexOf(step);

  if (index === -1) {
    return null;
  }

  const { title, subtitle } = STEP_DETAILS[step];

  return {
    title,
    subtitle,
    currentStep: index + 1,
    totalSteps: sequence.length,
  };
};

export const getNextStepPath = (plan: PlanType, step: StepKey, searchParams: URLSearchParams) => {
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  if (step === "account") {
    return `/inscription/informations${suffix}`;
  }

  if (step === "payment") {
    return `/inscription/informations${suffix}`;
  }

  return "/entrainements";
};
