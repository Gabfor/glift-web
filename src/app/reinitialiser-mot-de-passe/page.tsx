"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Tooltip from "@/components/Tooltip";
import Spinner from "@/components/ui/Spinner";

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"verify" | "reset" | "done" | "error">("verify");

  const next = search?.get("next") || "/compte#mes-informations";
  const access_token = search?.get("access_token") || "";
  const refresh_token = search?.get("refresh_token") || "";
  const type = search?.get("type") || "";
  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.trim().length >= 8;
  const isConfirmValid = confirmPassword.trim() !== "" && confirmPassword === password;

  const shouldShowEmailError = emailTouched && !emailFocused && email.trim() !== "" && !isEmailValidFormat;
  const shouldShowPasswordError = passwordTouched && !passwordFocused && password.trim() !== "" && !isPasswordValid;
  const shouldShowConfirmError = confirmTouched && !confirmFocused && confirmPassword.trim() !== "" && !isConfirmValid;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (access_token && refresh_token && (type === "recovery" || type === "signup" || type === "magiclink")) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          const params = new URLSearchParams(window.location.hash.replace("#", ""));
          const at = params.get("access_token");
          const rt = params.get("refresh_token");
          const t = params.get("type");
          if (t === "recovery" && at && rt) {
            const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
            if (error) throw error;
          } else {
            throw new Error("invalid-link");
          }
        }
        const { data, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const uEmail = data?.user?.email ?? "";
        if (!uEmail) throw new Error("no-email");
        if (!cancelled) {
          setEmail(uEmail);
          setStage("reset");
        }
        if (typeof window !== "undefined" && window.location.hash) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      } catch {
        if (!cancelled) setStage("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [access_token, refresh_token, type, supabase]);

  const isFormValid = isEmailValidFormat && isPasswordValid && isConfirmValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error("no-user");
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setStage("done");
      setTimeout(() => {
        window.location.href = next;
      }, 600);
    } catch {
      setStage("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[24px]">Réinitialiser le mot de passe</h1>

        {stage === "verify" && (
          <div className="w-[564px] mb-6">
            <div className="relative bg-[#E7F0FF] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#4F78EF]" />
              <h3 className="text-[#2E3271] font-bold text-[12px]">Vérification…</h3>
              <p className="text-[#4F78EF] font-semibold text-[12px] leading-relaxed">Un instant, nous vérifions ton lien de réinitialisation.</p>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="w-[564px] mb-6">
            <div className="relative bg-[#FFE3E3] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#EF4F4E]" />
              <h3 className="text-[#B42318] font-bold text-[12px]">Lien invalide ou expiré</h3>
              <p className="text-[#EF4F4E] font-semibold text-[12px] leading-relaxed">Merci de relancer une demande depuis « Mot de passe oublié ? ».</p>
            </div>
          </div>
        )}

        {stage === "reset" && (
          <form className="flex flex-col items-center w-full" onSubmit={handleSubmit} autoComplete="on" name="reset-password">
            <div className="w-full max-w-[368px]">
              <label htmlFor="email" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Email</label>
              <input
                id="email"
                name="username"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="john.doe@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  setEmailTouched(true);
                }}
                className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
                  shouldShowEmailError ? "border border-[#EF4444]" : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                }`}
              />
              <div className="h-[20px] mt-[5px] text-[13px] font-medium">{shouldShowEmailError && <p className="text-[#EF4444]">Format d’adresse invalide</p>}</div>
            </div>

            <div className="w-full max-w-[368px] mb-[20px] relative">
              <div className="flex items-end justify-between mb-[5px]">
                <label htmlFor="password" className="text-[16px] text-[#3A416F] font-bold">Nouveau mot de passe</label>
              </div>
              <input
                id="password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
              />
              <div className="h-[20px] mt-[5px] text-[13px] font-medium">{shouldShowPasswordError && <p className="text-[#EF4444]">Mot de passe invalide</p>}</div>
            </div>

            <div className="w-full max-w-[368px] mb-[20px] relative">
              <div className="flex items-end justify-between mb-[5px]">
                <label htmlFor="confirm" className="text-[16px] text-[#3A416F] font-bold">Confirmation</label>
              </div>
              <input
                id="confirm"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
              />
              <div className="h-[20px] mt-[5px] text-[13px] font-medium">{shouldShowConfirmError && <p className="text-[#EF4444]">Mince, le mot de passe ne correspond pas…</p>}</div>
            </div>

            <div className="w-full flex justify-center">
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                aria-busy={submitting}
                className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold ${
                  !isFormValid || submitting ? "bg-[#F2F1F6] text-[#D7D4DC] cursor-not-allowed" : "bg-[#7069FA] text-white hover:bg-[#6660E4]"
                }`}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="md" ariaLabel="En cours" />
                    En cours...
                  </span>
                ) : (
                  "Valider"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
