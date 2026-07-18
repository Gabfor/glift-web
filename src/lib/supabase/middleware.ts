import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr/dist/module/types";

const shouldPersistSession = (req: NextRequest) => {
  const rememberPreference = req.cookies.get("glift-remember");
  return rememberPreference?.value !== "0";
};

const sanitizeCookieOptions = (
  name: string,
  options: CookieOptions | undefined,
  persist: boolean,
  req: NextRequest,
) => {
  const sanitized: CookieOptions = options ? { ...options } : {};

  // Forcer path à "/" si non défini
  if (!sanitized.path) {
    sanitized.path = "/";
  }

  // Forcer secure à false en HTTP local pour éviter le rejet des cookies
  // sur les sous-domaines (ex: http://admin.localhost:3000)
  if (req.nextUrl.protocol === "http:") {
    delete sanitized.secure;
  }

  // Ne pas briser la persistance du code-verifier PKCE
  const isCodeVerifier = name.includes("code-verifier");

  if (persist || isCodeVerifier) {
    return sanitized;
  }

  // Si maxAge est défini à 0 ou négatif, c'est pour expirer le cookie (déconnexion)
  // Il faut le garder tel quel pour que le cookie soit supprimé du navigateur.
  if (options && options.maxAge !== undefined && options.maxAge <= 0) {
    return sanitized;
  }

  delete sanitized.maxAge;
  delete sanitized.expires;

  return sanitized;
};

export function createRememberingMiddlewareClient(
  context: { req: NextRequest; res: NextResponse; requestHeaders?: Headers }
): SupabaseClient<Database> {
  const persistSession = shouldPersistSession(context.req);

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return context.req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Appliquer la logique de "Rester connecté"
            const sanitizedOptions = sanitizeCookieOptions(name, options, persistSession, context.req);

            // Mettre à jour les cookies sur la requête (pour les middlewares/components en aval)
            context.req.cookies.set(name, value);

            // Mettre à jour les cookies sur la réponse (pour le navigateur)
            context.res.cookies.set(name, value, sanitizedOptions);
          });

          // Synchroniser l'en-tête "Cookie" de la requête pour les Server Components / Layouts en aval (utile pour les rewrites)
          if (context.requestHeaders) {
            const cookieHeaderValue = context.req.cookies.getAll()
              .map(c => `${c.name}=${c.value}`)
              .join('; ');
            context.requestHeaders.set("Cookie", cookieHeaderValue);
          }
        },
      },
    }
  );
}
