import { NextRequest, NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

type DeletePayload = {
  ids?: string[];
};

const TABLES_TO_CLEAN: Array<"user_subscriptions" | "training_rows" | "trainings" | "programs"> = [
  "user_subscriptions",
  "training_rows",
  "trainings",
  "programs",
];

const ensureAdmin = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error("user-fetch-failed");
  }

  if (!user) {
    return { status: 401 as const, error: "not-authenticated" };
  }

  if (!user.user_metadata?.is_admin) {
    return { status: 403 as const, error: "forbidden" };
  }

  return { status: 200 as const, user };
};

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin();

    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const body = (await request.json().catch(() => null)) as DeletePayload | null;

    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "missing-ids" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    for (const userId of body.ids) {
      for (const table of TABLES_TO_CLEAN) {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq("user_id", userId);

        if (error && error.code !== "PGRST116") {
          console.error(`[admin/users] failed to clean ${table}`, error);
          throw new Error(`cleanup-${table}`);
        }
      }

      const { error: profileError } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[admin/users] failed to delete profile", profileError);
        throw new Error("delete-profile");
      }

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteUserError) {
        console.error("[admin/users] failed to delete auth user", deleteUserError);
        throw new Error("delete-user");
      }
    }

    return NextResponse.json({ success: true, deleted: body.ids });
  } catch (error: unknown) {
    console.error("[admin/users] unexpected error", error);
    const message = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: message ?? "internal-error" },
      { status: 500 },
    );
  }
}
