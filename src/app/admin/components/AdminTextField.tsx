"use client";

import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AdminTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
}

export function AdminTextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  containerClassName,
  labelClassName,
  ...props
}: AdminTextFieldProps) {
  return (
    <div className={cn("flex flex-col", containerClassName)}>
      <label className={cn("text-[16px] text-[#3A416F] font-bold mb-[5px]", labelClassName)}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("input-admin", className)}
        {...props}
      />
    </div>
  );
}
