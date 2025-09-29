"use client";

import { useUser } from "@/context/UserContext";
import FooterPublic from "./FooterPublic";
import FooterLogged from "./FooterLogged";

export default function Footer() {
  const { isAuthenticated } = useUser();

  return isAuthenticated ? <FooterLogged /> : <FooterPublic />;
}
