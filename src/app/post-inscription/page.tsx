"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import GliftLoader from "@/components/ui/GliftLoader";

export default function PostInscription() {
  const params = useSearchParams();
  const email = params?.get("email") || "";
  const password = params?.get("password") || "";

  console.log("Auto-login with", email, password);

  useEffect(() => {
    const form = document.getElementById("authForm") as HTMLFormElement;
    if (form) {
      setTimeout(() => {
        form.submit();
      }, 3000); // ⏱️ délai de 3 secondes
    }
  }, []);  

  return (
    <>
      <GliftLoader />
      <form
        id="authForm"
        method="POST"
        action="/api/auth/login?returnTo=/entrainements"
        style={{ display: "none" }}
      >
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />
      </form>
    </>
  );
}
