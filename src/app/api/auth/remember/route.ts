import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const clientContext = await createRouteHandlerClient();

  try {
    const { remember } = await req.json().catch(() => ({ remember: false as boolean }));

    const access = clientContext.cookies.get("sb-access-token");
    const refresh = clientContext.cookies.get("sb-refresh-token");

    if (!access || !refresh) {
      return clientContext.applyCookies(
        NextResponse.json(
          { error: "No Supabase session cookies present." },
          { status: 400 }
        )
      );
    }

    const resp = NextResponse.json({ success: true });

    const maxAge = remember ? 60 * 60 * 24 * 180 : undefined;
    const base = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    resp.cookies.set({
      name: "sb-access-token",
      value: access.value,
      ...base,
      ...(maxAge ? { maxAge } : {}),
    });
    resp.cookies.set({
      name: "sb-refresh-token",
      value: refresh.value,
      ...base,
      ...(maxAge ? { maxAge } : {}),
    });

    resp.cookies.set({
      name: "sb-remember",
      value: remember ? "1" : "0",
      path: "/",
      ...(maxAge ? { maxAge } : {}),
    });

    return clientContext.applyCookies(resp);
  } catch {
    return clientContext.applyCookies(NextResponse.json({ error: "Bad request" }, { status: 400 }));
  }
}
