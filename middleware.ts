"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthSessionMissingError } from "@supabase/auth-js";
import { createRememberingMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Crée le client Supabase middleware-compatible
  const supabase = createRememberingMiddlewareClient({ req, res });

  // Charge la session utilisateur côté serveur
  type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
  let user: SupabaseUser = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (error: unknown) {
    if (isAuthSessionMissingError(error)) {
      user = null;
    } else {
      throw error;
    }
  }

  const pathname = req.nextUrl.pathname;

  // ✅ Redirection automatique de /concept -> /
  if (pathname.startsWith("/concept")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/entrainements", req.url));
  }

  // ✅ Protection de la zone /admin uniquement
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/connexion", req.url));
    }

    // Vérifie le champ is_admin dans le user_metadata
    const isAdmin = user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ✅ Protection des routes nécessitant une connexion utilisateur
  if (!user) {
    const protectedRoutes = ["/dashboard", "/entrainements", "/compte"];
    const isProtectedRoute = protectedRoutes.some((route) => {
      return (
        pathname === route ||
        (pathname.startsWith(`${route}/`) && pathname !== "/")
      );
    });

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/connexion", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/entrainements/:path*",
    "/compte/:path*",
    "/concept/:path*",
  ],
};
