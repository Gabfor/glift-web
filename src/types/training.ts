export type Row = {
  id?: string;
  series: number;
  repetitions: string[];
  poids: string[];
  repos: string;
  effort: string[];
  checked: boolean;
  iconHovered: boolean;
  exercice: string;
  materiel: string;
  superset_id?: string | null;
  link?: string;
  note?: string;
};

export interface Training {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
  program_id: string;
  position: number;
}

export interface Program {
  id: string;
  name: string;
  dashboard: boolean;
  trainings: Training[];
}

