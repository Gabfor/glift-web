import type { Database } from "@/lib/supabase/types";

export type ProgramRow = Database["public"]["Tables"]["program_store"]["Row"];
export type ProgramInsert = Database["public"]["Tables"]["program_store"]["Insert"];
export type ProgramUpdate = Database["public"]["Tables"]["program_store"]["Update"];

export type ProgramFormState = {
  title: string;
  level: string;
  gender: string;
  duration: string;
  sessions: number;
  description: string;
  link: string;
  image: string;
  image_alt: string;
  partner_image: string;
  partner_image_alt: string;
  partner_link: string;
  linked_program_id: string;
  partner_name: string;
  status: string;
  goal: string;
};

export const emptyProgram: ProgramFormState = {
  title: "",
  level: "",
  gender: "",
  duration: "",
  sessions: 0,
  description: "",
  link: "",
  image: "",
  image_alt: "",
  partner_image: "",
  partner_image_alt: "",
  partner_link: "",
  linked_program_id: "",
  partner_name: "",
  status: "ON",
  goal: "",
};

export const mapProgramRowToForm = (row: ProgramRow): ProgramFormState => ({
  title: row.title,
  level: row.level ?? "",
  gender: row.gender ?? "",
  duration: row.duration ?? "",
  sessions: row.sessions ?? 0,
  description: row.description ?? "",
  link: row.link ?? "",
  image: row.image ?? "",
  image_alt: row.image_alt ?? "",
  partner_image: row.partner_image ?? "",
  partner_image_alt: row.partner_image_alt ?? "",
  partner_link: row.partner_link ?? "",
  linked_program_id: row.linked_program_id ?? "",
  partner_name: row.partner_name ?? "",
  status: row.status ?? "ON",
  goal: row.goal ?? "",
});

export const buildProgramPayload = (
  form: ProgramFormState,
): ProgramInsert & ProgramUpdate => ({
  title: form.title,
  level: form.level || null,
  gender: form.gender || null,
  duration: form.duration || null,
  sessions: form.sessions,
  description: form.description || null,
  link: form.link || null,
  image: form.image || null,
  image_alt: form.image_alt || null,
  partner_image: form.partner_image || null,
  partner_image_alt: form.partner_image_alt || null,
  partner_link: form.partner_link || null,
  linked_program_id: form.linked_program_id || null,
  partner_name: form.partner_name || null,
  status: form.status,
  goal: form.goal || null,
});
