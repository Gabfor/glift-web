import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureAdmin } from "../users/utils";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ServiceRoleClient = SupabaseClient<Database>;

export async function GET() {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const adminClient = createAdminClient() as ServiceRoleClient;
    const aggregated: User[] = [];
    let page = 1;

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 100,
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

    // Get all admin profiles from database
    const { data: adminProfiles, error: dbError } = await adminClient
      .from("profiles")
      .select("id, name, statut, langue")
      .eq("is_admin", true);

    if (dbError) {
      throw dbError;
    }

    const adminIdSet = new Set(adminProfiles?.map((p) => p.id) ?? []);
    const adminProfileMap = new Map(
      adminProfiles?.map((p) => [
        p.id,
        { name: p.name, statut: p.statut, langue: p.langue },
      ]) ?? []
    );

    const admins = aggregated
      .filter((user) => adminIdSet.has(user.id))
      .map((user) => {
        const profile = adminProfileMap.get(user.id);
        return {
          id: user.id,
          email: user.email ?? "",
          name: profile?.name ?? user.user_metadata?.name ?? "Administrateur",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
          statut: profile?.statut !== false, // default true
          langue: profile?.langue ?? "Français",
        };
      });

    return NextResponse.json({ admins });
  } catch (error: any) {
    console.error("[admin/admins] GET error", error);
    return NextResponse.json(
      { error: error.message || "internal-error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.name) {
      return NextResponse.json({ error: "missing-fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const randomPassword = crypto.randomUUID();

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: randomPassword,
      user_metadata: {
        is_admin: true,
        name: body.name,
      },
      email_confirm: true,
    });

    if (createError) {
      console.error("[admin/admins] POST createUser error", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Insert into profiles (bypass RLS)
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: createData.user.id,
        name: body.name,
        email_verified: true,
        is_admin: true,
        statut: body.statut !== false, // default true
        langue: body.langue ?? "Français",
      });

    if (profileError) {
      console.error("[admin/admins] POST profile creation warning", profileError);
    }

    return NextResponse.json({ success: true, user: createData.user });
  } catch (error: any) {
    console.error("[admin/admins] POST error", error);
    return NextResponse.json(
      { error: error.message || "internal-error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ error: "missing-id" }, { status: 400 });
    }

    if (body.id === adminCheck.user.id) {
      return NextResponse.json({ error: "cannot-delete-self" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", body.id);

    if (profileError) {
      console.error("[admin/admins] DELETE profile error", profileError);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(body.id);
    if (deleteError) {
      console.error("[admin/admins] DELETE auth error", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/admins] DELETE error", error);
    return NextResponse.json(
      { error: error.message || "internal-error" },
      { status: 500 }
    );
  }
}
