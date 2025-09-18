import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/compte#mes-informations";
  const origin = url.origin;

  const response = new NextResponse();

  const jar = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => jar.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin), {
    headers: response.headers,
  });
}

export async function POST(req: Request) {
  const { session, remember = "1", next } = await req.json().catch(() => ({}));

  if (!session?.access_token || !session?.refresh_token) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const response = new NextResponse();
  const rememberOn = remember === "1";

  const jar = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => jar.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          const opts: any = { ...options };
          if (!rememberOn) {
            delete opts.maxAge;
            delete opts.expires;
          }
          response.cookies.set({ name, value, ...opts });
        },
        remove: (name: string, options: any) => {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  response.cookies.set({
    name: "sb-remember",
    value: rememberOn ? "1" : "0",
    path: "/",
    ...(rememberOn ? { maxAge: 60 * 60 * 24 * 365 } : {}),
  });

  if (next && typeof next === "string") {
    return NextResponse.redirect(new URL(next, new URL(req.url).origin), {
      headers: response.headers,
    });
  }

  return new NextResponse(null, { status: 204, headers: response.headers });
}
