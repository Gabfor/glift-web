"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GliftLoaderProps {
  className?: string;
  onShow?: () => void;
}

export default function GliftLoader({ className, onShow }: GliftLoaderProps) {
  const hasTriggeredShowRef = useRef(false);

  useEffect(() => {
    if (!onShow || hasTriggeredShowRef.current) {
      return;
    }

    hasTriggeredShowRef.current = true;
    onShow();
  }, [onShow]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-white px-4 text-center",
        className,
      )}
    >
      <div className="flex flex-col items-center -translate-y-[100px]">
        <Image
          src="/logo-glift.svg"
          alt="Glift"
          width={150}
          height={57}
          className="mb-6"
        />
        <div className="relative h-[3px] w-[100px] overflow-hidden rounded-full bg-gray-200">
          <div className="animate-bar-loader absolute inset-0 bg-[#7069FA]" />
        </div>
      </div>
      <style jsx>{`
        @keyframes bar-loader {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(-30%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-bar-loader {
          width: 50%;
          animation: bar-loader 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
