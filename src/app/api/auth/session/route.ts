import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { client, applyCookies } = await createRouteHandlerClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session) {
    return applyCookies(NextResponse.json({ session: null }, { status: 200 }));
  }

  return applyCookies(
    NextResponse.json(
      {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
        },
      },
      { status: 200 }
    )
  );
}
