import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type AdminGuardOk = {
  user: any;
  supabase: ReturnType<typeof createServerClient>;
};

export async function requireAdmin(req: NextRequest): Promise<AdminGuardOk | NextResponse> {
  const jar = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => jar.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin =
    (user as any)?.app_metadata?.is_admin === true ||
    (user as any)?.user_metadata?.is_admin === true;

  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return { user, supabase };
}
