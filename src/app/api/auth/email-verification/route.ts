import { NextResponse } from "next/server";
import { addDays } from "date-fns";

import { createAdminClient, createClient } from "@/lib/supabase/server";

interface ProfileRow {
  email_verified?: boolean | null;
  email_verification_deadline?: string | null;
}

const parseDeadline = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Lecture de l'utilisateur courant impossible", userError);
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié." },
        { status: 401 },
      );
    }

    const userId = user.id;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("email_verified, email_verification_deadline")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Lecture du profil impossible", profileError);
    }

    const profile = profileData as ProfileRow | null;

    const isVerified = Boolean(profile?.email_verified) || Boolean(user.email_confirmed_at);

    if (isVerified) {
      return NextResponse.json({ deleted: false, verified: true });
    }

    const rawMetadataDeadline = (
      user.user_metadata as Record<string, unknown> | undefined
    )?.email_verification_deadline;
    const metadataDeadline = parseDeadline(
      typeof rawMetadataDeadline === "string" ? rawMetadataDeadline : null,
    );
    const profileDeadline = parseDeadline(profile?.email_verification_deadline);
    const createdAt = user.created_at ? new Date(user.created_at) : null;
    const fallbackDeadline = createdAt ? addDays(createdAt, 7) : null;

    const deadline = metadataDeadline ?? profileDeadline ?? fallbackDeadline;

    if (!deadline || deadline.getTime() > Date.now()) {
      return NextResponse.json({
        deleted: false,
        verified: false,
        deadline: deadline?.toISOString() ?? null,
      });
    }

    let adminClient: ReturnType<typeof createAdminClient>;
    try {
      adminClient = createAdminClient();
    } catch (creationError) {
      console.error(
        "Création du client admin Supabase impossible pour supprimer le compte",
        creationError,
      );
      return NextResponse.json(
        { error: "Suppression du compte impossible." },
        { status: 500 },
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Suppression du compte non vérifié impossible", deleteError);
      return NextResponse.json(
        { error: "Suppression du compte impossible." },
        { status: 500 },
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression du compte non vérifié", error);
    return NextResponse.json(
      { error: "Suppression du compte impossible." },
      { status: 500 },
    );
  }
}
