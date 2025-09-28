"use server";

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Crée le client Supabase middleware-compatible
  const supabase = createMiddlewareClient({ req, res });

  // Charge la session utilisateur côté serveur
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ Protection de la zone /admin uniquement
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/connexion", req.url));
    }

    // Vérifie le champ is_admin dans le user_metadata
    const isAdmin = user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}
