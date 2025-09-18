'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { stepsForPlan } from '@/lib/onboarding';

type Props = { className?: string };

export default function StepDots({ className = '' }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const steps = stepsForPlan(new URLSearchParams(searchParams?.toString() ?? ''));
  const currentIdx = Math.max(
    0,
    steps.findIndex((s) => (pathname ?? '') === s.href.split('?')[0])
  );

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="flex items-center justify-center gap-[8px]">
        {steps.map((_, i) => {
          const active = i === currentIdx;
          return (
            <span
              key={i}
              aria-current={active ? 'step' : undefined}
              aria-label={`Étape ${i + 1} sur ${steps.length}${active ? ' (en cours)' : ''}`}
              className="block w-[9px] h-[9px] rounded-full shrink-0 transition-colors"
              style={{ backgroundColor: active ? '#A1A5FD' : '#ECE9F1' }}
            />
          );
        })}
      </div>
    </div>
  );
}
