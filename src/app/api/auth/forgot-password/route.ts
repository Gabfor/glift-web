import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "missing-email" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  const redirectTo = `${origin.replace(/\/$/, "")}/reinitialiser-mot-de-passe`;

  const { client, applyCookies } = await createRouteHandlerClient();

  try {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo } as any);
    if (error) throw error;
    return applyCookies(NextResponse.json({ ok: true }, { status: 200 }));
  } catch {
    return applyCookies(NextResponse.json({ error: "send-failed" }, { status: 200 }));
  }
}
