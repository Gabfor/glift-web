"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";

type AvatarContextType = {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
};

const AvatarContext = createContext<AvatarContextType>({
  avatarUrl: null,
  setAvatarUrl: () => {},
});

const BUCKET = "avatars";

function withCacheBust(rawUrl: string, seed?: string | number) {
  try {
    const u = new URL(rawUrl, typeof window !== "undefined" ? window.location.origin : undefined);
    u.searchParams.set("cb", String(seed ?? Date.now()));
    return u.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}cb=${seed ?? Date.now()}`;
  }
}

async function getLatestAvatarUrl(supabase: any, userId: string): Promise<string | null> {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (error || !files || files.length === 0) return null;
  const numeric = files
    .map((f: any) => ({ f, n: Number((f.name.split(".")[0] || "").replace(/\D+/g, "")) }))
    .filter((x: any) => Number.isFinite(x.n))
    .sort((a: any, b: any) => b.n - a.n);
  const chosen = numeric.length ? numeric[0].f : files[0];
  const objectPath = `${userId}/${chosen.name}`;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const base = pub.publicUrl || null;
  if (!base) return null;
  const ver = chosen.name.replace(/\D+/g, "") || Date.now();
  return withCacheBust(base, ver);
}

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const { user, isAuthenticated } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isAuthenticated || !user?.id) {
        if (active) setAvatarUrl(null);
        return;
      }
      const url = await getLatestAvatarUrl(supabase, user.id);
      if (active) setAvatarUrl(url);
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, supabase]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      const uid = session?.user?.id ?? null;
      if (!uid) {
        setAvatarUrl(null);
        return;
      }
      const url = await getLatestAvatarUrl(supabase, uid);
      setAvatarUrl(url);
    });
    return () => {
      try {
        data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, [supabase]);

  useEffect(() => {
    const handler = (e: any) => {
      const raw = e?.detail?.url ?? null;
      if (raw === null) {
        setAvatarUrl(null);
        return;
      }
      setAvatarUrl(withCacheBust(String(raw)));
    };
    window.addEventListener("glift:avatar-updated", handler);
    return () => window.removeEventListener("glift:avatar-updated", handler);
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
      {children}
    </AvatarContext.Provider>
  );
}

export const useAvatar = () => useContext(AvatarContext);
