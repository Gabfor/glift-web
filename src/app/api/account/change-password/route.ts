import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json().catch(() => ({} as any));
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "same-password" }, { status: 400 });
    }

    const context = await createRouteHandlerClient();
    const supabase = context.client;

    let authedBy: "cookies" | "bearer" | null = null;
    let jwtFromHeader: string | null = null;

    const { data: cookieUserData, error: cookieUserErr } = await supabase.auth.getUser();
    let user = cookieUserData?.user ?? null;

    if (!user) {
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        jwtFromHeader = authHeader.slice(7);
        const { data: bearerUserData } = await supabase.auth.getUser(jwtFromHeader);
        user = bearerUserData?.user ?? null;
        if (user) authedBy = "bearer";
      }
    } else {
      authedBy = "cookies";
    }

    if (!user) {
      const detail = cookieUserErr?.message || "no-session";
      return context.applyCookies(
        NextResponse.json({ error: "not-authenticated", details: detail }, { status: 401 })
      );
    }

    const email = user.email;
    if (!email) {
      return context.applyCookies(NextResponse.json({ error: "no-email" }, { status: 400 }));
    }

    {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const verifyRes = await fetch(url, {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: currentPassword }),
      });

      if (!verifyRes.ok) {
        if (verifyRes.status === 400) {
          return context.applyCookies(NextResponse.json({ error: "invalid-current-password" }, { status: 400 }));
        }
        const body = await verifyRes.json().catch(() => ({}));
        return context.applyCookies(
          NextResponse.json(
            { error: "verify-failed", details: body?.error_description || body?.msg || "" },
            { status: 400 }
          )
        );
      }
    }

    if (authedBy === "cookies") {
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) {
        return context.applyCookies(
          NextResponse.json(
            { error: "update-failed", details: updateErr.message },
            { status: 422 }
          )
        );
      }
    } else if (authedBy === "bearer" && jwtFromHeader) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`;
      const putRes = await fetch(url, {
        method: "PUT",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtFromHeader}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!putRes.ok) {
        const body = await putRes.json().catch(() => ({}));
        return context.applyCookies(
          NextResponse.json(
            { error: "update-failed", details: body?.msg || body?.error_description || "" },
            { status: putRes.status || 422 }
          )
        );
      }
    } else {
      return context.applyCookies(NextResponse.json({ error: "not-authenticated" }, { status: 401 }));
    }

    return context.applyCookies(NextResponse.json({ ok: true }, { status: 200 }));
  } catch (e: any) {
    return NextResponse.json({ error: "server-error", details: e?.message || "" }, { status: 500 });
  }
}
