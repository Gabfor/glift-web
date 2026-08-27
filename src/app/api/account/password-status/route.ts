import { NextResponse } from "next/server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "not-authenticated" }, { status: 401 })
    }

    const providers = (user.app_metadata?.providers as string[] | undefined) ?? []

    if (user.user_metadata?.has_password === true || user.app_metadata?.has_password === true) {
      return NextResponse.json({ hasPassword: true, providers, provider: user.app_metadata?.provider })
    }

    if (providers.includes("email") || user.app_metadata?.provider === "email") {
      return NextResponse.json({ hasPassword: true, providers, provider: user.app_metadata?.provider })
    }

    try {
      const admin = createAdminClient()
      const { data: adminUser } = await admin.auth.admin.getUserById(user.id)
      if (
        adminUser?.user?.user_metadata?.has_password === true ||
        adminUser?.user?.app_metadata?.has_password === true
      ) {
        return NextResponse.json({ hasPassword: true, providers, provider: user.app_metadata?.provider })
      }
      const adminProviders = (adminUser?.user?.app_metadata?.providers as string[] | undefined) ?? []
      if (adminProviders.includes("email") || adminUser?.user?.app_metadata?.provider === "email") {
        return NextResponse.json({
          hasPassword: true,
          providers: adminProviders,
          provider: adminUser?.user?.app_metadata?.provider,
        })
      }
    } catch (e) {
      console.error("[password-status] admin check error", e)
    }

    return NextResponse.json({
      hasPassword: false,
      providers,
      provider: user.app_metadata?.provider,
    })
  } catch (error) {
    console.error("[password-status] unexpected error", error)
    return NextResponse.json({ error: "unexpected-error" }, { status: 500 })
  }
}
