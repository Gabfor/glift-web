import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  MutableRequestCookiesAdapter,
  appendMutableCookies,
  getModifiedCookieValues,
} from "next/dist/server/web/spec-extension/adapters/request-cookies";
import {
  ResponseCookies,
  stringifyCookie,
} from "next/dist/server/web/spec-extension/cookies";
import { requestAsyncStorage } from "next/dist/server/async-storage/request-async-storage.external";
import { synchronizeMutableCookies } from "next/dist/server/async-storage/request-store";

type SupabaseServerClientResult<Database> = {
  supabase: SupabaseClient<Database>;
  applyServerCookies: {
    (): void;
    (response: NextResponse): NextResponse;
  };
  getSetCookieStrings: () => string[];
};

function normalizeOptions(options?: CookieOptions): CookieOptions {
  if (!options) return {};
  const { name: _name, ...rest } = options;
  return rest;
}

async function resolveCookiesStore(): Promise<ReturnType<typeof nextCookies>> {
  const storeMaybe = (nextCookies as unknown as () => unknown)();
  if (typeof (storeMaybe as Promise<unknown>)?.then === "function") {
    return (storeMaybe as Promise<ReturnType<typeof nextCookies>>);
  }
  return storeMaybe as ReturnType<typeof nextCookies>;
}

export async function createServerSupabaseClient<Database = unknown>(): Promise<
  SupabaseServerClientResult<Database>
> {
  const cookieStore = await resolveCookiesStore();
  const requestStore = requestAsyncStorage.getStore?.();

  const mutableCookies = (requestStore?.mutableCookies ??
    MutableRequestCookiesAdapter.wrap(cookieStore as any)) as ResponseCookies;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return mutableCookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        async setAll(cookies) {
          for (const cookie of cookies) {
            const normalized = normalizeOptions(cookie.options);
            mutableCookies.set({ name: cookie.name, value: cookie.value, ...normalized });
          }
        },
      },
    }
  );

  function applyServerCookies(): void;
  function applyServerCookies(response: NextResponse): NextResponse;
  function applyServerCookies(response?: NextResponse) {
    if (!mutableCookies) {
      return response;
    }

    if (response) {
      appendMutableCookies(response.headers, mutableCookies);
      return response;
    }

    if (requestStore) {
      synchronizeMutableCookies(requestStore);
    }

    return undefined;
  }

  function getSetCookieStrings() {
    const modified = getModifiedCookieValues(mutableCookies);
    if (!modified.length) return [];
    return modified.map((cookie) => stringifyCookie(cookie));
  }

  return {
    supabase,
    applyServerCookies,
    getSetCookieStrings,
  };
}
