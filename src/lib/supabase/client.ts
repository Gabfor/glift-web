"use client";

import { createBrowserClient, type CookieMethodsBrowser } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/auth-js";
import type { CookieOptions } from "@supabase/ssr/dist/module/types";
import { parse, serialize } from "cookie";

import type { Database } from "./types";

const readCookie = (name: string) => {
  if (typeof document === "undefined") {
    return undefined;
  }

  const parsed = parse(document.cookie ?? "");

  return parsed?.[name];
};

const sanitizeCookieOptions = (
  options: CookieOptions | undefined,
  shouldPersist: boolean,
  isRemoval: boolean,
) => {
  if (!options || shouldPersist || isRemoval) {
    return options;
  }

  const sanitized = { ...options };
  delete sanitized.maxAge;
  delete sanitized.expires;

  return sanitized;
};

const createCookieBridge = (): CookieMethodsBrowser => ({
  getAll: async () => {
    if (typeof document === "undefined") {
      return [];
    }

    const parsed = parse(document.cookie ?? "");

    return Object.entries(parsed).map(([name, value]) => ({
      name,
      value: value ?? "",
    }));
  },
  setAll: async (cookies) => {
    if (typeof document === "undefined") {
      return;
    }

    const rememberPreference = readCookie("glift-remember");
    const shouldPersist = rememberPreference !== "0";

    cookies.forEach(({ name, value, options }) => {
      const sanitizedOptions = sanitizeCookieOptions(
        options,
        shouldPersist,
        value === "",
      );

      document.cookie = serialize(name, value, sanitizedOptions);
    });
  },
});

export const createClientComponentClient = () => {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createCookieBridge(),
    },
  );

  const originalGetUser = client.auth.getUser.bind(client.auth);

  client.auth.getUser = (async (
    ...args: Parameters<typeof originalGetUser>
  ) => {
    try {
      return await originalGetUser(...args);
    } catch (error) {
      if (isAuthSessionMissingError(error)) {
        return {
          data: { user: null },
          error,
        } as Awaited<ReturnType<typeof originalGetUser>>;
      }

      throw error;
    }
  }) as typeof originalGetUser;

  return client;
};
