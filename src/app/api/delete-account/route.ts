import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    { status: 200 }
  );
}

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !service) {
    return NextResponse.json(
      {
        error: "server-misconfigured",
        hasUrl: !!url,
        hasAnon: !!anon,
        hasService: !!service,
      },
      { status: 500 }
    );
  }

  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    if (userErr) console.error("[delete-account] getUser error:", userErr);
    return applyServerCookies(NextResponse.json({ error: "not-authenticated" }, { status: 401 }));
  }

  const admin = createAdminClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const safeDelete = async (table: string, col: string, val: string) => {
    const { error } = await admin.from(table).delete().eq(col, val);
    if (error) {
      console.warn(`[delete-account] delete ${table} where ${col}=${val} ->`, error);
    }
  };

  try {
    const userId = user.id;

    const avatarPath = user?.user_metadata?.avatar_path as string | undefined;
    if (avatarPath) {
      const { error: storageErr } = await admin.storage.from("avatars").remove([avatarPath]);
      if (storageErr) {
        console.warn("[delete-account] storage remove error:", storageErr);
      }
    }

    await safeDelete("training_rows", "user_id", userId);
    await safeDelete("trainings", "user_id", userId);
    await safeDelete("programs", "user_id", userId);
    await safeDelete("user_subscriptions", "user_id", userId);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("[delete-account] deleteUser error:", delErr);
      return applyServerCookies(
        NextResponse.json(
          { error: "delete-failed", details: (delErr as any)?.message ?? delErr },
          { status: 500 }
        )
      );
    }

    try {
      await supabase.auth.signOut();
    } catch (signOutErr) {
      console.warn("[delete-account] signOut warning:", signOutErr);
    }

    return applyServerCookies(NextResponse.json({ ok: true }, { status: 200 }));
  } catch (e: any) {
    console.error("[delete-account] unexpected error:", e);
    return applyServerCookies(
      NextResponse.json(
        { error: "delete-failed", details: e?.message ?? String(e) },
        { status: 500 }
      )
    );
  }
}
