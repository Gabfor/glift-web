export interface VariableSettingsContext {
  starterMaxTrainings?: number;
  starterMaxExercises?: number;
  premiumMonthlyPrice?: string;
  premiumYearlyPrice?: string;
  trialDays?: number;
  interval?: "monthly" | "yearly";
}

/**
 * Remplace les variables dynamiques (ex: {nombre_entrainements}, {nombre_exercices}, etc.)
 * par leurs valeurs réelles configurées dans les paramètres admin du site.
 */
export function replaceSettingsVariables(
  text: string | null | undefined,
  context: VariableSettingsContext
): string {
  if (!text) return "";

  const maxTrainings = context.starterMaxTrainings ?? 1;
  const maxExercises = context.starterMaxExercises ?? 10;
  const monthlyPrice = context.premiumMonthlyPrice || "2,49";
  const yearlyPrice = context.premiumYearlyPrice || "24,99";
  const trialDays = context.trialDays ?? 30;
  const currentPrice = context.interval === "yearly" ? yearlyPrice : monthlyPrice;

  const trainingsLabel = maxTrainings > 1 ? `${maxTrainings} entraînements` : `1 entraînement`;
  const trainingsWord = maxTrainings > 1 ? `entraînements` : `entraînement`;
  const exercisesWord = maxExercises > 1 ? `exercices` : `exercice`;
  const sTrainings = maxTrainings > 1 ? "s" : "";
  const sExercises = maxExercises > 1 ? "s" : "";
  const trainingsTextual = maxTrainings === 1 ? "Un seul" : String(maxTrainings);

  let result = text
    // 1. Textuel entraînement (ex: "Un seul" pour 1, ou "2", "3"...)
    .replace(/\{nombre_entrainements_texte\}/gi, trainingsTextual)
    .replace(/\{nombre_entrainements_textuel\}/gi, trainingsTextual)

    // 2. Entraînements complets (ex: "1 entraînement" ou "3 entraînements")
    .replace(/\{entrainements_inclus\}/gi, trainingsLabel)
    .replace(/\{entrainement_inclus\}/gi, trainingsLabel)

    // 3. Nombre brut d'entraînements
    .replace(/\{nombre_entrainements\}/gi, String(maxTrainings))
    .replace(/\{nombre_d_entrainements\}/gi, String(maxTrainings))
    .replace(/\{starter_max_trainings\}/gi, String(maxTrainings))
    .replace(/\{max_trainings\}/gi, String(maxTrainings))

    // 4. Exercices complets (ex: "10 exercices")
    .replace(/\{exercices_inclus\}/gi, `${maxExercises} ${exercisesWord}`)
    .replace(/\{exercice_inclus\}/gi, `${maxExercises} ${exercisesWord}`)

    // 5. Nombre brut d'exercices
    .replace(/\{nombre_exercices\}/gi, String(maxExercises))
    .replace(/\{nombre_d_exercices\}/gi, String(maxExercises))
    .replace(/\{starter_max_exercises\}/gi, String(maxExercises))
    .replace(/\{max_exercises\}/gi, String(maxExercises))

    // 6. Pluriels conditionnels : {s} ou entraînement{s} / exercice{s}
    .replace(/entraînement\{s\}/gi, trainingsWord)
    .replace(/entrainement\{s\}/gi, trainingsWord)
    .replace(/Entraînement\{s\}/gi, maxTrainings > 1 ? "Entraînements" : "Entraînement")
    .replace(/Entrainement\{s\}/gi, maxTrainings > 1 ? "Entraînements" : "Entraînement")
    .replace(/exercice\{s\}/gi, exercisesWord)
    .replace(/Exercice\{s\}/gi, maxExercises > 1 ? "Exercices" : "Exercice")
    .replace(/\{s_entrainement\}/gi, sTrainings)
    .replace(/\{s_entrainements\}/gi, sTrainings)
    .replace(/\{s_exercice\}/gi, sExercises)
    .replace(/\{s_exercices\}/gi, sExercises)
    .replace(/\{s\}/gi, sTrainings)

    // 7. Prix
    .replace(/\{prix_mensuel\}/gi, monthlyPrice)
    .replace(/\{prix_mois\}/gi, monthlyPrice)
    .replace(/\{premium_monthly_price\}/gi, monthlyPrice)
    .replace(/\{prix_annuel\}/gi, yearlyPrice)
    .replace(/\{prix_an\}/gi, yearlyPrice)
    .replace(/\{premium_yearly_price\}/gi, yearlyPrice)
    .replace(/\{prix_actuel\}/gi, currentPrice)
    .replace(/\{prix\}/gi, currentPrice)

    // 8. Période d'essai
    .replace(/\{duree_essai\}/gi, trialDays < 1 ? "1 heure" : `${trialDays} jours`)
    .replace(/\{trial_days\}/gi, String(trialDays))
    .replace(/\{jours_essai\}/gi, String(trialDays));

  // Rétrocompatibilité intelligente :
  // Si le texte de l'argument Starter en dur mentionne "Un seul entraînement" ou "1 entraînement"
  // et que le réglage a été augmenté (ex: 2) :
  if (maxTrainings > 1) {
    result = result.replace(/un seul\s*entraînement/gi, `${maxTrainings} entraînements`);
    result = result.replace(/Un seul\s*entraînement/gi, `${maxTrainings} entraînements`);
  }

  // De même pour "10 exercices" si starter_max_exercises a été modifié :
  if (maxExercises !== 10) {
    result = result.replace(/10\s*exercices/gi, `${maxExercises} exercices`);
  }

  return result;
}
