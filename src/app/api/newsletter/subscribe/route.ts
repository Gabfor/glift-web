import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Veuillez renseigner une adresse email valide." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = await createAdminClient();

    const { error } = await (supabase as any)
      .from("newsletter_subscribers")
      .insert([{ email: cleanEmail }]);

    if (error) {
      // Code 23505 = contrainte d'unicité violée (déjà inscrit)
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "Tu es déjà inscrit(e) à notre newsletter !",
        });
      }

      console.error("Error inserting newsletter subscriber:", error);
      return NextResponse.json(
        { success: false, error: "Une erreur est survenue lors de l'inscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Merci pour ton inscription !",
    });
  } catch (err: any) {
    console.error("Newsletter API route error:", err);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
