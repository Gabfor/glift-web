"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type IconCheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  size?: number;
  containerClassName?: string;
  isAdmin?: boolean;
};

const IconCheckbox = React.forwardRef<HTMLInputElement, IconCheckboxProps>(
  ({ size = 16, containerClassName, className, isAdmin, ...props }, ref) => {
    const pathname = usePathname();
    const isPageAdmin =
      isAdmin ??
      (pathname?.startsWith("/admin") ||
        (typeof window !== "undefined" && window.location.hostname.startsWith("admin.")));

    const checkedSrc = isPageAdmin
      ? "/icons/admin_checkbox_checked.svg"
      : "/icons/checkbox_checked.svg";

    return (
      <span
        className={cn("relative inline-flex shrink-0", containerClassName)}
        style={{ width: size, height: size }}
      >
        <input
          {...props}
          ref={ref}
          type="checkbox"
          className={cn(
            "peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0",
            className
          )}
        />
        <Image
          src="/icons/checkbox_unchecked.svg"
          alt=""
          width={size}
          height={size}
          className="pointer-events-none absolute inset-0 h-full w-full peer-checked:hidden"
        />
        <Image
          src={checkedSrc}
          alt=""
          width={size}
          height={size}
          className="pointer-events-none absolute inset-0 hidden h-full w-full peer-checked:block"
        />
      </span>
    );
  }
);

IconCheckbox.displayName = "IconCheckbox";

export { IconCheckbox };
