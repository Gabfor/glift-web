import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email/verifyEmail";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email et mot de passe requis." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !service) {
      return NextResponse.json({ success: false, error: "Supabase env manquantes." }, { status: 500 });
    }

    const admin = getServiceRoleClient();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name ?? "", email_verified: false },
    });
    if (createErr) {
      const msg = String(createErr.message || "");
      const conflict = createErr.status === 409 || /exist|already|registered|duplicate/i.test(msg);
      return NextResponse.json(
        { success: false, error: conflict ? "Email déjà enregistré." : msg },
        { status: conflict ? 409 : 400 }
      );
    }
    const userId = created!.user!.id;

    const grace = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    await admin.from("profiles").upsert(
      { id: userId, name: name ?? "", email_verified: false, grace_expires_at: grace },
      { onConflict: "id" }
    );

    const token = randomUUID().replace(/-/g, "");
    const { error: tokenErr } = await admin
      .from("email_verifications")
      .upsert({ user_id: userId, token, expires_at: grace }, { onConflict: "user_id" });
    if (tokenErr) {
      return NextResponse.json(
        { success: false, error: "Impossible de générer le token de vérification." },
        { status: 400 }
      );
    }

    await sendVerificationEmail({ email, token });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}
