"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY = "glift-auth-token";

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, key };
};

const hasRememberCookie = () => {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("sb-remember=1"));
};

let __logoutBarrier = false;

const DynamicStorage = {
  getItem(key: string) {
    try {
      if (typeof window === "undefined") return null;
      if (hasRememberCookie()) return window.localStorage.getItem(key);
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      if (typeof window === "undefined") return;
      if (__logoutBarrier) return;
      if (hasRememberCookie()) {
        window.localStorage.setItem(key, value);
        return;
      }
      window.sessionStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string) {
    try {
      if (typeof window === "undefined") return;
      try { window.localStorage.removeItem(key); } catch {}
      try { window.sessionStorage.removeItem(key); } catch {}
    } catch {}
  },
};

const NoopStorage = {
  getItem(_: string) { return null; },
  setItem(_: string, __: string) {},
  removeItem(_: string) {},
};

declare global {
  var __supabase__: SupabaseClient | undefined;
}

export function beginLogoutBarrier() { __logoutBarrier = true; }
export function endLogoutBarrier() { __logoutBarrier = false; }
export function resetSupabaseClient() { globalThis.__supabase__ = undefined; }

export function clearSupabaseStorage() {
  try {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
    try {
      const ks: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))) ks.push(k);
      }
      ks.forEach((k) => { try { window.localStorage.removeItem(k); } catch {} });
    } catch {}
    try {
      const ks: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))) ks.push(k);
      }
      ks.forEach((k) => { try { window.sessionStorage.removeItem(k); } catch {} });
    } catch {}
  } catch {}
}

export function createClient(): SupabaseClient {
  if (globalThis.__supabase__) return globalThis.__supabase__ as SupabaseClient;
  const { url, key } = getEnv();
  const client = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: __logoutBarrier ? (NoopStorage as any) : (DynamicStorage as any),
      storageKey: STORAGE_KEY,
    },
  });
  globalThis.__supabase__ = client;
  return client;
}
