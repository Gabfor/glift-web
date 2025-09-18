// @ts-nocheck
// deno-lint-ignore-file
// Edge Function (Deno) — purge des comptes non vérifiés après J+7

import { createClient } from "npm:@supabase/supabase-js@2";

async function handler(_req: Request): Promise<Response> {
  try {
    const SUPABASE_URL =
      (typeof Deno !== "undefined" && Deno.env.get("SUPABASE_URL")) ||
      (typeof Deno !== "undefined" && Deno.env.get("NEXT_PUBLIC_SUPABASE_URL"));
    const SERVICE_ROLE_KEY =
      typeof Deno !== "undefined" && Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "Missing env: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nowIso = new Date().toISOString();

    // 1) Profils non vérifiés dont la période de grâce est dépassée
    const { data: rows, error: selErr } = await admin
      .from("profiles")
      .select("id")
      .eq("email_verified", false)
      .lt("grace_expires_at", nowIso);

    if (selErr) {
      return new Response(
        JSON.stringify({ ok: false, error: selErr.message }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    // 2) Suppression de l'utilisateur Auth (le profil est supprimé en cascade via FK)
    let deleted = 0;
    for (const r of rows ?? []) {
      const { error: delErr } = await admin.auth.admin.deleteUser(r.id as string);
      if (!delErr) deleted++;
    }

    return new Response(JSON.stringify({ ok: true, deleted }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

// Exécution uniquement en environnement Deno (Supabase Edge Functions)
if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(handler);
}

// En environnement Node/Next, ce fichier n'est pas exécuté.
// Il peut rester dans le repo sans casser le typage grâce à `@ts-nocheck`.
