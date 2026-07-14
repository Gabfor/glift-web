"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AuthApiError, isAuthSessionMissingError } from "@supabase/auth-js";
import { createRememberingMiddlewareClient } from "@/lib/supabase/middleware";

// Helper pour copier proprement les cookies entre deux réponses Next.js
const copyCookies = (from: NextResponse, to: NextResponse) => {
  const cookies = from.cookies.getAll();
  console.log(`[MIDDLEWARE] copyCookies - copying ${cookies.length} cookies:`, cookies.map(c => c.name));
  cookies.forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      httpOnly: cookie.httpOnly,
    });
  });
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get("host") || "";

  // Injecter x-pathname dans les en-têtes de la requête pour les Server Components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Crée le client Supabase middleware-compatible
  const supabase = createRememberingMiddlewareClient({ req, res, requestHeaders });

  // Charge la session utilisateur côté serveur
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
      const expireOptions = { path: "/", maxAge: 0 } as const;
      res.cookies.set("sb-access-token", "", expireOptions);
      res.cookies.set("sb-refresh-token", "", expireOptions);
    }

    if (isAuthSessionMissingError(error) || isRefreshTokenNotFoundError) {
      user = null;
    } else {
      throw error;
    }
  }

  // A request is for the admin subdomain if:
  // - the host starts with "admin."
  const isAdminSubdomain = host.startsWith("admin.");

  console.log(`[MIDDLEWARE] Entry - pathname: ${pathname} host: ${host} isAdminSubdomain: ${isAdminSubdomain} user exists: ${!!user} is_admin: ${user?.user_metadata?.is_admin}`);

  // Helper to build redirect URLs between subdomains
  const getSubdomainUrl = (subdomain: "admin" | "app", pathAndSearch: string) => {
    let cleanHost = host;
    if (host.startsWith("admin.")) {
      cleanHost = host.slice(6);
    } else if (host.startsWith("app.")) {
      cleanHost = host.slice(4);
    }

    let targetHost = cleanHost;
    if (subdomain === "admin") {
      targetHost = `admin.${cleanHost}`;
    } else {
      targetHost = `app.${cleanHost}`;
    }

    return `${req.nextUrl.protocol}//${targetHost}${pathAndSearch}`;
  };

  // ==========================================
  // CAS A : Requête sur le sous-domaine ADMIN
  // ==========================================
  if (isAdminSubdomain) {
    // Si l'URL contient déjà le préfixe /admin, on le supprime (redirection propre)
    // Par exemple: /admin/connexion -> /connexion
    if (pathname.startsWith("/admin")) {
      const cleanPath = pathname.slice(6) || "/";
      const redirectRes = NextResponse.redirect(new URL(`${cleanPath}${req.nextUrl.search}`, req.url));
      copyCookies(res, redirectRes);
      return redirectRes;
    }

    const ADMIN_ROUTES = [
      "/connexion",
      "/deconnexion",
      "/reinitialiser-mot-de-passe",
      "/auteurs",
      "/content-blog",
      "/create-auteur",
      "/create-blog-article",
      "/create-help",
      "/create-legal-page",
      "/create-offer",
      "/create-page",
      "/create-program",
      "/entrainements",
      "/help",
      "/legal",
      "/offer-shop",
      "/pages",
      "/program",
      "/program-store",
      "/settings",
      "/slider",
      "/users",
    ];

    const isAdminRoute = pathname === "/" || ADMIN_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));

    // Si ce n'est pas une route admin, rediriger vers l'application principale (app.localhost:3000 ou app.glift.io)
    if (!isAdminRoute) {
      const target = getSubdomainUrl("app", `${pathname}${req.nextUrl.search}`);
      const redirectRes = new NextResponse(null, {
        status: 307,
        headers: {
          Location: target,
        },
      });
      copyCookies(res, redirectRes);
      return redirectRes;
    }

    // Gestion de l'authentification pour les routes admin
    const isConnexionPage = pathname === "/connexion";
    const isResetPage = pathname === "/reinitialiser-mot-de-passe";

    if (isConnexionPage) {
      // Si déjà connecté et admin, rediriger vers la racine de l'admin
      if (user && user.user_metadata?.is_admin === true) {
        const redirectRes = NextResponse.redirect(new URL("/", req.url));
        copyCookies(res, redirectRes);
        return redirectRes;
      }
    } else if (!isResetPage) {
      // Protection globale de l'admin : si pas connecté, rediriger vers /connexion
      if (!user) {
        const redirectRes = NextResponse.redirect(new URL("/connexion", req.url));
        copyCookies(res, redirectRes);
        return redirectRes;
      }

      const isAdmin = user.user_metadata?.is_admin === true;
      if (!isAdmin) {
        // Si connecté mais pas admin, rediriger vers le dashboard de l'app utilisateur
        const target = getSubdomainUrl("app", "/dashboard");
        const redirectRes = new NextResponse(null, {
          status: 307,
          headers: {
            Location: target,
          },
        });
        copyCookies(res, redirectRes);
        return redirectRes;
      }
    }

    // Réécriture interne pour Next.js (sans changer l'URL visible)
    // /connexion -> /admin/connexion
    // /users -> /admin/users
    // / -> /admin
    // Exception pour /deconnexion qui n'a pas de dossier admin spécifique et utilise la page globale src/app/deconnexion/page.tsx
    const isGlobalRoute = pathname === "/deconnexion";
    const internalPath = isGlobalRoute ? pathname : `/admin${pathname === "/" ? "" : pathname}`;
    requestHeaders.set("x-pathname", internalPath);

    const rewriteRes = NextResponse.rewrite(new URL(`${internalPath}${req.nextUrl.search}`, req.url), {
      request: {
        headers: requestHeaders,
      },
    });

    copyCookies(res, rewriteRes);
    return rewriteRes;
  }
  // ==========================================
  // CAS B : Requête sur le domaine utilisateur standard (ou localhost sans sous-domaine)
  // ==========================================
  else {
    // Rediriger toute tentative d'accès à l'administration vers le sous-domaine admin en enlevant le préfixe /admin
    if (pathname.startsWith("/admin")) {
      const cleanPath = pathname.slice(6) || "/";
      const target = getSubdomainUrl("admin", `${cleanPath}${req.nextUrl.search}`);
      const redirectRes = new NextResponse(null, {
        status: 307,
        headers: {
          Location: target,
        },
      });
      copyCookies(res, redirectRes);
      return redirectRes;
    }

    // ✅ Redirection automatique de /concept -> /
    if (pathname.startsWith("/concept")) {
      const redirectRes = NextResponse.redirect(new URL("/", req.url));
      copyCookies(res, redirectRes);
      return redirectRes;
    }

    if (user && pathname === "/") {
      const redirectRes = NextResponse.redirect(new URL("/entrainements", req.url));
      copyCookies(res, redirectRes);
      return redirectRes;
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
        const redirectRes = NextResponse.redirect(new URL("/connexion", req.url));
        copyCookies(res, redirectRes);
        return redirectRes;
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Applique le middleware sur toutes les routes de pages, à l'exception :
     * - des routes d'API (/api)
     * - des fichiers statiques de Next.js (_next/static, _next/image)
     * - des dossiers d'assets (/favicons, /icons, /images, /flags)
     * - des fichiers statiques à la racine (favicon.ico, logo_admin.svg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicons|icons|images|flags|favicon.ico|logo_admin.svg|logo_beta.svg|manifest.webmanifest).*)",
  ],
};
