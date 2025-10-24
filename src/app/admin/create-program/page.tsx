import CreateProgramPageClient from "./CreateProgramPageClient";
import { createServerClient } from "@/lib/supabaseServer";
import {
  ProgramFormState,
  ProgramRow,
  mapProgramRowToForm,
} from "./programForm";

export const dynamic = "force-dynamic";

export default async function CreateProgramPage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const idParam = searchParams?.id;
  let programId: string | null = null;
  let initialProgram: ProgramFormState | null = null;

  if (idParam) {
    programId = idParam;

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("program_store")
      .select("*")
      .eq("id", idParam)
      .maybeSingle<ProgramRow>();

    if (!error && data) {
      initialProgram = mapProgramRowToForm(data);
    }
  }

  return (
    <CreateProgramPageClient
      initialProgram={initialProgram}
      programId={programId}
    />
  );
}
