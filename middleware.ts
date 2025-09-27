import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  console.log("[mw] hit", pathname, search);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log("[mw] isAuth=", !!user, error ? `error=${error.message}` : "");

  const redirectByMw = (to: URL) => {
    const r = NextResponse.redirect(to, { headers: res.headers });
    r.headers.set("x-redirect-by", "middleware");
    return r;
  };

  const remember = req.cookies.get("sb-remember")?.value === "1";
  const sessionTab = req.cookies.get("sb-session-tab")?.value === "1";
  if (user && !remember && !sessionTab) {
    res.cookies.set({
      name: "sb-session-tab",
      value: "1",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  const hasClientConsent = remember || sessionTab;

  const isCompte = pathname.startsWith("/compte");
  const isAdmin = pathname.startsWith("/admin");
  const isEntrainements = pathname.startsWith("/entrainements");

  if ((isCompte || isEntrainements) && (!user || !hasClientConsent)) {
    const to = new URL("/connexion", req.url);
    to.searchParams.set("next", pathname + search);
    return redirectByMw(to);
  }

  if (isAdmin) {
    if (!user || !hasClientConsent) {
      const to = new URL("/connexion", req.url);
      to.searchParams.set("next", pathname + search);
      return redirectByMw(to);
    }
    const isAdminFlag = (user as any)?.user_metadata?.is_admin === true || (user as any)?.app_metadata?.is_admin === true;
    if (!isAdminFlag) {
      return redirectByMw(new URL("/compte", req.url));
    }
  }

  res.headers.set("x-mw-pass", "1");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|fonts|sitemap.xml|robots.txt|api/.*|auth/callback).*)",
  ],
};
