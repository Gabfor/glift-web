"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useUser } from "@/context/UserContext";
import { createClientComponentClient } from "@/lib/supabase/client";
import CTAButton from "@/components/CTAButton";
import Spinner from "@/components/ui/Spinner";

interface HeaderProps {
  disconnected?: boolean;
}

export default function Header({ disconnected = false }: HeaderProps) {
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const { user, isAuthenticated, isRecoverySession, isEmailVerified } =
    useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const resendStatusResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rawAvatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url.trim()
      : "";
  const hasAvatar = rawAvatarUrl.length > 0;
  const userInitial =
    user?.user_metadata?.name?.charAt(0).toUpperCase() || "?";
  const userDisplayName = user?.user_metadata?.name?.trim() || "Profil";

  // Forcer le mode déconnecté si `disconnected` est vrai
  const showAuthenticatedUI =
    isAuthenticated && !isRecoverySession && !disconnected;
  const shouldShowEmailVerificationBanner =
    showAuthenticatedUI &&
    (isEmailVerified === false ||
      (isEmailVerified === null && !user?.email_confirmed_at));

  const handleResendVerificationEmail = async () => {
    if (resendStatus === "loading") {
      return;
    }

    try {
      setResendStatus("loading");
      console.log("[header] Resending verification email request sent");

      const response = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        console.error(
          "[header] Unable to resend email verification message",
          errorPayload,
        );
        setResendStatus("error");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean }
        | null;

      if (!payload?.success) {
        console.error(
          "[header] Unexpected payload received when resending verification email",
          payload,
        );
        setResendStatus("error");
        return;
      }

      setResendStatus("success");
      console.info("[header] Verification email successfully resent");
      if (resendStatusResetTimeoutRef.current) {
        clearTimeout(resendStatusResetTimeoutRef.current);
      }
      resendStatusResetTimeoutRef.current = setTimeout(() => {
        setResendStatus("idle");
        resendStatusResetTimeoutRef.current = null;
      }, 3000);
    } catch (error) {
      console.error(
        "[header] Unexpected error when resending email verification",
        error,
      );
      setResendStatus("error");
    }
  };

  useEffect(() => {
    return () => {
      if (resendStatusResetTimeoutRef.current) {
        clearTimeout(resendStatusResetTimeoutRef.current);
        resendStatusResetTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAccountLinkClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    sectionHash: string,
  ) => {
    if (pathname === "/compte") {
      event.preventDefault();
      setDropdownOpen(false);

      if (typeof window === "undefined") {
        return;
      }

      const targetHash = `#${sectionHash}`;
      if (window.location.hash === targetHash) {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      } else {
        window.location.hash = targetHash;
      }

      return;
    }

    setDropdownOpen(false);
  };

  return (
    <>
      {shouldShowEmailVerificationBanner && (
        <div className="fixed top-0 left-0 w-full h-[36px] bg-[#7069FA] flex items-center justify-center px-4 text-center z-[60]">
          <p className="text-white text-[14px] font-semibold">
            <span>
              {
                "⚠️ Pour finaliser votre inscription, merci de confirmer votre email en cliquant sur le lien reçu. "
              }
            </span>
            <button
              type="button"
              onClick={handleResendVerificationEmail}
              disabled={resendStatus === "loading"}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {" "}
              {resendStatus === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner ariaLabel="Renvoi de l'email de vérification" />
                  Renvoi en cours...
                </span>
              ) : resendStatus === "success" ? (
                "Email envoyé"
              ) : (
                "Cliquez ici pour renvoyer l’email."
              )}
            </button>
            {resendStatus === "error" && (
              <span className="ml-1">Une erreur est survenue.</span>
            )}
          </p>
        </div>
      )}
      <header
        className={`fixed ${shouldShowEmailVerificationBanner ? "top-[36px]" : "top-0"} left-0 w-full z-50 transition-all duration-300 ${
          isSticky
            ? "bg-white shadow-[0_5px_21px_0_rgba(93,100,148,0.15)]"
            : "bg-[#FBFCFE]"
        }`}
      >
      <div className="max-w-[1152px] mx-auto py-4 flex items-center justify-between md:px-0 relative">
        {/* Logo */}
        <div className="w-[147px] flex items-center">
          <Link
            href={showAuthenticatedUI ? "/dashboard" : "/"}
            className="flex items-center"
          >
            <Image
              src="/logo_beta.svg"
              alt="Logo Glift"
              width={147}
              height={35}
              priority
            />
          </Link>
        </div>

        {/* Menu centré */}
        <nav className="hidden md:flex gap-6 text-[16px] text-[#5D6494] font-semibold h-[44px] items-center absolute left-1/2 transform -translate-x-1/2">
          {showAuthenticatedUI ? (
            <>
              <Link
                href="/dashboard"
                className={
                  pathname === "/dashboard"
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Tableau de bord
              </Link>
              <Link
                href="/entrainements"
                className={
                  pathname?.startsWith("/entrainements")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Entraînements
              </Link>
              <Link
                href="/store"
                className={
                  pathname?.startsWith("/store")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Store
              </Link>
              <Link
                href="/shop"
                className={
                  pathname?.startsWith("/shop")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Shop
              </Link>
              <Link
                href="/blog"
                className={
                  pathname?.startsWith("/blog")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Blog
              </Link>
              <Link
                href="/aide"
                className={
                  pathname?.startsWith("/aide")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Aide
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={
                  pathname === "/" ? "text-[#7069FA]" : "hover:text-[#3A416F]"
                }
              >
                Concept
              </Link>
              <Link
                href="/apps"
                className={
                  pathname === "/apps"
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Apps
              </Link>
              <Link
                href="/tarifs"
                className={
                  pathname === "/tarifs"
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Tarifs
              </Link>
              <Link
                href="/store"
                className={
                  pathname?.startsWith("/store")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Store
              </Link>
              <Link
                href="/shop"
                className={
                  pathname?.startsWith("/shop")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Shop
              </Link>
              <Link
                href="/blog"
                className={
                  pathname?.startsWith("/blog")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Blog
              </Link>
              <Link
                href="/aide"
                className={
                  pathname?.startsWith("/aide")
                    ? "text-[#7069FA]"
                    : "hover:text-[#3A416F]"
                }
              >
                Aide
              </Link>
            </>
          )}
        </nav>

        {/* User Zone */}
        <div className="relative ml-[18px]" ref={dropdownRef}>
          {showAuthenticatedUI ? (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-2 text-[#5D6494] hover:text-[#3A416F] text-[16px] font-semibold"
            >
              <div
                className={`w-[44px] h-[44px] text-[25px] rounded-full text-white flex items-center justify-center font-semibold overflow-hidden ${
                  hasAvatar ? "bg-transparent" : "bg-[#7069FA]"
                }`}
              >
                {hasAvatar ? (
                  <Image
                    src={rawAvatarUrl}
                    alt={`Avatar de ${userDisplayName}`}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover rounded-full border-0 outline-none"
                  />
                ) : (
                  userInitial
                )}
              </div>
              {userDisplayName}
              <span
                className={`relative w-[14px] h-[8px] mt-[2px] group transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              >
                <Image
                  src="/icons/chevron_down.svg"
                  alt="Chevron"
                  fill
                  className="object-contain transition-opacity duration-150 group-hover:opacity-0"
                />
                <Image
                  src="/icons/chevron_down_hover.svg"
                  alt="Chevron hover"
                  fill
                  className="object-contain absolute top-0 left-0 transition-opacity duration-150 opacity-0 group-hover:opacity-100"
                />
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/connexion"
                className="text-[#5D6494] hover:text-[#3A416F] text-[16px] font-semibold"
              >
                Connexion
              </Link>
              <CTAButton href="/tarifs" disableAutoLoading>
                Inscription
              </CTAButton>
            </div>
          )}

          {dropdownOpen && showAuthenticatedUI && (
            <div className="absolute right-[-20px] mt-2 w-[180px] bg-white rounded-[5px] shadow-[0px_5px_21px_0px_rgba(93,100,148,0.15)] py-2 z-50 border border-[#ECE9F1]">
              <div className="absolute -top-2 right-[18px] w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />
              <Link
                href="/compte#mes-informations"
                onClick={(event) =>
                  handleAccountLinkClick(event, "mes-informations")
                }
                className="block text-[16px] text-[#5D6494] hover:text-[#3A416F] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[#FAFAFF]"
              >
                Mes informations
              </Link>
              <Link
                href="/compte#mon-abonnement"
                onClick={(event) =>
                  handleAccountLinkClick(event, "mon-abonnement")
                }
                className="block text-[16px] text-[#5D6494] hover:text-[#3A416F] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[#FAFAFF]"
              >
                Mon abonnement
              </Link>
              <Link
                href="/compte#mes-preferences"
                onClick={(event) =>
                  handleAccountLinkClick(event, "mes-preferences")
                }
                className="block text-[16px] text-[#5D6494] hover:text-[#3A416F] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[#FAFAFF]"
              >
                Mes préférences
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="block w-[158px] text-left text-[16px] text-[#EF4F4E] hover:text-[#BA2524] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[#FFF1F1]"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
      </header>
    </>
  );
}
