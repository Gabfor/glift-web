export type Plan = "starter" | "premium";

export function parsePlan(searchParams: URLSearchParams): Plan {
  const plan = (searchParams.get("plan") || "").toLowerCase();
  return plan === "premium" ? "premium" : "starter";
}

export function nextStepPath(currentPathname: string, searchParams: URLSearchParams): string {
  const plan = parsePlan(searchParams);
  const base = "/inscription";
  const sp = new URLSearchParams(searchParams);
  sp.set("plan", plan);

  // starter: /inscription -> /inscription/informations
  // premium: /inscription -> /inscription/paiement -> /inscription/informations
  if (currentPathname === base) {
    return plan === "premium" ? `${base}/paiement?${sp.toString()}` : `${base}/informations?${sp.toString()}`;
  }
  if (currentPathname === `${base}/paiement`) {
    return `${base}/informations?${sp.toString()}`;
  }
  // fin → tableau de bord / entrainements
  return "/entrainements";
}

export function stepsForPlan(searchParams: URLSearchParams): Array<{ key: string; label: string; href: string }> {
  const plan = parsePlan(searchParams);
  const sp = new URLSearchParams(searchParams);
  sp.set("plan", plan);
  if (plan === "premium") {
    return [
      { key: "signup", label: "Inscription", href: `/inscription?${sp.toString()}` },
      { key: "payment", label: "Paiement", href: `/inscription/paiement?${sp.toString()}` },
      { key: "infos", label: "Informations", href: `/inscription/informations?${sp.toString()}` },
    ];
  }
  return [
    { key: "signup", label: "Inscription", href: `/inscription?${sp.toString()}` },
    { key: "infos", label: "Informations", href: `/inscription/informations?${sp.toString()}` },
  ];
}
