type SessionLike = { access_token?: string; refresh_token?: string } | null | undefined

export async function postAuthCallback(
  session: SessionLike,
  remember: "0" | "1" = "1"
) {
  if (!session?.access_token || !session?.refresh_token) return
  try {
    await fetch("/auth/callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "SIGNED_IN",
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        remember,
      }),
      keepalive: true,
    })
  } catch {/* noop */}
}
