import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof NextResponse) return guard;

  const { cookies } = await createRouteHandlerClient();
  const cookieKeys = cookies.getAll().map((c) => c.name);

  const {
    data: { user },
    error,
  } = await guard.supabase.auth.getUser();

  return NextResponse.json({
    cookieNames: cookieKeys,
    hasSupabaseAuthCookie: cookieKeys.some((k) => k.includes("sb-") && k.includes("-auth-token")),
    isAuth: !!user,
    userId: user?.id ?? null,
    error: error?.message ?? null,
  });
}
