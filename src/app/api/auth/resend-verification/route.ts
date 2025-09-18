import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function sendVerificationEmail(to: string, link: string) {
  console.log(`[DEV] Email de vérification → ${to} : ${link}`);
}

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);

  await admin.from("email_verification_tokens").delete().eq("user_id", user.id);

  const { error: insErr } = await admin.from("email_verification_tokens").insert({
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (insErr) {
    return NextResponse.json({ error: "Impossible de générer le token." }, { status: 500 });
  }

  const base = siteUrl().replace(/\/+$/, "");
  const link = `${base}/api/verify-email?token=${token}`;

  await sendVerificationEmail(user.email!, link);

  return NextResponse.json({ ok: true });
}
