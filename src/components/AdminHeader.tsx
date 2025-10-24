"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import GliftLoader from "@/components/ui/GliftLoader";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  return (
    <>
      {isLoggingOut && <GliftLoader />}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isSticky
            ? "bg-white shadow-[0_5px_21px_0_rgba(93,100,148,0.15)]"
            : "bg-[#FBFCFE]"
        }`}
      >
      <div className="max-w-[1152px] mx-auto px-4 md:px-0 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="w-[147px] flex items-center">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/logo_beta.svg"
              alt="Logo Glift Admin"
              width={147}
              height={35}
              priority
            />
          </Link>
        </div>

        {/* Admin Navigation */}
      <nav className="flex-1 flex justify-center gap-6 text-[16px] text-[#5D6494] font-semibold">
        <Link
          href="/admin/program"
          className={
            pathname === "/admin/program" || pathname?.startsWith("/admin/program?")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Programmes
        </Link>
        <Link
          href="/admin/program-store"
          className={
            pathname?.startsWith("/admin/program-store")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Store
        </Link>
        <Link
          href="/admin/slider"
          className={
            pathname?.startsWith("/admin/slider")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Slider
        </Link>
        <Link
          href="/admin/offer-shop"
          className={
            pathname?.startsWith("/admin/offer-shop")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Shop
        </Link>
        <Link
          href="/admin/content-blog"
          className={
            pathname?.startsWith("/admin/content-blog")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Blog
        </Link>
        <Link
          href="/admin/content-help"
          className={
            pathname?.startsWith("/admin/content-help")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Aide
        </Link>
        <Link
          href="/admin/users"
          className={
            pathname?.startsWith("/admin/users")
              ? "text-[#7069FA]"
              : "hover:text-[#3A416F]"
          }
        >
          Utilisateurs
        </Link>
      </nav>
        {/* User Zone */}
        <div className="relative ml-[18px]" ref={dropdownRef}>
          {user && (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-2 text-[#5D6494] hover:text-[#3A416F] text-[16px] font-semibold"
            >
              <div className="w-[44px] h-[44px] text-[25px] rounded-full bg-[#7069FA] text-white flex items-center justify-center font-semibold">
                {user.user_metadata?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              {user.user_metadata?.name || "Profil"}
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
          )}

          {dropdownOpen && (
            <div className="absolute right-[-20px] mt-2 w-[180px] bg-white rounded-[5px] shadow-[0px_5px_21px_0px_rgba(93,100,148,0.15)] py-2 z-50 border border-[#ECE9F1]">
              <div className="absolute -top-2 right-[18px] w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />
              <button
                onClick={() => {
                  if (isLoggingOut) {
                    return;
                  }
                  setDropdownOpen(false);
                  setIsLoggingOut(true);
                  router.push("/deconnexion");
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
