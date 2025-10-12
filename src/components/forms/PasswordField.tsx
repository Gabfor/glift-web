"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export { PASSWORD_MIN_LENGTH, getPasswordValidationState } from "@/utils/password";

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  labelAction?: React.ReactNode;
  successMessage?: string;
  errorMessage?: string;
  externalError?: string | null;
  validate?: (value: string) => boolean;
  containerClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  messageContainerClassName?: string;
  criteriaRenderer?: (context: { isFocused: boolean; isValid: boolean; value: string }) => React.ReactNode;
  blurDelay?: number;
  defaultShowPassword?: boolean;
  statusOverride?: "neutral" | "success" | "error";
}

export function PasswordField({
  value,
  onChange,
  id = "password",
  name = "password",
  label = "Mot de passe",
  placeholder = "Mot de passe",
  labelAction,
  successMessage = "Mot de passe valide",
  errorMessage = "Mot de passe invalide",
  externalError,
  validate,
  containerClassName,
  inputWrapperClassName,
  inputClassName,
  messageContainerClassName,
  criteriaRenderer,
  blurDelay = 0,
  defaultShowPassword = false,
  statusOverride,
  onBlur,
  onFocus,
  onKeyDown,
  ...rest
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(defaultShowPassword);
  const [touched, setTouched] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const validationResult = React.useMemo(() => {
    if (!validate) return { isValid: true } as const;
    return { isValid: validate(value) } as const;
  }, [validate, value]);

  const hasValue = value.trim() !== "";
  const canValidate = typeof validate === "function";
  const isValid = validationResult.isValid;
  const showSuccessBase = canValidate && touched && !focused && isValid && !externalError;
  const showInternalError = canValidate && touched && !focused && hasValue && !isValid;
  const showExternalError = Boolean(externalError) && !focused;
  const showErrorBase = showInternalError || showExternalError;

  let showSuccess = showSuccessBase;
  let showError = showErrorBase;
  let message: string | null = null;

  if (statusOverride === "neutral") {
    showSuccess = false;
    showError = false;
    message = null;
  } else if (statusOverride === "success") {
    showSuccess = true;
    showError = false;
    message = successMessage;
  } else if (statusOverride === "error") {
    showSuccess = false;
    showError = true;
    message = externalError ?? errorMessage;
  } else {
    if (showExternalError) {
      message = externalError ?? null;
    } else if (showSuccess) {
      message = successMessage;
    } else if (showInternalError) {
      message = errorMessage;
    } else {
      message = null;
    }
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (blurDelay > 0) {
      setTimeout(() => setFocused(false), blurDelay);
    } else {
      setFocused(false);
    }
    onBlur?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Enter") {
      event.preventDefault();
      setTouched(true);
      setFocused(false); // masque le menu de critères
      (event.currentTarget as HTMLInputElement).blur(); // force la validation finale
    }
  };

  const criteriaContent =
    focused && criteriaRenderer?.({ isFocused: focused, isValid, value });

  return (
    <div className={cn("flex w-full flex-col", containerClassName)}>
      <label htmlFor={id} className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
        <span className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {labelAction}
        </span>
      </label>
      <div className={cn("relative", inputWrapperClassName)}>
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border",
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
        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          onMouseDown={(event) => event.preventDefault()}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          <Image
            src={showPassword ? "/icons/masque_defaut.svg" : "/icons/visible_defaut.svg"}
            alt={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            width={25}
            height={25}
            className="h-[25px] w-[25px]"
          />
        </button>
      </div>
      {criteriaContent}
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
