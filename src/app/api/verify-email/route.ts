import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }

  const admin = getServiceRoleClient();

  const { data: row, error } = await admin
    .from("email_verification_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  }

  if (new Date(row.expires_at) < new Date()) {
    await admin.from("email_verification_tokens").delete().eq("token", token);
    return NextResponse.json({ error: "Token expiré." }, { status: 400 });
  }

  const { error: updErr } = await admin
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", row.user_id);

  if (updErr) {
    return NextResponse.json({ error: "Mise à jour du profil impossible." }, { status: 500 });
  }

  await admin.auth.admin.updateUserById(row.user_id, {
    user_metadata: { email_verified: true },
  });

  await admin.from("email_verification_tokens").delete().eq("token", token);

  return NextResponse.redirect(new URL("/?verified=1", req.url));
}
