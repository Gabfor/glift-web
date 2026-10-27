"use client";

import { useEffect, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import GliftLoader from "@/components/ui/GliftLoader";

export default function LogoutPage() {
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const supabase = createClientComponentClient();
    const isAdmin =
      typeof window !== "undefined" &&
      window.location.hostname.startsWith("admin.");
    const targetUrl = isAdmin ? "/connexion" : "/";

    // Filet de sécurité absolu : après 1,5s maximum, on force la redirection quoi qu'il arrive
    const fallbackTimer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.replace(targetUrl);
      }
    }, 1500);

    const performLogout = async () => {
      try {
        // 1. Suppression immédiate de tous les cookies de session et d'auth
        if (typeof document !== "undefined") {
          const deleteCookie = (name: string) => {
            const hostname = window.location.hostname;
            const domains = ["", hostname, `.${hostname}`];
            domains.forEach((dom) => {
              const domAttr = dom ? `; domain=${dom}` : "";
              document.cookie = `${name}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${domAttr}`;
            });
          };

          document.cookie.split(";").forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            if (name.startsWith("sb-") || name === "glift-remember") {
              deleteCookie(name);
            }
          });
        }

        // 2. Nettoyage du localStorage et sessionStorage
        try {
          if (typeof window !== "undefined") {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("sb-") || key.includes("supabase.auth.token")) {
                localStorage.removeItem(key);
              }
            });
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith("sb-") || key.includes("supabase.auth.token")) {
                sessionStorage.removeItem(key);
              }
            });
          }
        } catch {
          // Ignorer les restrictions de stockage local en navigation privée
        }

        // 3. Déconnexion Supabase Auth avec timeout strict de 1 seconde
        try {
          await Promise.race([
            supabase.auth.signOut(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("signOut timeout")), 1000)
            ),
          ]);
        } catch {
          // En cas d'erreur réseau ou de timeout sur l'appel global, forcer la déconnexion locale
          try {
            await supabase.auth.signOut({ scope: "local" });
          } catch {
            // Ignorer l'erreur
          }
        }
      } catch (err) {
        console.error("Erreur lors de la déconnexion:", err);
      } finally {
        clearTimeout(fallbackTimer);
        // 4. Redirection native avec rechargement propre pour purger l'état React et le cache
        window.location.replace(targetUrl);
      }
    };

    void performLogout();

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  return <GliftLoader className="opacity-100" />;
}
