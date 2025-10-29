"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AuthApiError, isAuthSessionMissingError } from "@supabase/auth-js";
import { createRememberingMiddlewareClient } from "@/lib/supabase/middleware";
import {
  getSupabaseCookieName,
  type SupabaseSessionScope,
} from "@/lib/supabase/sessionScope";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const expireSessionCookies = (scope: SupabaseSessionScope) => {
    const cookieName = getSupabaseCookieName(scope);
    const expireOptions = { path: "/", maxAge: 0 } as const;

    const cookiesToClear = new Set<string>([cookieName]);
    req.cookies
      .getAll()
      .filter(({ name }) =>
        name === cookieName || name.startsWith(`${cookieName}.`),
      )
      .forEach(({ name }) => cookiesToClear.add(name));

    cookiesToClear.forEach((name) => {
      res.cookies.set(name, "", expireOptions);
    });
  };

  const loadUser = async (scope: SupabaseSessionScope) => {
    const supabase = createRememberingMiddlewareClient({ req, res }, { scope });
    type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
    let user: SupabaseUser = null;

    try {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      user = fetchedUser;
    } catch (error: unknown) {
      const isRefreshTokenNotFoundError =
        error instanceof AuthApiError && error.code === "refresh_token_not_found";

      if (isRefreshTokenNotFoundError) {
        expireSessionCookies(scope);
      }

      if (isAuthSessionMissingError(error) || isRefreshTokenNotFoundError) {
        user = null;
      } else {
        throw error;
      }
    }

    return user;
  };

  const frontUser = await loadUser("front");

  const pathname = req.nextUrl.pathname;

  // ✅ Redirection automatique de /concept -> /
  if (pathname.startsWith("/concept")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (frontUser && pathname === "/") {
    return NextResponse.redirect(new URL("/entrainements", req.url));
  }

  // ✅ Protection de la zone /admin uniquement
  if (pathname.startsWith("/admin")) {
    const adminUser = await loadUser("admin");

    if (!adminUser) {
      return NextResponse.redirect(new URL("/connexion", req.url));
    }

    // Vérifie le champ is_admin dans le user_metadata
    const isAdmin = adminUser.user_metadata?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ✅ Protection des routes nécessitant une connexion utilisateur
  if (!frontUser && !pathname.startsWith("/admin")) {
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
