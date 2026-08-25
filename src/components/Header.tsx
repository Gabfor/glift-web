"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useUser } from "@/context/UserContext";
import CTAButton from "@/components/CTAButton";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";

const HOUR_IN_MS = 60 * 60 * 1000;
const DEFAULT_GRACE_PERIOD_HOURS = 72;

interface HeaderProps {
  disconnected?: boolean;
}

export default function Header({ disconnected = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isRecoverySession, isEmailVerified, gracePeriodExpiresAt, isPremiumUser, isUserDataLoaded } =
    useUser();
  const { dashboardUrl, shopUrl, storeUrl, trainingsUrl, blogUrl, helpUrl } = useDashboardUrl();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [allowTransition, setAllowTransition] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);

  const { logoUrl, logoAlt } = useSiteSettings();

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
  
  const shouldShowPaymentBanner = showAuthenticatedUI && isPremiumUser && hasPaymentMethod === false;

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    const handleScroll = () => {
      let scroll = window.scrollY;
      if (document.body.classList.contains("manual-scroll-lock") || document.body.style.position === "fixed") {
        const top = parseInt(document.body.style.top || "0", 10);
        if (top < 0) {
          scroll = Math.abs(top);
        }
      }
      setIsSticky(scroll > 10);
    };

    // Initial check
    handleScroll();

    // Enable transition after initial render
    const timer = setTimeout(() => {
      setAllowTransition(true);
    }, 100);

    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new MutationObserver(() => {
      handleScroll();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (showAuthenticatedUI && isPremiumUser && hasPaymentMethod === null) {
      fetch("/api/user/payment-methods", { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setHasPaymentMethod(data.data.length > 0);
          } else {
            setHasPaymentMethod(false); // Fallback si le format est inattendu
          }
        })
        .catch(err => {
          console.error("Failed to fetch payment methods for banner", err);
        });
    }
  }, [showAuthenticatedUI, isPremiumUser, hasPaymentMethod]);

  useEffect(() => {
    const handlePaymentMethodUpdated = () => {
      setHasPaymentMethod(null); // Force refresh
    };
    window.addEventListener("paymentMethodUpdated", handlePaymentMethodUpdated);
    return () => window.removeEventListener("paymentMethodUpdated", handlePaymentMethodUpdated);
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
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-[100]">
        {shouldShowPaymentBanner && (
          <div className="w-full min-h-[36px] py-1.5 md:py-0 md:h-[36px] bg-[var(--color-brand-primary)] flex items-center justify-center px-4 text-center">
            {/* Version Desktop (md et +) */}
            <p className="hidden md:block text-white text-[14px] font-semibold">
              ⚠️ N'oublie pas d'ajouter un moyen de paiement pour ne pas perdre tes avantages Premium.{" "}
              <Link
                href="/compte#mon-abonnement"
                className="underline whitespace-nowrap"
              >
                Ajouter maintenant.
              </Link>
            </p>

            {/* Version Responsive Mobile (< md) */}
            <p className="block md:hidden text-white text-[14px] font-semibold leading-snug">
              ⚠️{" "}
              <Link
                href="/compte#mon-abonnement"
                className="underline"
              >
                Ajoute un moyen de paiement
              </Link>
              <br />
              pour ne pas perdre tes avantages Premium.
            </p>
          </div>
        )}

        <header
          className={`w-full ${allowTransition ? "transition-all duration-300 ease-in-out" : ""} ${isSticky || isMobileMenuOpen
            ? "bg-white shadow-[0_6px_14px_-10px_rgba(15,23,42,0.25)]"
            : "bg-transparent shadow-none"
            }`}
        >
        <div className="max-w-[1152px] mx-auto h-[72px] flex items-center justify-between px-5 md:px-0 relative">
          {/* Burger button (Mobile Left) */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 text-[#3A416F] focus:outline-none z-20 cursor-pointer"
            aria-label="Ouvrir le menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            <span
              className={`block h-[2px] w-[20px] rounded-full bg-[#3A416F] transition-transform duration-200 ${isMobileMenuOpen ? "translate-y-[6px] rotate-45" : ""
                }`}
            />
            <span
              className={`block h-[2px] w-[20px] rounded-full bg-[#3A416F] my-[4px] transition-opacity duration-200 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
            />
            <span
              className={`block h-[2px] w-[20px] rounded-full bg-[#3A416F] transition-transform duration-200 ${isMobileMenuOpen ? "-translate-y-[6px] -rotate-45" : ""
                }`}
            />
          </button>

          {/* Logo */}
          <div className="flex items-center h-full max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-1/2 max-md:-translate-y-1/2">
            <Link
              href={showAuthenticatedUI ? dashboardUrl : "/"}
              className="flex items-center h-full md:pr-4"
            >
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={0}
                height={0}
                sizes="100vw"
                className="w-auto h-[35px]"
                priority
              />
            </Link>
          </div>

          {/* Menu centré */}
          <nav className="hidden md:flex text-[16px] text-[var(--color-text-body)] font-semibold h-full absolute left-1/2 transform -translate-x-1/2 z-10 top-0">
            {showAuthenticatedUI ? (
              <>
                <Link
                  href={dashboardUrl}
                  className={
                    pathname === dashboardUrl || pathname === "/dashboard"
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Tableau de bord
                </Link>
                <Link
                  href={trainingsUrl}
                  className={
                    pathname?.startsWith(trainingsUrl) || pathname?.startsWith("/entrainements")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Entraînements
                </Link>
                <Link
                  href={storeUrl}
                  className={
                    pathname?.startsWith(storeUrl) || pathname?.startsWith("/store")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Store
                </Link>
                <Link
                  href={shopUrl}
                  className={
                    pathname?.startsWith(shopUrl) || pathname?.startsWith("/shop")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Shop
                </Link>
                <Link
                  href={blogUrl}
                  className={
                    pathname?.startsWith(blogUrl) || pathname?.startsWith("/blog")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Blog
                </Link>
                <Link
                  href={helpUrl}
                  className={
                    pathname?.startsWith(helpUrl) || pathname?.startsWith("/aide")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
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
                    pathname === "/"
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Concept
                </Link>
                <Link
                  href="/apps"
                  className={
                    pathname === "/apps"
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Apps
                </Link>
                <Link
                  href="/tarifs"
                  className={
                    pathname === "/tarifs"
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Tarifs
                </Link>
                <Link
                  href={storeUrl}
                  className={
                    pathname?.startsWith(storeUrl) || pathname?.startsWith("/store")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Store
                </Link>
                <Link
                  href={shopUrl}
                  className={
                    pathname?.startsWith(shopUrl) || pathname?.startsWith("/shop")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Shop
                </Link>
                <Link
                  href={blogUrl}
                  className={
                    pathname?.startsWith(blogUrl) || pathname?.startsWith("/blog")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Blog
                </Link>
                <Link
                  href={helpUrl}
                  className={
                    pathname?.startsWith(helpUrl) || pathname?.startsWith("/aide")
                      ? "flex items-center h-full px-4 text-[var(--color-brand-primary)]"
                      : "flex items-center h-full px-4 hover:text-[var(--color-text-heading)]"
                  }
                >
                  Aide
                </Link>
              </>
            )}
          </nav>

          {/* User Zone */}
          <div className="hidden md:flex relative items-center h-full" ref={dropdownRef}>
            {showAuthenticatedUI ? (
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="group flex items-center h-full px-4 ml-[18px] gap-2 text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] text-[16px] font-semibold"
              >
                <div className="relative">
                  <div
                    className={`w-[44px] h-[44px] text-[25px] rounded-full text-white flex items-center justify-center font-semibold overflow-hidden ${hasAvatar ? "bg-transparent" : "bg-[var(--color-brand-primary)]"
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
                  {/* Subscription Badge */}
                  {isUserDataLoaded && (
                    <div className="absolute bottom-0 right-0 z-10 transition-opacity duration-300 animate-in fade-in zoom-in">
                      <Image
                        src={isPremiumUser ? "/icons/diamant_premium.svg" : "/icons/diamant_starter.svg"}
                        alt={isPremiumUser ? "Premium" : "Starter"}
                        width={16.5}
                        height={15}
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                {userDisplayName}
                <span
                  className={`relative w-[14px] h-[8px] mt-[2px] group transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
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
              <div className="flex items-center text-sm font-medium h-full">
                <Link
                  href="/connexion"
                  className="flex items-center h-full px-6 text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] text-[16px] font-semibold"
                >
                  Connexion
                </Link>
                <CTAButton href="/tarifs" disableAutoLoading>
                  Inscription
                </CTAButton>
              </div>
            )}

            {dropdownOpen && showAuthenticatedUI && (
              <div className="absolute top-full right-[-4px] w-[180px] bg-white rounded-[5px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)] py-2 z-50 border border-[var(--color-surface-subtle)]">
                <div className="absolute -top-2 right-[18px] w-4 h-4 bg-white rotate-45 border-t border-l border-[var(--color-surface-subtle)] rounded-[1px]" />
                <Link
                  href="/compte#mes-informations"
                  onClick={(event) =>
                    handleAccountLinkClick(event, "mes-informations")
                  }
                  className="block text-[16px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[var(--color-surface-highlight)]"
                >
                  Mes informations
                </Link>
                <Link
                  href="/compte#mon-abonnement"
                  onClick={(event) =>
                    handleAccountLinkClick(event, "mon-abonnement")
                  }
                  className="block text-[16px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[var(--color-surface-highlight)]"
                >
                  Mon abonnement
                </Link>
                <Link
                  href="/compte#mes-preferences"
                  onClick={(event) =>
                    handleAccountLinkClick(event, "mes-preferences")
                  }
                  className="block text-[16px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[var(--color-surface-highlight)]"
                >
                  Mes préférences
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/deconnexion");
                  }}
                  className="block w-[158px] text-left text-[16px] text-[var(--color-accent-danger)] hover:text-[var(--color-accent-danger-hover)] font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] hover:bg-[var(--color-danger-surface)]"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Backdrop Overlay (glift-mobile barrierColor) */}
        <div
          className={`md:hidden fixed inset-0 z-40 bg-[#2E3142]/60 transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Menu Slide-in Drawer */}
        <div
          className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-[310px] h-full bg-white shadow-2xl overflow-y-auto p-6 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F6]">
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={0}
                height={0}
                sizes="100vw"
                className="w-auto h-[32px]"
                priority
              />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-[#3A416F] hover:opacity-75 focus:outline-none cursor-pointer"
                aria-label="Fermer le menu"
              >
                <svg
                  className="w-5 h-5 stroke-[#3A416F]"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col py-4 border-b border-[#F0F2F6]">
              {showAuthenticatedUI ? (
                <>
                  <Link
                    href={dashboardUrl}
                    className={
                      pathname === dashboardUrl || pathname === "/dashboard"
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href={trainingsUrl}
                    className={
                      pathname?.startsWith(trainingsUrl) || pathname?.startsWith("/entrainements")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entraînements
                  </Link>
                  <Link
                    href={storeUrl}
                    className={
                      pathname?.startsWith(storeUrl) || pathname?.startsWith("/store")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Store
                  </Link>
                  <Link
                    href={shopUrl}
                    className={
                      pathname?.startsWith(shopUrl) || pathname?.startsWith("/shop")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    href={blogUrl}
                    className={
                      pathname?.startsWith(blogUrl) || pathname?.startsWith("/blog")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href={helpUrl}
                    className={
                      pathname?.startsWith(helpUrl) || pathname?.startsWith("/aide")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Aide
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={
                      pathname === "/" || pathname === "/concept"
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Concept
                  </Link>
                  <Link
                    href="/apps"
                    className={
                      pathname === "/apps"
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Apps
                  </Link>
                  <Link
                    href="/tarifs"
                    className={
                      pathname === "/tarifs"
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tarifs
                  </Link>
                  <Link
                    href={storeUrl}
                    className={
                      pathname?.startsWith(storeUrl) || pathname?.startsWith("/store")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Store
                  </Link>
                  <Link
                    href={shopUrl}
                    className={
                      pathname?.startsWith(shopUrl) || pathname?.startsWith("/shop")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    href={blogUrl}
                    className={
                      pathname?.startsWith(blogUrl) || pathname?.startsWith("/blog")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href={helpUrl}
                    className={
                      pathname?.startsWith(helpUrl) || pathname?.startsWith("/aide")
                        ? "py-2.5 text-[16px] font-bold text-[var(--color-brand-primary)]"
                        : "py-2.5 text-[16px] font-bold text-[#3A416F] hover:text-[var(--color-brand-primary)]"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Aide
                  </Link>
                </>
              )}
            </nav>

            {/* Actions (Directly under second line) */}
            <div className="flex flex-col gap-3 pt-6">
              {showAuthenticatedUI ? (
                <>
                  <Link
                    href="/compte"
                    className="w-full h-[44px] rounded-full border border-[#3A416F] text-[#3A416F] hover:text-white hover:bg-[#3A416F] font-semibold text-[16px] flex items-center justify-center transition-all duration-300 group cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>{userDisplayName}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/deconnexion");
                    }}
                    className="w-full h-[44px] rounded-full bg-[#EF4F4E] hover:bg-[#E03E3D] text-white font-semibold text-[16px] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="w-full h-[44px] rounded-full border border-[#3A416F] text-[#3A416F] font-semibold text-[16px] flex items-center justify-center hover:bg-[#3A416F]/5 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/tarifs"
                    className="w-full h-[44px] rounded-full bg-[#7069FA] hover:bg-[#6058F8] text-white font-semibold text-[16px] flex items-center justify-center transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>

    {/* Espaceur dans le flux du document pour décaler automatiquement le contenu de la page de la hauteur exacte du bandeau */}
    {shouldShowPaymentBanner && (
      <div
        className="w-full min-h-[36px] py-1.5 md:py-0 md:h-[36px] invisible pointer-events-none"
        aria-hidden="true"
      >
        <p className="block md:hidden text-[14px] leading-snug">
          ⚠️ Ajoute un moyen de paiement<br />pour ne pas perdre tes avantages Premium.
        </p>
      </div>
    )}
  </>
  );
}
