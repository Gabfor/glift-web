import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export type RingtoneItem = {
  id: string;
  name: string;
  filename: string;
  url: string;
  duration_ms: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  icon_url?: string;
  image_alt?: string;
};

const DEFAULT_RINGTONES: RingtoneItem[] = [
  {
    id: "5",
    name: "Arpège Succès",
    filename: "chime_asc.mp3",
    url: "/sounds/chime_asc.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "6",
    name: "Bip Sport",
    filename: "bip_sport.mp3",
    url: "/sounds/bip_sport.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "10",
    name: "Bol de Cristal",
    filename: "crystal_bowl.mp3",
    url: "/sounds/crystal_bowl.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "11",
    name: "Buzzer Clean",
    filename: "buzzer_clean.mp3",
    url: "/sounds/buzzer_clean.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "7",
    name: "Cloche Zen",
    filename: "cloche_zen.mp3",
    url: "/sounds/cloche_zen.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "13",
    name: "Clochettes de Noël",
    filename: "clochettes_noel.mp3",
    url: "/sounds/clochettes_noel.mp3",
    duration_ms: 2500,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T17:45:00Z",
  },
  {
    id: "9",
    name: "Compte à Rebours",
    filename: "countdown_ding.mp3",
    url: "/sounds/countdown_ding.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "14",
    name: "Frisson d'Halloween",
    filename: "frisson_halloween.mp3",
    url: "/sounds/frisson_halloween.mp3",
    duration_ms: 2400,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T18:00:00Z",
  },
  {
    id: "3",
    name: "Gong",
    filename: "gong.mp3",
    url: "/sounds/gong.mp3",
    duration_ms: 2520,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T10:00:00Z",
  },
  {
    id: "8",
    name: "Gong Énergique",
    filename: "gong_court.mp3",
    url: "/sounds/gong_court.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "12",
    name: "Marimba Vital",
    filename: "marimba_pop.mp3",
    url: "/sounds/marimba_pop.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "2",
    name: "Radar",
    filename: "radar.mp3",
    url: "/sounds/radar.mp3",
    duration_ms: 1567,
    is_active: true,
    is_default: true,
    created_at: "2026-11-07T10:00:00Z",
  },
];

function sortRingtonesByName(list: RingtoneItem[]): RingtoneItem[] {
  return [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" })
  );
}

async function getRingtonesFromDb(adminClient: any): Promise<RingtoneItem[]> {
  // 1. Try public.ringtones table
  try {
    const { data, error } = await adminClient
      .from("ringtones")
      .select("*")
      .order("name", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return sortRingtonesByName(data as RingtoneItem[]);
    }
  } catch {
    // ringtones table does not exist
  }

  // 2. Try settings table with key 'timer_ringtones'
  try {
    const { data: settingRow, error: settingErr } = await adminClient
      .from("settings")
      .select("value")
      .eq("key", "timer_ringtones")
      .maybeSingle();

    if (!settingErr && settingRow?.value) {
      const parsed = JSON.parse(settingRow.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge any new default ringtones not yet in settings
        const existingFilenames = new Set(parsed.map((r: any) => r.filename));
        let hasNew = false;
        for (const def of DEFAULT_RINGTONES) {
          if (!existingFilenames.has(def.filename)) {
            parsed.push(def);
            hasNew = true;
          }
        }
        const sorted = sortRingtonesByName(parsed as RingtoneItem[]);
        if (hasNew) {
          await saveRingtonesToDb(adminClient, sorted);
        }
        return sorted;
      }
    }
  } catch {
    // settings fallback error
  }

  // 3. If nothing found, persist DEFAULT_RINGTONES into settings so future calls find it
  try {
    await adminClient.from("settings").upsert({
      key: "timer_ringtones",
      value: JSON.stringify(DEFAULT_RINGTONES),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }

  return DEFAULT_RINGTONES;
}

async function saveRingtonesToDb(adminClient: any, ringtones: RingtoneItem[]) {
  const sorted = sortRingtonesByName(ringtones);
  // Always update settings table for mobile and web synchronization
  try {
    await adminClient.from("settings").upsert({
      key: "timer_ringtones",
      value: JSON.stringify(sorted),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error saving ringtones to settings table:", e);
  }

  // Also try updating ringtones table if it exists
  try {
    // Delete existing and insert, or update
    for (const r of sorted) {
      await adminClient.from("ringtones").upsert({
        id: r.id.length > 10 ? r.id : undefined, // only use uuid if valid
        name: r.name,
        filename: r.filename,
        url: r.url,
        duration_ms: r.duration_ms,
        is_active: r.is_active,
        is_default: r.is_default,
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // table might not exist
  }
}

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const ringtones = await getRingtonesFromDb(adminClient);
    return NextResponse.json({ ringtones });
  } catch (e: any) {
    console.error("GET /api/admin/ringtones error:", e);
    return NextResponse.json({ ringtones: DEFAULT_RINGTONES, error: e?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await req.json();

    if (body.ringtones && Array.isArray(body.ringtones)) {
      await saveRingtonesToDb(adminClient, body.ringtones);
      return NextResponse.json({ success: true, ringtones: body.ringtones });
    }

    // Incremental operations
    const currentList = await getRingtonesFromDb(adminClient);
    let updatedList = [...currentList];

    if (body.action === "toggle_status") {
      const { id, is_active } = body;
      updatedList = updatedList.map((r) =>
        r.id === id ? { ...r, is_active } : r
      );
    } else if (body.action === "toggle_default") {
      const { id, is_default } = body;
      updatedList = updatedList.map((r) => {
        if (r.id === id) {
          return { ...r, is_default };
        }
        if (is_default) {
          return { ...r, is_default: false };
        }
        return r;
      });
    } else if (body.action === "delete") {
      const ids: string[] = body.ids || [];
      updatedList = updatedList.filter((r) => !ids.includes(r.id));
    } else if (body.action === "save") {
      const ringtone: RingtoneItem = body.ringtone;
      const index = updatedList.findIndex((r) => r.id === ringtone.id);
      if (index >= 0) {
        updatedList[index] = ringtone;
      } else {
        updatedList.push(ringtone);
      }
      if (ringtone.is_default) {
        updatedList = updatedList.map((r) =>
          r.id === ringtone.id ? r : { ...r, is_default: false }
        );
      }
    }

    await saveRingtonesToDb(adminClient, updatedList);
    return NextResponse.json({ success: true, ringtones: updatedList });
  } catch (e: any) {
    console.error("POST /api/admin/ringtones error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

