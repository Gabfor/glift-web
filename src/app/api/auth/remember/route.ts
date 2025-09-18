import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { remember } = await req.json().catch(() => ({ remember: false as boolean }));

    // ✅ cookies() peut être typé async selon ta version de Next → on attend sa résolution
    const cookieStore = await cookies();
    const access = cookieStore.get("sb-access-token");
    const refresh = cookieStore.get("sb-refresh-token");

    if (!access || !refresh) {
      return NextResponse.json(
        { error: "No Supabase session cookies present." },
        { status: 400 }
      );
    }

    const resp = NextResponse.json({ success: true });

    const maxAge = remember ? 60 * 60 * 24 * 180 : undefined; // 180 jours si "rester connecté"
    const base = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    // 🔁 Re-dépose les cookies Supabase avec (ou sans) expiration
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

    // Indicateur lisible côté client pour configurer la persistance du SDK
    resp.cookies.set({
      name: "sb-remember",
      value: remember ? "1" : "0",
      path: "/",
      ...(maxAge ? { maxAge } : {}),
    });

    return resp;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
