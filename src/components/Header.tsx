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
      setIsSticky(window.scrollY > 0);
    };

    // Initial check
    handleScroll();

    // Enable transition after initial render
    const timer = setTimeout(() => {
      setAllowTransition(true);
    }, 100);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
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
      {shouldShowPaymentBanner && (
        <div className="fixed top-0 left-0 w-full h-[36px] bg-[var(--color-brand-primary)] flex items-center justify-center px-4 text-center z-[60]">
          <p className="text-white text-[14px] font-semibold">
            ⚠️ N'oubliez pas d'ajouter un moyen de paiement pour ne pas perdre vos avantages Premium.{" "}
            <Link
              href="/compte#mon-abonnement"
              className="underline"
            >
              Ajouter maintenant.
            </Link>
          </p>
        </div>
      )}

      <header
        className={`fixed ${shouldShowPaymentBanner ? "top-[36px]" : "top-0"} left-0 w-full z-50 ${allowTransition ? "transition-shadow duration-300" : ""} ${isSticky
          ? "bg-white shadow-[0_6px_14px_-10px_rgba(15,23,42,0.25)]"
          : "bg-[var(--color-surface-primary)]"
          }`}
      >
        <div className="max-w-[1152px] mx-auto h-[72px] flex items-center justify-between px-4 md:px-0 relative">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Link
              href={showAuthenticatedUI ? dashboardUrl : "/"}
              className="flex items-center h-full pr-4"
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
          <div className="relative flex items-center h-full" ref={dropdownRef}>
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

            <button
              type="button"
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-full border border-[var(--color-surface-subtle)] bg-white text-[var(--color-text-body)] hover:text-[var(--color-text-heading)]"
              aria-label="Ouvrir le menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
            >
              <span
                className={`block h-[2px] w-[18px] rounded-full bg-current transition-transform duration-200 ${isMobileMenuOpen ? "translate-y-[6px] rotate-45" : ""
                  }`}
              />
              <span
                className={`block h-[2px] w-[18px] rounded-full bg-current my-[6px] transition-opacity duration-200 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`block h-[2px] w-[18px] rounded-full bg-current transition-transform duration-200 ${isMobileMenuOpen ? "-translate-y-[6px] -rotate-45" : ""
                  }`}
              />
            </button>

            {dropdownOpen && showAuthenticatedUI && (
              <div className="absolute top-full right-[-20px] mt-2 w-[180px] bg-white rounded-[5px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)] py-2 z-50 border border-[var(--color-surface-subtle)]">
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

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />
        )}

        <div
          className={`md:hidden fixed top-[72px] left-0 w-full z-50 transition-transform duration-300 ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-[120%]"
            }`}
        >
          <div className="mx-4 rounded-[12px] bg-white shadow-[var(--shadow-card-hover)] border border-[var(--color-surface-subtle)] p-5 space-y-4">
            <nav className="flex flex-col gap-3 text-[16px] text-[var(--color-text-heading)] font-semibold">
              {showAuthenticatedUI ? (
                <>
                  <Link
                    href={dashboardUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href={trainingsUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entraînements
                  </Link>
                  <Link
                    href={storeUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Store
                  </Link>
                  <Link
                    href={shopUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    href={blogUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href={helpUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Aide
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Concept
                  </Link>
                  <Link
                    href="/apps"
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Apps
                  </Link>
                  <Link
                    href="/tarifs"
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tarifs
                  </Link>
                  <Link
                    href={storeUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Store
                  </Link>
                  <Link
                    href={shopUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    href={blogUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href={helpUrl}
                    className="block w-full py-2 hover:text-[var(--color-brand-primary)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Aide
                  </Link>
                </>
              )}
            </nav>

            <div className="flex flex-col gap-3">
              {showAuthenticatedUI ? (
                <button
                  className="flex items-center justify-between rounded-[10px] border border-[var(--color-surface-subtle)] bg-[var(--color-surface-highlight)] px-4 py-3 text-[15px] font-semibold text-[var(--color-text-heading)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {userDisplayName}
                  <span className="text-[13px] text-[var(--color-text-body)]">Profil</span>
                </button>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="text-[var(--color-text-heading)] text-[16px] font-semibold text-center border border-[var(--color-surface-subtle)] rounded-full h-[44px] flex items-center justify-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <CTAButton href="/tarifs" className="w-full" disableAutoLoading>
                    Inscription
                  </CTAButton>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
