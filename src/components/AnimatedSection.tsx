"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  isFirst = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  isFirst?: boolean;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sur mobile : le premier bloc s'affiche immédiatement pour éviter le vide sous le header
  // Sur desktop : on conserve exactement l'animation d'origine au scroll (y: 30, duration: 0.6, amount: 0.15)
  const shouldAnimateImmediately = isMobile && isFirst;

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 15 : 30 }}
      animate={shouldAnimateImmediately ? { opacity: 1, y: 0 } : undefined}
      whileInView={!shouldAnimateImmediately ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: isMobile ? 0.35 : 0.6,
        ease: "easeOut",
        delay: shouldAnimateImmediately ? 0.05 : delay,
      }}
      viewport={{
        once: true,
        amount: isMobile ? 0 : 0.15,
        margin: isMobile ? "100px 0px 0px 0px" : undefined,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
