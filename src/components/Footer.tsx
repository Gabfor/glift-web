"use client";

import { useUser } from "@/context/UserContext";
import FooterPublic from "./FooterPublic";
import FooterLogged from "./FooterLogged";

export default function Footer({ className }: { className?: string }) {
  const { isAuthenticated } = useUser();

  return isAuthenticated ? <FooterLogged className={className} /> : <FooterPublic className={className} />;
}
