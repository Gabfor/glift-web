import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email/verifyEmail";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = new NextResponse();

  try {
    const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const storeMaybe: any = (cookies as any)();
    const cookieStore = typeof storeMaybe?.then === "function" ? await storeMaybe : storeMaybe;

    const supabase = createServerClient(URL, ANON, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401, headers: response.headers });
    }

    const admin = getServiceRoleClient();

    const token = randomUUID().replace(/-/g, "");
    const grace = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const { error: upErr } = await admin
      .from("email_verification_tokens")
      .upsert({ user_id: user.id, token, expires_at: grace }, { onConflict: "user_id" });
    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500, headers: response.headers });
    }

    await admin.from("profiles").update({ grace_expires_at: grace }).eq("id", user.id);

    await sendVerificationEmail({ email: user.email, token });

    return NextResponse.json({ ok: true, sent: true }, { headers: response.headers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
