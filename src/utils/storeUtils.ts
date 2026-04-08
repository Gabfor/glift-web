import { Database } from "@/lib/supabase/types";
import { StoreProgram } from "@/types/store";

type ProgramRow = Database["public"]["Tables"]["program_store"]["Row"];
export type ProgramQueryRow = Pick<
  ProgramRow,
  | "id"
  | "title"
  | "level"
  | "goal"
  | "gender"
  | "sessions"
  | "duration"
  | "description"
  | "image"
  | "image_alt"
  | "partner_image"
  | "partner_image_alt"
  | "partner_link"
  | "link"
  | "downloads"
  | "created_at"
  | "partner_name"
  | "plan"
  | "location"
>;

export const mapProgramRowToCard = (row: ProgramQueryRow): StoreProgram => ({
  id: row.id,
  title: row.title,
  level: row.level ?? "",
  sessions: row.sessions !== null && row.sessions !== undefined ? String(row.sessions) : "",
  duration: row.duration ?? "",
  description: row.description ?? "",
  image: row.image ?? "",
  image_alt: row.image_alt ?? "",
  partner_image: row.partner_image ?? "",
  partner_image_alt: row.partner_image_alt ?? "",
  partner_link: row.partner_link ?? "",
  link: row.link ?? "",
  downloads: row.downloads ?? 0,
  created_at: row.created_at ?? "",
  goal: row.goal ?? "",
  gender: row.gender ?? "",
  partner_name: row.partner_name ?? "",
  plan: (row.plan as "starter" | "premium") ?? "starter",
  location: row.location ?? "",
});
