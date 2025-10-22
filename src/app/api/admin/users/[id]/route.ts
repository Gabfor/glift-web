import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

import { ensureAdmin } from "../utils";

type ProfilesTable = Database["public"]["Tables"]["profiles"];
type ProfileRow = ProfilesTable["Row"];
type ProfileUpdate = ProfilesTable["Update"];

type ServiceRoleClient = SupabaseClient<Database>;

const toString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const pickString = (
  profileValue: unknown,
  metadata: Record<string, unknown>,
  key: string,
) => {
  if (typeof profileValue === "string") {
    return profileValue;
  }

  const fallback = metadata[key];
  return typeof fallback === "string" ? fallback : "";
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id?: string }> },
) {
  try {
    const adminCheck = await ensureAdmin();

    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const { id: userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "missing-id" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient() as ServiceRoleClient;

    const {
      data: authData,
      error: authError,
    } = await adminClient.auth.admin.getUserById(userId);

    if (authError) {
      console.error("[admin/users/:id] failed to get auth user", authError);
      return NextResponse.json(
        { error: "user-not-found" },
        { status: 404 },
      );
    }

    const authUser = authData?.user;

    if (!authUser) {
      return NextResponse.json(
        { error: "user-not-found" },
        { status: 404 },
      );
    }

    const { data: profileRow, error: profileError } = await adminClient
      .from("profiles")
      .select(
        "id, name, birth_date, gender, country, experience, main_goal, training_place, weekly_sessions, supplements",
      )
      .eq("id", userId)
      .maybeSingle<ProfileRow>();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[admin/users/:id] failed to read profile", profileError);
      return NextResponse.json(
        { error: "profile-not-found" },
        { status: 500 },
      );
    }

    const metadata =
      authUser.user_metadata &&
      typeof authUser.user_metadata === "object" &&
      !Array.isArray(authUser.user_metadata)
        ? (authUser.user_metadata as Record<string, unknown>)
        : {};

    const profile = profileRow ?? null;

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email ?? "",
        name: pickString(profile?.name, metadata, "name"),
        gender: pickString(profile?.gender, metadata, "gender"),
        birth_date: pickString(profile?.birth_date, metadata, "birth_date"),
        country: pickString(profile?.country, metadata, "country"),
        experience: pickString(profile?.experience, metadata, "experience"),
        main_goal: pickString(profile?.main_goal, metadata, "main_goal"),
        training_place: pickString(
          profile?.training_place,
          metadata,
          "training_place",
        ),
        weekly_sessions: pickString(
          profile?.weekly_sessions,
          metadata,
          "weekly_sessions",
        ),
        supplements: pickString(profile?.supplements, metadata, "supplements"),
        metadata,
      },
    });
  } catch (error) {
    console.error("[admin/users/:id] unexpected error", error);
    const message = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: message ?? "internal-error" },
      { status: 500 },
    );
  }
}

type UpdatePayload = {
  name?: string;
  email?: string;
  gender?: string;
  birthDate?: string | null;
  country?: string;
  experience?: string;
  mainGoal?: string;
  trainingPlace?: string;
  weeklySessions?: string;
  supplements?: string;
};

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> },
) {
  try {
    const adminCheck = await ensureAdmin();

    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const { id: userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "missing-id" },
        { status: 400 },
      );
    }

    const payload = (await request.json().catch(() => null)) as
      | UpdatePayload
      | null;

    if (!payload) {
      return NextResponse.json(
        { error: "invalid-payload" },
        { status: 400 },
      );
    }

    const trimmedName = toString(payload.name).trim();
    const trimmedEmail = toString(payload.email).trim();

    if (!trimmedName) {
      return NextResponse.json(
        { error: "missing-name" },
        { status: 400 },
      );
    }

    if (!trimmedEmail) {
      return NextResponse.json(
        { error: "missing-email" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient() as ServiceRoleClient;

    const profilePatch: ProfileUpdate & { id: string } = {
      id: userId,
      name: trimmedName,
      birth_date:
        typeof payload.birthDate === "string" && payload.birthDate
          ? payload.birthDate
          : null,
      gender: toString(payload.gender),
      country: toString(payload.country),
      experience: toString(payload.experience),
      main_goal: toString(payload.mainGoal),
      training_place: toString(payload.trainingPlace),
      weekly_sessions: toString(payload.weeklySessions),
      supplements: toString(payload.supplements),
    };

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(profilePatch, { onConflict: "id" });

    if (profileError) {
      console.error("[admin/users/:id] failed to upsert profile", profileError);
      return NextResponse.json(
        { error: "profile-update-failed" },
        { status: 500 },
      );
    }

    const { error: updateUserError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        email: trimmedEmail,
        user_metadata: { name: trimmedName },
      },
    );

    if (updateUserError) {
      console.error("[admin/users/:id] failed to update auth user", updateUserError);
      return NextResponse.json(
        { error: "auth-update-failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/users/:id] unexpected error", error);
    const message = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: message ?? "internal-error" },
      { status: 500 },
    );
  }
}
