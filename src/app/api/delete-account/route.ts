import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

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
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasUrl || !hasAnon || !hasService) {
    return NextResponse.json(
      {
        error: "server-misconfigured",
        hasUrl,
        hasAnon,
        hasService,
      },
      { status: 500 }
    );
  }

  const context = await createRouteHandlerClient();

  const {
    data: { user },
    error: userErr,
  } = await context.client.auth.getUser();

  if (userErr || !user) {
    if (userErr) console.error("[delete-account] getUser error:", userErr);
    return context.applyCookies(NextResponse.json({ error: "not-authenticated" }, { status: 401 }));
  }

  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (_error) {
    return context.applyCookies(
      NextResponse.json({ error: "server-misconfigured", hasUrl, hasAnon, hasService }, { status: 500 })
    );
  }

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
      return context.applyCookies(
        NextResponse.json(
          { error: "delete-failed", details: (delErr as any)?.message ?? delErr },
          { status: 500 }
        )
      );
    }

    try {
      await context.client.auth.signOut();
    } catch (signOutErr) {
      console.warn("[delete-account] signOut warning:", signOutErr);
    }

    return context.applyCookies(NextResponse.json({ ok: true }, { status: 200 }));
  } catch (e: any) {
    console.error("[delete-account] unexpected error:", e);
    return context.applyCookies(
      NextResponse.json({ error: "delete-failed", details: e?.message ?? String(e) }, { status: 500 })
    );
  }
}
