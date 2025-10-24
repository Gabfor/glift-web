import CreateProgramPageClient from "./CreateProgramPageClient";
import { createServerClient } from "@/lib/supabaseServer";
import {
  ProgramFormState,
  ProgramRow,
  mapProgramRowToForm,
} from "./programForm";

export default async function CreateProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  let programId: number | null = null;
  let initialProgram: ProgramFormState | null = null;

  if (idParam) {
    const numericId = Number(idParam);

    if (!Number.isNaN(numericId)) {
      programId = numericId;

      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("program_store")
        .select("*")
        .eq("id", numericId)
        .maybeSingle<ProgramRow>();

      if (!error && data) {
        initialProgram = mapProgramRowToForm(data);
      }
    }
  }

  return (
    <CreateProgramPageClient
      initialProgram={initialProgram}
      programId={programId}
    />
  );
}
