import clsx from "clsx";

export type StepIndicatorProps = {
  totalSteps: number;
  currentStep: number;
  className?: string;
};

const StepIndicator = ({ totalSteps, currentStep, className }: StepIndicatorProps) => {
  if (totalSteps <= 1) {
    return null;
  }

  return (
    <div className={clsx("mt-6 flex items-center justify-center gap-2", className)}>
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
};

export default StepIndicator;
