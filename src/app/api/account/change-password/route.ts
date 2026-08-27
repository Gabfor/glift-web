import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getPasswordValidationState } from "@/utils/password"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace(/^Bearer\s+/i, "")

    const supabase = await createClient()
    let user = null

    if (token) {
      const { data: tokenUserData, error: tokenError } = await supabase.auth.getUser(token)
      if (!tokenError && tokenUserData?.user) {
        user = tokenUserData.user
      }
    }

    if (!user) {
      const { data: cookieUserData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("[change-password] failed to retrieve user", userError)
      }
      user = cookieUserData?.user ?? null
    }

    if (!user) {
      return NextResponse.json({ error: "not-authenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid-body" }, { status: 400 })
    }

    const providers = (user.app_metadata?.providers as string[] | undefined) ?? []
    const hasPassword =
      user.user_metadata?.has_password === true ||
      user.app_metadata?.has_password === true ||
      providers.includes("email") ||
      user.app_metadata?.provider === "email"
    const isOAuthOnly = !hasPassword && (providers.includes("google") || providers.includes("apple") || user.app_metadata?.provider === "google" || user.app_metadata?.provider === "apple")

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""

    if (!newPassword || (!isOAuthOnly && !currentPassword)) {
      return NextResponse.json({ error: "missing-fields" }, { status: 400 })
    }

    if (!isOAuthOnly && currentPassword === newPassword) {
      return NextResponse.json({ error: "same-password" }, { status: 400 })
    }

    const validation = getPasswordValidationState(newPassword)
    if (!validation.isValid) {
      return NextResponse.json({ error: "invalid-password-format" }, { status: 400 })
    }

    const email = user.email
    if (!email) {
      console.error("[change-password] user missing email")
      return NextResponse.json({ error: "missing-email" }, { status: 400 })
    }

    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    if (!isOAuthOnly) {
      const { error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        return NextResponse.json({ error: "invalid-current-password" }, { status: 400 })
      }
    }

    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...(user.user_metadata || {}),
        has_password: true,
      },
    })

    if (updateError) {
      console.error("[change-password] failed to update password", updateError)
      return NextResponse.json({ error: "update-failed" }, { status: 500 })
    }

    // Immediately establish a new session so the user is never logged out
    const { data: newSessionData } = await authClient.auth.signInWithPassword({
      email,
      password: newPassword,
    })

    return NextResponse.json({
      success: true,
      session: newSessionData?.session ?? null,
    })
  } catch (error) {
    console.error("[change-password] unexpected error", error)
    return NextResponse.json({ error: "unexpected-error" }, { status: 500 })
  }
}
