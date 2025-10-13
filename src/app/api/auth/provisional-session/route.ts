import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/server";
import { createProvisionalSession } from "@/lib/auth/provisionalSession";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Champs manquants." },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const result = await createProvisionalSession(adminClient, {
      email,
      password,
    });

    if ("sessionTokens" in result) {
      return NextResponse.json({
        success: true,
        session: result.sessionTokens,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error,
        code: result.code,
      },
      { status: result.status },
    );
  } catch (error) {
    console.error("/api/auth/provisional-session POST error", error);
    return NextResponse.json(
      {
        error:
          "Une erreur interne est survenue lors de la création de la session.",
      },
      { status: 500 },
    );
  }
}
