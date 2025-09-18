import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo } as any);
    if (error) throw error;
  } catch {
    return NextResponse.json({ error: "send-failed" }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
