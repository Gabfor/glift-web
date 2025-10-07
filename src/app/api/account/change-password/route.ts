import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getPasswordValidationState } from "@/utils/password"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("[change-password] failed to retrieve user", userError)
      return NextResponse.json({ error: "user-fetch-failed" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "not-authenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid-body" }, { status: 400 })
    }

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "missing-fields" }, { status: 400 })
    }

    if (currentPassword === newPassword) {
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      if (signInError.status === 400 || signInError.status === 401) {
        return NextResponse.json({ error: "invalid-current-password" }, { status: 400 })
      }

      console.error("[change-password] unable to verify current password", signInError)
      return NextResponse.json({ error: "invalid-current-password" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      console.error("[change-password] failed to update password", updateError)
      return NextResponse.json({ error: "update-failed" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[change-password] unexpected error", error)
    return NextResponse.json({ error: "unexpected-error" }, { status: 500 })
  }
}
