import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { ensureAdmin } from "./utils";

type DeletePayload = {
  ids?: string[];
};

type UpdatePayload = {
  id?: string;
  verified?: boolean;
};

type AdminUserRow = {
  id: string;
  email: string;
  created_at: string;
  name: string | null;
  subscription_plan: string | null;
  premium_trial_started_at: string | null;
  gender: string | null;
  birth_date: string | null;
  email_verified: boolean | null;
};

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ServiceRoleClient = SupabaseClient<Database>;

const USERS_PAGE_SIZE = 200;

const listAllAuthUsers = async (client: ServiceRoleClient): Promise<User[]> => {
  const aggregated: User[] = [];
  let page = 1;

  // Supabase paginates auth users. Loop until there's no next page.
  // Use a failsafe on page increments to avoid potential infinite loops
  // if the API ever returns an unexpected value.
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    aggregated.push(...(data?.users ?? []));

    const nextPage = data?.nextPage;

    if (!nextPage || nextPage === page) {
      break;
    }

    page = nextPage;
  }

  return aggregated;
};

const TABLES_TO_CLEAN: Array<"user_subscriptions" | "training_rows" | "trainings" | "programs"> = [
  "user_subscriptions",
  "training_rows",
  "trainings",
  "programs",
];

export async function GET() {
  try {
    const adminCheck = await ensureAdmin();

    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const adminClient = createAdminClient() as ServiceRoleClient;

    const authUsers = await listAllAuthUsers(adminClient).catch((error) => {
      console.error("[admin/users] failed to list auth users", error);
      return null;
    });

    if (!authUsers) {
      return NextResponse.json(
        { error: "list-auth-users" },
        { status: 500 },
      );
    }

    const ids = authUsers.map((user) => user.id).filter(Boolean);

    let profiles: ProfileRow[] = [];

    if (ids.length > 0) {
      const { data: profileRows, error: profilesError } = await adminClient
        .from("profiles")
        .select("*")
        .in("id", ids);

      if (profilesError) {
        console.error("[admin/users] failed to list profiles", profilesError);
        return NextResponse.json(
          { error: "list-profiles" },
          { status: 500 },
        );
      }

      profiles = (profileRows ?? []) as ProfileRow[];
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const users: AdminUserRow[] = authUsers.map((user) => {
      const profile = profileMap.get(user.id);

      return {
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at ?? new Date().toISOString(),
        name: profile?.name ?? null,
        subscription_plan: profile?.subscription_plan ?? null,
        premium_trial_started_at: profile?.premium_trial_started_at ?? null,
        gender: profile?.gender ?? null,
        birth_date: profile?.birth_date ?? null,
        email_verified:
          typeof profile?.email_verified === "boolean"
            ? profile.email_verified
            : Boolean(user.email_confirmed_at),
      } satisfies AdminUserRow;
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("[admin/users] unexpected error", error);
    const message = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: message ?? "internal-error" },
      { status: 500 },
    );
  }
}

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

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin();

    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const body = (await request.json().catch(() => null)) as UpdatePayload | null;

    if (!body || typeof body.id !== "string" || body.id.trim() === "") {
      return NextResponse.json(
        { error: "missing-id" },
        { status: 400 },
      );
    }

    const verified = body.verified ?? true;

    if (typeof verified !== "boolean") {
      return NextResponse.json(
        { error: "invalid-verified" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.rpc(
      "admin_set_user_email_verification",
      {
        target_user: body.id,
        verified,
      },
    );

    if (error) {
      if (error.code === "PGRST202") {
        console.warn(
          "[admin/users] admin_set_user_email_verification missing, falling back to admin API",
          error,
        );

        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
          body.id,
          { email_confirm: verified },
        );

        if (authUpdateError) {
          console.error(
            "[admin/users] failed to update auth email verification status",
            authUpdateError,
          );
          return NextResponse.json(
            { error: "update-status" },
            { status: 500 },
          );
        }

        const { error: profileUpdateError } = await adminClient
          .from("profiles")
          .update({
            email_verified: verified,
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.id);

        if (profileUpdateError) {
          console.error(
            "[admin/users] failed to update profile verification status",
            profileUpdateError,
          );
          return NextResponse.json(
            { error: "update-status" },
            { status: 500 },
          );
        }
      } else {
        console.error("[admin/users] failed to update verification status", error);
        return NextResponse.json(
          { error: "update-status" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[admin/users] unexpected error", error);
    const message = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: message ?? "internal-error" },
      { status: 500 },
    );
  }
}
