import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";

export type AdminGuardOk = {
  user: any;
  supabase: Awaited<ReturnType<typeof createSSRClient>>;
};

export async function requireAdmin(_req: NextRequest): Promise<AdminGuardOk | NextResponse> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin =
    (user as any)?.app_metadata?.is_admin === true ||
    (user as any)?.user_metadata?.is_admin === true;

  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return { user, supabase };
}
