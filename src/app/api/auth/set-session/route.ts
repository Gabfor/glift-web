import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const { client, applyCookies } = await createRouteHandlerClient();
  const { error } = await client.auth.setSession({ access_token, refresh_token });
  if (error) {
    return applyCookies(NextResponse.json({ error: error.message }, { status: 401 }));
  }

  return applyCookies(NextResponse.json({ ok: true }));
}
