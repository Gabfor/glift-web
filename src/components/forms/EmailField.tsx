"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());

export interface EmailFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  successMessage?: string;
  hideSuccessMessage?: boolean;
  errorMessage?: string;
  externalError?: string | null;
  showExternalErrorWhenEmpty?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  messageContainerClassName?: string;
  onStateChange?: (state: "idle" | "success" | "error") => void;
}

export function EmailField({
  value,
  onChange,
  id = "email",
  name = "email",
  label = "Email",
  placeholder = "john.doe@email.com",
  successMessage = "Merci, cet email sera ton identifiant de connexion",
  hideSuccessMessage = false,
  errorMessage = "Format d’adresse invalide",
  externalError,
  showExternalErrorWhenEmpty = false,
  containerClassName,
  inputClassName,
  messageContainerClassName,
  onStateChange,
  onBlur,
  onFocus,
  ...rest
}: EmailFieldProps) {
  const [touched, setTouched] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const previousStateRef = React.useRef<"idle" | "success" | "error">();

  const trimmedValue = value.trim();
  const hasValue = trimmedValue !== "";
  const isValid = isValidEmail(value);
  const showSuccess =
    !hideSuccessMessage && touched && !focused && isValid && !externalError;
  const showInternalError = touched && !focused && hasValue && !isValid;
  const showExternalError =
    Boolean(externalError) && !focused && (hasValue || showExternalErrorWhenEmpty);
  const showError = showInternalError || showExternalError;

  const currentState: "idle" | "success" | "error" = showError
    ? "error"
    : showSuccess
    ? "success"
    : "idle";

  React.useEffect(() => {
    if (previousStateRef.current !== currentState) {
      previousStateRef.current = currentState;
      onStateChange?.(currentState);
    }
  }, [currentState, onStateChange]);

  const message = showExternalError
    ? externalError
    : showSuccess
    ? successMessage
    : showInternalError
    ? errorMessage
    : null;

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <div className={cn("flex w-full flex-col", containerClassName)}>
      <label htmlFor={id} className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="email"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border",
          showError
            ? "border-[#EF4444]"
            : showSuccess
            ? "border-[#00D591]"
            : "border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]",
          inputClassName,
        )}
        aria-invalid={showError}
        aria-describedby={`${id}-message`}
        {...rest}
      />
      <div
        id={`${id}-message`}
        className={cn(
          "mt-[5px] text-[13px] font-medium min-h-[20px]",
          message ? (showError ? "text-[#EF4444]" : showSuccess ? "text-[#00D591]" : undefined) : undefined,
          messageContainerClassName,
        )}
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}
