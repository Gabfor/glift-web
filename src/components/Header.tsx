"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from '@auth0/nextjs-auth0';
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user } = useUser();
  const pathname = usePathname();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isSticky ? "bg-white shadow-[0_5px_21px_0_rgba(93,100,148,0.15)]" : "bg-[#FBFCFE]"
      }`}
    >
      <div className="max-w-[1152px] mx-auto py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="w-[220px] flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo_beta.svg"
              alt="Logo Glift"
              width={147}
              height={35}
              priority
            />
          </Link>
        </div>

        {/* Menu */}
        <nav className="hidden md:flex gap-6 text-[16px] text-[#5D6494] font-semibold h-[44px] items-center">
          <Link href="/" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}>Concept</Link>
          <Link href="/apps" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/apps" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}>Apps</Link>
          <Link href="/tarifs" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/tarifs" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}
>Tarifs</Link>
          <Link href="/store" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/store" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}>Store</Link>
          <Link href="/shop" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/shop" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}>Shop</Link>
          <Link href="/blog" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/blog" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}>Blog</Link>
          <Link href="/aide" className={`font-semibold text-[16px] transition-colors duration-200 ${
    pathname === "/aide" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
  }`}>Aide</Link>
        </nav>

        {/* Connexion / Inscription */}
        <div className="flex items-center gap-4 text-sm font-medium">
          {!user && (
            <>
              <Link
                href="/api/auth/login?prompt=login"
                className={`font-semibold text-[16px] transition-colors duration-200 ${
                  pathname === "/api/auth/login?prompt=login" ? "text-[#7069FA]"
      : "text-[#5D6494] hover:text-[#3A416F]"
                }`}
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="bg-[#7069FA] hover:bg-[#6660E4] text-white w-[111px] h-[44px] flex items-center justify-center rounded-full transition-colors duration-200 text-[16px] font-semibold text-center"
              >
                <span className="px-4">Inscription</span>
              </Link>
            </>
          )}

          {user && (
            <Link
              href="/api/auth/logout?federated"
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-200 transition"
            >
              Se déconnecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
