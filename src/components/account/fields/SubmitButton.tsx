"use client";

import CTAButton from "@/components/CTAButton";

type Props = {
  loading: boolean;
  disabled: boolean;
  label?: string;
  onClick?: () => void;
};

export default function SubmitButton({
  loading,
  disabled,
  label = "Enregistrer mes informations",
  onClick,
}: Props) {
  const isDisabled = disabled && !loading;

  return (
    <div className="w-full flex justify-center mt-3 mb-8">
      <CTAButton
        type="submit"
        onClick={onClick}
        disabled={isDisabled}
        loading={loading}
        variant={isDisabled ? "inactive" : "active"}
        className="font-bold"
      >
        {label}
      </CTAButton>
    </div>
  );
}
