import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminGuardOk = {
  user: any;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>["supabase"];
};

export async function requireAdmin(_req: NextRequest): Promise<AdminGuardOk | NextResponse> {
  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin =
    (user as any)?.app_metadata?.is_admin === true ||
    (user as any)?.user_metadata?.is_admin === true;

  if (!user)
    return applyServerCookies(NextResponse.json({ error: "unauthenticated" }, { status: 401 }));
  if (!isAdmin)
    return applyServerCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));

  applyServerCookies();
  return { user, supabase };
}
