import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email/verifyEmail";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  try {
    const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) {
      return applyServerCookies(
        NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 })
      );
    }

    const admin = createAdminClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

    const token = randomUUID().replace(/-/g, "");
    const grace = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const { error: upErr } = await admin
      .from("email_verification_tokens")
      .upsert({ user_id: user.id, token, expires_at: grace }, { onConflict: "user_id" });
    if (upErr) {
      return applyServerCookies(
        NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })
      );
    }

    await admin.from("profiles").update({ grace_expires_at: grace }).eq("id", user.id);

    await sendVerificationEmail({ email: user.email, token });

    return applyServerCookies(NextResponse.json({ ok: true, sent: true }));
  } catch (e: any) {
    return applyServerCookies(
      NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
    );
  }
}
