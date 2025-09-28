export const getEffortBgColor = (effort: string): string => {
  if (effort === "trop facile") return "#F6FDF7"; // vert clair
  if (effort === "trop dur") return "#FFF1F1";    // rouge clair
  return "transparent";
};

export const getEffortTextColor = (effort: string): string => {
  if (effort === "trop facile") return "#57AE5B"; // vert foncé
  if (effort === "trop dur") return "#EF4F4E";    // rouge foncé
  return "#5D6494"; // couleur par défaut
};
