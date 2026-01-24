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
  locked?: boolean;
  superset_id_locked?: boolean;
};

export interface Training {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
  program_id: string;
  position: number;
  locked: boolean;
}

export interface Program {
  id: string;
  name: string;
  app: boolean;
  dashboard: boolean;
  trainings: Training[];
}

