import { getNextStepPath, parsePlan, type StepKey } from "@/app/inscription/constants";

const STEP_BY_PATH: Array<{ prefix: string; step: StepKey }> = [
  { prefix: "/inscription/paiement", step: "payment" },
  { prefix: "/inscription/informations", step: "profile" },
  { prefix: "/inscription", step: "account" },
];

export const nextStepPath = (pathname: string, searchParams: URLSearchParams) => {
  const plan = parsePlan(searchParams.get("plan"));
  if (!plan) {
    return "/entrainements";
  }

  const match = STEP_BY_PATH.find(({ prefix }) => pathname.startsWith(prefix));
  const step = match?.step ?? "account";

  return getNextStepPath(plan, step, searchParams);
};
