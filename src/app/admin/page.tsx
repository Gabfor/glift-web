"use client";

import Link from "next/link";

const adminLinks = [
  { title: "Accueil", href: "/admin/home", visual: "home" },
  { title: "Programmes", href: "/admin/program", visual: "program" },
  { title: "Cartes Store", href: "/admin/program-store", visual: "store" },
  { title: "Slider", href: "/admin/slider", visual: "slider" },

  { title: "Cartes Shop", href: "/admin/offer-shop", visual: "shop" },
  { title: "Blog", href: "/admin/blog", visual: "blog" },
  { title: "Aide", href: "/admin/help", visual: "help" },
  { title: "Utilisateurs", href: "/admin/users", visual: "users" },
  { title: "Paramètres", href: "/admin/settings", visual: "settings" },
];

function CardVisual({ type }: { type: string }) {
  const base = "bg-[#F4F5FE] rounded";
  switch (type) {
    case "program":
    case "home":
      if (type === "home") {
        return (
          <div className="flex flex-col gap-1.5 w-[85%]">
            {/* Header */}
            <div className="flex justify-between items-center w-full mb-1">
              <div className={`${base} w-[20%] h-[6px]`} />
              <div className="flex gap-1">
                <div className={`${base} w-[25px] h-[6px]`} />
                <div className={`${base} w-[25px] h-[6px]`} />
              </div>
            </div>
            {/* Hero */}
            <div className={`${base} w-full h-[14px]`} />
            {/* 2 Cols */}
            <div className="flex gap-1.5 w-full">
              <div className={`${base} w-1/2 h-[12px]`} />
              <div className={`${base} w-1/2 h-[12px]`} />
            </div>
            {/* 4 Cols */}
            <div className="flex gap-1.5 w-full">
              <div className={`${base} flex-1 h-[12px]`} />
              <div className={`${base} flex-1 h-[12px]`} />
              <div className={`${base} flex-1 h-[12px]`} />
              <div className={`${base} flex-1 h-[12px]`} />
            </div>
          </div>
        );
      }
    case "help":
      return (
        <>
          <div className={`${base} w-[60px] h-[8px] mb-3`} />
          <div className={`${base} w-[80%] h-[10px] mb-1`} />
          <div className={`${base} w-[80%] h-[10px] mb-1`} />
          <div className={`${base} w-[80%] h-[10px]`} />
        </>
      );
    case "store":
    case "shop":
      return (
        <div className="grid grid-cols-4 gap-1 w-[90%]">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`${base} h-[26px] col-span-1"}`}
            />
          ))}
        </div>
      );

    case "slider":
      return (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex gap-2 w-[85%] mb-2">
            <div className={`${base} flex-1 h-[32px]`} />
            <div className={`${base} flex-1 h-[32px]`} />
          </div>
          <div className="flex gap-1">
            <div className="w-[3px] h-[3px] rounded-full bg-[#D7D4DC]" />
            <div className="w-[3px] h-[3px] rounded-full bg-[#D7D4DC]" />
            <div className="w-[3px] h-[3px] rounded-full bg-[#D7D4DC]" />
          </div>
        </div>
      );

    case "blog":
      return (
        <>
          <div className={`${base} w-[60px] h-[8px] mb-3`} />
          <div className={`${base} w-[85%] h-[10px] mb-1`} />
          <div className={`${base} w-[85%] h-[10px] mb-1`} />
          <div className={`${base} w-[85%] h-[10px]`} />
        </>
      );
    case "users":
      return (
        <>
          <div className={`${base} w-[60px] h-[8px] mb-3`} />
          <div className={`${base} w-[85%] h-[10px] mb-1`} />
          <div className={`${base} w-[85%] h-[10px] mb-1`} />
          <div className={`${base} w-[85%] h-[10px]`} />
        </>
      );
    case "settings":
      return (
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#F4F5FE]"
        >
          <path
            d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.04 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[956px] mx-auto">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Admin
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-6">
          {adminLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="group w-[172px] h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-center transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                {link.title}
              </span>
              <CardVisual type={link.visual} />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
