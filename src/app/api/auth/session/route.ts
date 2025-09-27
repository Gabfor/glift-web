import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return applyServerCookies(NextResponse.json({ session: null }, { status: 200 }));
  }

  return applyServerCookies(
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
