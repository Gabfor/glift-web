import {
  CookieAuthStorageAdapter,
  type CookieOptions,
  type CookieOptionsWithName,
  createSupabaseClient,
  type DefaultCookieOptions,
  parseCookies,
  serializeCookie,
  type SupabaseClientOptionsWithoutAuth,
} from "@supabase/auth-helpers-shared";
import authHelpersPackage from "@supabase/auth-helpers-nextjs/package.json";
import { NextResponse } from "next/server";
import { splitCookiesString } from "set-cookie-parser";

import type { NextRequest } from "next/server";
import type { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const PACKAGE_NAME = authHelpersPackage.name;
const PACKAGE_VERSION = authHelpersPackage.version;

const shouldPersistSession = (req: NextRequest) => {
  const rememberPreference = req.cookies.get("glift-remember");
  return rememberPreference?.value !== "0";
};

const sanitizeCookieOptions = (
  options: DefaultCookieOptions | undefined,
  persist: boolean,
) => {
  if (!options || persist) {
    return options;
  }

  if (options.maxAge === 0) {
    return options;
  }

  const sanitized = { ...options };
  delete sanitized.maxAge;
  delete sanitized.expires;

  return sanitized;
};

class RememberMiddlewareAuthStorageAdapter extends CookieAuthStorageAdapter {
  constructor(
    private readonly context: { req: NextRequest; res: NextResponse },
    private readonly persistSession: boolean,
    cookieOptions?: CookieOptions,
  ) {
    super(cookieOptions);
  }

  protected getCookie(name: string): string | null | undefined {
    const setCookie = splitCookiesString(
      this.context.res.headers.get("set-cookie")?.toString() ?? "",
    )
      .map((cookie) => parseCookies(cookie)[name])
      .find((cookie) => !!cookie);

    if (setCookie) {
      return setCookie;
    }

    const cookies = parseCookies(
      this.context.req.headers.get("cookie") ?? "",
    );

    return cookies[name];
  }

  protected setCookie(name: string, value: string): void {
    this.setCookieWithOptions(name, value);
  }

  protected deleteCookie(name: string): void {
    this.setCookieWithOptions(name, "", {
      maxAge: 0,
    });
  }

  private setCookieWithOptions(
    name: string,
    value: string,
    options?: DefaultCookieOptions,
  ) {
    const combinedOptions: DefaultCookieOptions | undefined = {
      ...this.cookieOptions,
      ...options,
      httpOnly: false,
    };

    const sanitizedOptions = sanitizeCookieOptions(
      combinedOptions,
      this.persistSession,
    );

    const newSession = serializeCookie(name, value, sanitizedOptions);

    if (this.context.res.headers) {
      this.context.res.headers.append("set-cookie", newSession);
    }
  }
}

export function createRememberingMiddlewareClient<
  Database extends Record<string, GenericSchema> = Record<
    string,
    GenericSchema
  >,
  SchemaName extends string & keyof Database = "public" extends keyof Database
    ? "public"
    : Extract<keyof Database, string>,
  Schema extends GenericSchema = Database[SchemaName],
>(
  context: { req: NextRequest; res: NextResponse },
  {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options,
    cookieOptions,
  }: {
    supabaseUrl?: string;
    supabaseKey?: string;
    options?: SupabaseClientOptionsWithoutAuth<SchemaName>;
    cookieOptions?: CookieOptionsWithName;
  } = {},
): SupabaseClient<Database, SchemaName, Schema> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!",
    );
  }

  const persistSession = shouldPersistSession(context.req);

  return createSupabaseClient<Database, SchemaName, Schema>(
    supabaseUrl,
    supabaseKey,
    {
      ...options,
      global: {
        ...options?.global,
        headers: {
          ...options?.global?.headers,
          "X-Client-Info": `${PACKAGE_NAME}@${PACKAGE_VERSION}`,
        },
      },
      auth: {
        storage: new RememberMiddlewareAuthStorageAdapter(
          context,
          persistSession,
          cookieOptions,
        ),
      },
    },
  );
}
