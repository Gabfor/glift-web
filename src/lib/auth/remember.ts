export function setRememberCookie(remember: boolean) {
  if (typeof document === "undefined") return;
  if (remember) {
    document.cookie = `sb-remember=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    document.cookie = `sb-session-tab=; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  } else {
    document.cookie = `sb-remember=; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    document.cookie = `sb-session-tab=1; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  }
}
