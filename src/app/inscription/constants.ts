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

const getStepSequence = (plan: PlanType, isPaymentEnabled: boolean): StepKey[] => {
  if (plan === "premium" && isPaymentEnabled) {
    return ["account", "payment", "profile"];
  }
  return ["account", "profile"];
};

export const parsePlan = (value: string | null): PlanType | null => {
  if (value === "starter" || value === "premium") {
    return value;
  }

  return null;
};

export const getStepMetadata = (plan: PlanType | null, step: StepKey, isPaymentEnabled: boolean = false): StepMetadata | null => {
  if (!plan) {
    return null;
  }

  const sequence = getStepSequence(plan, isPaymentEnabled);
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

export const getNextStepPath = (plan: PlanType, step: StepKey, searchParams: URLSearchParams, isPaymentEnabled: boolean = false) => {
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  const sequence = getStepSequence(plan, isPaymentEnabled);
  const currentIndex = sequence.indexOf(step);
  const nextStep = sequence[currentIndex + 1];

  if (nextStep === "payment") {
    return `/inscription/paiement${suffix}`;
  }

  if (nextStep === "profile") {
    return `/inscription/informations${suffix}`;
  }

  return "/entrainements";
};
