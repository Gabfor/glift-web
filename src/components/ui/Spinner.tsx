// src/components/ui/Spinner.tsx
'use client';

import React from 'react';

type NamedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SpinnerProps = {
  /** Taille en pixels OU alias ('xs'|'sm'|'md'|'lg'|'xl') */
  size?: number | NamedSize;
  /** Épaisseur du trait */
  strokeWidth?: number;
  /** Classes utilitaires supplémentaires */
  className?: string;
  /** Libellé a11y (ARIA) */
  ariaLabel?: string;
};

const SIZE_PX: Record<NamedSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

export default function Spinner({
  size = 'sm',
  strokeWidth = 4,
  className = '',
  ariaLabel = 'Chargement',
}: SpinnerProps) {
  const px = typeof size === 'number' ? size : SIZE_PX[size];

  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      width={px}
      height={px}
      role="status"
      aria-label={ariaLabel}
      fill="none"
    >
      {/* anneau de fond (25% d'opacité) */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity="0.25"
      />
      {/* arc de premier plan */}
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
