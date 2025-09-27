import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const response = new NextResponse();
  const storeMaybe: any = (cookies as any)();
  const jar = typeof storeMaybe?.then === "function" ? await storeMaybe : storeMaybe;

  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { session: null },
      { status: 200, headers: response.headers }
    );
  }

  return NextResponse.json(
    {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      },
    },
    { status: 200, headers: response.headers }
  );
}
