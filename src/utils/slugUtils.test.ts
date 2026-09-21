import { describe, it, expect } from "vitest";
import { generateSlugFromTitle } from "./slugUtils";

describe("generateSlugFromTitle", () => {
  it("should handle empty or null strings", () => {
    expect(generateSlugFromTitle("")).toBe("");
    expect(generateSlugFromTitle(null as unknown as string)).toBe("");
    expect(generateSlugFromTitle(undefined as unknown as string)).toBe("");
  });

  it("should convert accents and special French characters properly", () => {
    expect(generateSlugFromTitle("Comment débuter la musculation à la maison ?"))
      .toBe("comment-debuter-la-musculation-a-la-maison");
    expect(generateSlugFromTitle("Cœur & santé : l'impact de l'exercice"))
      .toBe("coeur-et-sante-l-impact-de-l-exercice");
    expect(generateSlugFromTitle("Lætitia et le régime cétogène"))
      .toBe("laetitia-et-le-regime-cetogene");
  });

  it("should handle French elisions and apostrophes cleanly for SEO/GEO", () => {
    expect(generateSlugFromTitle("L'entraînement au poids du corps"))
      .toBe("l-entrainement-au-poids-du-corps");
    expect(generateSlugFromTitle("Qu'est-ce que le RPE en musculation ?"))
      .toBe("qu-est-ce-que-le-rpe-en-musculation");
    expect(generateSlugFromTitle("Bien s’étirer après l’entraînement"))
      .toBe("bien-s-etirer-apres-l-entrainement");
  });

  it("should semantically convert symbols like &, + and %", () => {
    expect(generateSlugFromTitle("Créatine & BCAA : le comparatif"))
      .toBe("creatine-et-bcaa-le-comparatif");
    expect(generateSlugFromTitle("Musculation + Cardio : comment combiner ?"))
      .toBe("musculation-et-cardio-comment-combiner");
    expect(generateSlugFromTitle("100% naturel : guide prise de masse"))
      .toBe("100-pourcent-naturel-guide-prise-de-masse");
  });

  it("should remove punctuation, symbols and duplicate dashes", () => {
    expect(generateSlugFromTitle("Top 10 : les erreurs à éviter !!! (2026)"))
      .toBe("top-10-les-erreurs-a-eviter-2026");
    expect(generateSlugFromTitle("---Titre avec tirets---"))
      .toBe("titre-avec-tirets");
  });
});
