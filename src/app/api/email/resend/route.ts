import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email/verifyEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const context = await createRouteHandlerClient();

  try {
    const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const {
      data: { user },
      error,
    } = await context.client.auth.getUser();
    if (error || !user?.email) {
      return context.applyCookies(NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 }));
    }

    const admin = createAdminClient(URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = randomUUID().replace(/-/g, "");
    const grace = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const { error: upErr } = await admin
      .from("email_verification_tokens")
      .upsert({ user_id: user.id, token, expires_at: grace }, { onConflict: "user_id" });
    if (upErr) {
      return context.applyCookies(NextResponse.json({ ok: false, error: upErr.message }, { status: 500 }));
    }

    await admin.from("profiles").update({ grace_expires_at: grace }).eq("id", user.id);

    await sendVerificationEmail({ email: user.email, token });

    return context.applyCookies(NextResponse.json({ ok: true, sent: true }));
  } catch (e: any) {
    return context.applyCookies(
      NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
    );
  }
}
