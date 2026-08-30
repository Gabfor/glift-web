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
    title: "Création de ton compte",
    subtitle:
      "Crée un compte en moins de 30 secondes pour utiliser la plateforme.\nAucun moyen de paiement n'est nécessaire à l'inscription.",
  },
  payment: {
    title: "Moyen de paiement",
    subtitle: "Active ton essai gratuit en renseignant tes informations de paiement.",
  },
  profile: {
    title: "Inscription terminée !",
    subtitle: "Nous sommes ravis de te compter parmi nous.\nTu peux dès à présent commencer à t’entrainer avec Glift.",
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

  let { title, subtitle } = STEP_DETAILS[step];

  if (step === "account") {
    if (plan === "starter") {
      subtitle = "Crée un compte en moins de 30 secondes pour commencer à utiliser Glift.";
    } else if (plan === "premium") {
      if (isPaymentEnabled) {
        subtitle = "Crée un compte en moins d'une minute pour commencer à utiliser Glift.";
      } else {
        subtitle = "Crée un compte en moins de 30 secondes pour commencer à utiliser Glift.\nAucun moyen de paiement n'est nécessaire à l'inscription.";
      }
    }
  }

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
