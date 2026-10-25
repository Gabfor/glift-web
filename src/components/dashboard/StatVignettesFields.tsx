"use client";

import { useMemo } from "react";
import clsx from "clsx";
import DropdownField from "@/components/account/fields/DropdownField";
import InfoTooltipAdornment from "@/components/account/fields/InfoTooltipAdornment";
import {
  STAT_VIGNETTE_OPTIONS,
  type StatVignetteKey,
} from "@/constants/statVignettes";

interface StatVignettesFieldsProps {
  values: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey];
  onChange: (
    newValues: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey]
  ) => void;
  weightUnit?: "kg" | "lb";
  gapClassName?: string;
  hideHelperText?: boolean;
  showTooltips?: boolean;
  placement?: "bottom" | "top" | "auto";
}

const VIGNETTE_LABELS = [
  "1ère vignette",
  "2ème vignette",
  "3ème vignette",
  "4ème vignette",
];

export default function StatVignettesFields({
  values,
  onChange,
  weightUnit = "kg",
  gapClassName = "gap-[20px]",
  hideHelperText = true,
  showTooltips = false,
  placement,
}: StatVignettesFieldsProps) {
  const optionsWithUnit = useMemo(() => {
    const isLb = weightUnit === "lb";
    return STAT_VIGNETTE_OPTIONS.map((opt) => {
      if (opt.value === "weight") {
        return {
          ...opt,
          label: isLb ? "Lb soulevés en moyenne" : "Kg soulevés en moyenne",
        };
      }
      if (opt.value === "volume") {
        return {
          ...opt,
          label: isLb ? "Volume total soulevé (lb)" : "Volume total soulevé (kg)",
        };
      }
      return opt;
    });
  }, [weightUnit]);

  const handleSelect = (index: number, nextKey: string) => {
    const key = nextKey as StatVignetteKey;
    const next: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey] = [
      ...values,
    ];
    // Règle anti-doublon intelligente : si la stat est déjà choisie sur une autre vignette, on intervertit
    const existingIndex = next.findIndex((v, i) => i !== index && v === key);
    if (existingIndex !== -1) {
      next[existingIndex] = values[index];
    }
    next[index] = key;
    onChange(next);
  };

  return (
    <div className={clsx("flex flex-col w-full", gapClassName)}>
      {values.map((selectedKey, index) => (
        <div key={index} className="w-full">
          <DropdownField
            label={VIGNETTE_LABELS[index]}
            placeholder="Sélectionnez une statistique"
            selected={selectedKey}
            onSelect={(val) => handleSelect(index, val)}
            options={optionsWithUnit.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            touched={false}
            setTouched={() => {}}
            clearable={false}
            sortStrategy="none"
            width="w-full"
            menuMaxHeightClassName="max-h-[220px] sm:max-h-[250px]"
            hideHelperText={hideHelperText}
            placement={placement ?? (index >= 2 ? "top" : "auto")}
            endAdornment={
              showTooltips ? (
                <InfoTooltipAdornment
                  message={`Ce réglage détermine la statistique affichée dans la ${VIGNETTE_LABELS[index]} de ton tableau de bord.`}
                  ariaLabel={`Plus d’informations sur la ${VIGNETTE_LABELS[index]}`}
                />
              ) : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
