import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function sendVerificationEmail(to: string, link: string) {
  console.log(`[DEV] Email de vérification → ${to} : ${link}`);
}

export async function POST(_req: NextRequest) {
  const { client, applyCookies } = await createRouteHandlerClient();

  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();

  if (userErr || !user) {
    return applyCookies(NextResponse.json({ error: "Non authentifié." }, { status: 401 }));
  }

  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (_error) {
    return applyCookies(NextResponse.json({ error: "Supabase env manquantes." }, { status: 500 }));
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);

  await admin.from("email_verification_tokens").delete().eq("user_id", user.id);

  const { error: insErr } = await admin.from("email_verification_tokens").insert({
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (insErr) {
    return applyCookies(NextResponse.json({ error: "Impossible de générer le token." }, { status: 500 }));
  }

  const base = siteUrl().replace(/\/+$/, "");
  const link = `${base}/api/verify-email?token=${token}`;

  await sendVerificationEmail(user.email!, link);

  return applyCookies(NextResponse.json({ ok: true }));
}
