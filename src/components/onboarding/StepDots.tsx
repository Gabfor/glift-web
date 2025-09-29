"use client";

import clsx from "clsx";

export type StepDotsProps = {
  totalSteps?: number;
  currentStep?: number;
  className?: string;
};

export default function StepDots({
  totalSteps = 3,
  currentStep = 1,
  className,
}: StepDotsProps) {
  if (totalSteps <= 1) {
    return null;
  }

  return (
    <div className={clsx("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;

        return (
          <span
            key={step}
            aria-hidden
            className={clsx(
              "h-[9px] w-[9px] rounded-full transition-colors duration-200",
              isActive ? "bg-[#A1A5FD]" : "bg-[#ECE9F1]"
            )}
          />
        );
      })}
    </div>
  );
}
