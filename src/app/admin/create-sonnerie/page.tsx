import CreateSonnerieClient from "./CreateSonnerieClient";
import { createAdminClient } from "@/lib/supabase/server";
import { RingtoneItem } from "@/app/api/admin/ringtones/route";

export const dynamic = "force-dynamic";

export default async function CreateSonneriePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const ringtoneId =
    typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  let initialRingtone: RingtoneItem | null = null;
  if (ringtoneId) {
    const adminClient = createAdminClient() as any;
    try {
      const { data, error } = await adminClient
        .from("ringtones")
        .select("*")
        .eq("id", ringtoneId)
        .maybeSingle();
      if (!error && data) {
        initialRingtone = data as RingtoneItem;
      }
    } catch {
      // ringtones table might not exist
    }

    if (!initialRingtone) {
      try {
        const { data: settingRow, error: settingErr } = await adminClient
          .from("settings")
          .select("value")
          .eq("key", "timer_ringtones")
          .maybeSingle();
        if (!settingErr && settingRow?.value) {
          const parsed = JSON.parse(settingRow.value);
          if (Array.isArray(parsed)) {
            initialRingtone = parsed.find((r: RingtoneItem) => r.id === ringtoneId) ?? null;
          }
        }
      } catch {
        // ignore fallback error
      }
    }
  }

  return (
    <CreateSonnerieClient
      ringtoneId={ringtoneId}
      initialRingtone={initialRingtone}
    />
  );
}

