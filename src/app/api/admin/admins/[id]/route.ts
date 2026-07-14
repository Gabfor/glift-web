import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureAdmin } from "../../users/utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.status !== 200) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.name) {
      return NextResponse.json({ error: "missing-fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updatePayload: any = {
      email: body.email,
      user_metadata: {
        is_admin: true,
        name: body.name,
      },
    };

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      id,
      updatePayload
    );

    if (authError) {
      console.error("[admin/admins] PATCH auth error", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        name: body.name,
        statut: body.statut !== false,
        langue: body.langue ?? "Français",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (profileError) {
      console.error("[admin/admins] PATCH profile error", profileError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/admins] PATCH error", error);
    return NextResponse.json(
      { error: error.message || "internal-error" },
      { status: 500 }
    );
  }
}
