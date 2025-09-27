import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import type { NextResponse } from "next/server";

type NextCookies = Awaited<ReturnType<typeof nextCookies>>;

type Awaitable<T> = T | Promise<T>;

type RouteHandlerClient = {
  client: ReturnType<typeof createServerClient>;
  applyCookies: (response: NextResponse) => NextResponse;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function isPromiseLike<T>(value: Awaitable<T>): value is Promise<T> {
  return typeof (value as Promise<T>)?.then === "function";
}

async function resolveCookies(): Promise<NextCookies> {
  const storeMaybe = nextCookies() as Awaitable<NextCookies>;
  return isPromiseLike(storeMaybe) ? await storeMaybe : storeMaybe;
}

type CookieMutation =
  | { type: "set"; name: string; value: string; options?: CookieOptions }
  | { type: "remove"; name: string; options?: CookieOptions };

type CookieCache = Map<string, { value: string | null; options?: CookieOptions }>;

function withDefaultPath(options?: CookieOptions): CookieOptions {
  return { path: "/", ...options };
}

function propagateToResponse(response: NextResponse, mutation: CookieMutation) {
  if (mutation.type === "set") {
    const options = withDefaultPath(mutation.options);
    response.cookies.set({
      name: mutation.name,
      value: mutation.value,
      ...options,
    });
    return;
  }

  const options = withDefaultPath(mutation.options);
  response.cookies.set({
    name: mutation.name,
    value: "",
    maxAge: 0,
    ...options,
  });
}

function createSupabaseClient(cookieStore: NextCookies, response?: NextResponse) {
  const cache: CookieCache = new Map();
  const mutations: CookieMutation[] = [];

  const getFromCache = (name: string) => {
    if (cache.has(name)) {
      const cached = cache.get(name)!;
      return cached.value ?? undefined;
    }

    return cookieStore.get(name)?.value;
  };

  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return getFromCache(name);
      },
      set(name: string, value: string, options?: CookieOptions) {
        const normalized = withDefaultPath(options);
        cache.set(name, { value, options: normalized });
        mutations.push({ type: "set", name, value, options: normalized });
        if (response) {
          propagateToResponse(response, { type: "set", name, value, options: normalized });
        }
      },
      remove(name: string, options?: CookieOptions) {
        const normalized = withDefaultPath(options);
        cache.set(name, { value: null, options: normalized });
        mutations.push({ type: "remove", name, options: normalized });
        if (response) {
          propagateToResponse(response, { type: "remove", name, options: normalized });
        }
      },
    },
  });

  const applyCookies = (target: NextResponse) => {
    for (const mutation of mutations) {
      propagateToResponse(target, mutation);
    }
    return target;
  };

  return { client, applyCookies } satisfies RouteHandlerClient;
}

export async function createSSRClient(response?: NextResponse) {
  const cookieStore = await resolveCookies();
  return createSupabaseClient(cookieStore, response).client;
}

export async function createRouteHandlerClient(response?: NextResponse) {
  const cookieStore = await resolveCookies();
  const { client, applyCookies } = createSupabaseClient(cookieStore, response);

  return {
    client,
    applyCookies,
    cookies: cookieStore,
    withResponse(target: NextResponse) {
      return applyCookies(target);
    },
  };
}

export async function createClient() {
  return createSSRClient();
}
