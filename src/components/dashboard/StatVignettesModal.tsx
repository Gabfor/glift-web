"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";
import CTAButton from "@/components/CTAButton";
import StatVignettesFields from "./StatVignettesFields";
import { type StatVignetteKey } from "@/constants/statVignettes";

interface StatVignettesModalProps {
  open: boolean;
  onClose: () => void;
  vignettes: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey];
  onSave: (
    newVignettes: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey]
  ) => Promise<void>;
  weightUnit?: "kg" | "lb";
}

export default function StatVignettesModal({
  open,
  onClose,
  vignettes,
  onSave,
  weightUnit = "kg",
}: StatVignettesModalProps) {
  const [selected, setSelected] = useState<
    [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey]
  >(vignettes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(vignettes);
    }
  }, [open, vignettes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/icons/reglages_purple.svg"
            alt="Réglage des vignettes"
            width={37}
            height={35}
            priority
          />
          <span>Réglage des vignettes</span>
        </div>
      }
      closeDisabled={isSaving}
      contentClassName="max-w-[500px]"
      footerWrapperClassName="!mt-[30px]"
      footer={
        <div className="flex justify-center gap-3 sm:gap-4 w-full">
          <CTAButton
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 w-full sm:w-auto sm:flex-initial"
          >
            Annuler
          </CTAButton>
          <CTAButton
            type="button"
            variant="active"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="flex-1 w-full sm:w-auto sm:flex-initial"
          >
            Enregistrer
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant="info"
        title="Personnalise tes vignettes"
        description="Choisis la statistique à afficher dans chacune des 4 vignettes de ton tableau de bord."
        className="mb-6"
      />

      <StatVignettesFields
        values={selected}
        onChange={setSelected}
        weightUnit={weightUnit}
      />
    </Modal>
  );
}
