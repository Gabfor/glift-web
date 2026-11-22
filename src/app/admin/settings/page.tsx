import SettingsClient from "./SettingsClient";
import { createServerClient } from "@/lib/supabaseServer";
import { SettingsService } from "@/lib/services/settingsService";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createServerClient();
  const settingsService = new SettingsService(supabase as any);
  const initialSettings = await settingsService.getSettings();

  return <SettingsClient initialSettings={initialSettings} />;
}
