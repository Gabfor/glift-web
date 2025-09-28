"use client";

import Link from "next/link";

const adminLinks = [
  { title: "Programmes", href: "/admin/program", visual: "program" },
  { title: "Cartes Store", href: "/admin/program-store", visual: "store" },
  { title: "Slider", href: "/admin/slider", visual: "slider" },
  { title: "Cartes Shop", href: "/admin/offer-shop", visual: "shop" },
  { title: "Blog", href: "/admin/blog", visual: "blog" },
  { title: "Aide", href: "/admin/help", visual: "help" },
  { title: "Utilisateurs", href: "/admin/users", visual: "users" },
];

function CardVisual({ type }: { type: string }) {
  const base = "bg-[#F4F5FE] rounded";
  switch (type) {
    case "program":
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
        <>
          <div className="flex gap-2 w-[80%] mb-2">
            <div className={`${base} w-[45%] h-[28px]`} />
            <div className={`${base} w-[45%] h-[28px]`} />
          </div>
          <div className="flex justify-center gap-1 mt-1">
            <div className={`${base} w-[6px] h-[6px]`} />
            <div className={`${base} w-[6px] h-[6px]`} />
            <div className={`${base} w-[6px] h-[6px]`} />
          </div>
        </>
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
              className="group w-[172px] h-[172px] rounded-[5px] bg-white overflow-hidden flex flex-col shadow-glift hover:shadow-glift-hover transition-all duration-300 items-center justify-center transform hover:-translate-y-1"
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
