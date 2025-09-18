import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof NextResponse) return guard;

  const jar = await cookies();
  const cookieKeys = jar.getAll().map((c) => c.name);

  const { supabase } = guard;
  const { data: { user }, error } = await supabase.auth.getUser();

  return NextResponse.json({
    cookieNames: cookieKeys,
    hasSupabaseAuthCookie: cookieKeys.some((k) => k.includes("sb-") && k.includes("-auth-token")),
    isAuth: !!user,
    userId: user?.id ?? null,
    error: error?.message ?? null,
  });
}
