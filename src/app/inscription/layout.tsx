import type { ReactNode } from 'react';
import ProgressSteps from '@/components/onboarding/StepDots';

export default function InscriptionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="min-h-screen bg-[#FBFCFE]">
      <ProgressSteps />
      <div className="flex justify-center px-4 pb-[40px]">{children}</div>
    </section>
  );
}
