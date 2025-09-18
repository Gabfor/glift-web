"use client";

import { useEffect } from "react";

export default function DeconnexionPage() {
  useEffect(() => {
    const purge = () => {
      try { sessionStorage.removeItem("glift-auth-token"); } catch {}
      try { localStorage.removeItem("glift-auth-token"); } catch {}
      try {
        const ks: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))) ks.push(k);
        }
        ks.forEach(k => { try { localStorage.removeItem(k); } catch {} });
      } catch {}
      try {
        const ks: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))) ks.push(k);
        }
        ks.forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
      } catch {}
    };

    let n = 0;
    const loop = () => {
      purge();
      n += 1;
      if (n < 8) requestAnimationFrame(loop);
    };
    loop();

    window.location.assign("/deconnexion");
  }, []);

  return null;
}
