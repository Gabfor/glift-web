import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const { email, password, name } = body;

  // 🔒 Vérifie les champs requis
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  // 📝 Inscription Supabase
  const { error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (signupError) {
    return NextResponse.json({ error: signupError.message }, { status: 400 });
  }

  // 🔑 Connexion automatique juste après
  const { error: signinError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signinError) {
    return NextResponse.json({ error: signinError.message }, { status: 400 });
  }

  // ✅ Succès : le frontend peut rediriger vers /entrainements
  return NextResponse.json({ success: true });
}
