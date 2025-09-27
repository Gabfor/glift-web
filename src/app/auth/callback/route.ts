import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/compte#mes-informations";
  const origin = url.origin;

  const context = await createRouteHandlerClient();

  if (code) {
    await context.client.auth.exchangeCodeForSession(code);
  }

  const redirectResponse = NextResponse.redirect(new URL(next, origin));
  return context.applyCookies(redirectResponse);
}

export async function POST(req: Request) {
  const { session, remember = "1", next } = await req.json().catch(() => ({}));

  if (!session?.access_token || !session?.refresh_token) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const rememberOn = remember === "1";
  const context = await createRouteHandlerClient();

  await context.client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const response =
    next && typeof next === "string"
      ? NextResponse.redirect(new URL(next, new URL(req.url).origin))
      : new NextResponse(null, { status: 204 });

  context.applyCookies(response);

  if (!rememberOn) {
    const base = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };
    response.cookies.set({ name: "sb-access-token", value: session.access_token, ...base });
    response.cookies.set({ name: "sb-refresh-token", value: session.refresh_token, ...base });
  }

  response.cookies.set({
    name: "sb-remember",
    value: rememberOn ? "1" : "0",
    path: "/",
    ...(rememberOn ? { maxAge: 60 * 60 * 24 * 365 } : {}),
  });

  return response;
}
