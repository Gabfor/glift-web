"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";
import CTAButton from "@/components/CTAButton";

interface UnlockTrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: () => void;
}

export default function UnlockTrainingModal({
    isOpen,
    onClose,
    onUnlock,
}: UnlockTrainingModalProps) {
    return (
        <Modal
            open={isOpen}
            title="Exercice bloqué"
            onClose={onClose}
            footer={
                <div className="flex justify-center gap-3 sm:gap-4 w-full">
                    <CTAButton variant="secondary" onClick={onClose} className="flex-1 w-full sm:w-auto sm:flex-initial">
                        Annuler
                    </CTAButton>
                    <CTAButton onClick={onUnlock} className="flex-1 w-full sm:w-auto sm:flex-initial">
                        Débloquer
                    </CTAButton>
                </div>
            }
        >
            <ModalMessage
                variant="info"
                title="Pourquoi cet exercice est-il bloqué ?"
                description="Cet exercice est bloqué car ta formule d’abonnement actuelle te limite à 10 exercices utilisables."
                className="mb-6"
            />

            <div className="space-y-4 text-[14px] font-semibold text-[#5D6494] leading-relaxed">
                <p>
                    En cliquant sur <span className="text-[#3A416F]">« Débloquer »</span> tu seras redirigé vers ton compte où tu pourras choisir la formule d’abonnement Premium qui donne accès à un stockage illimité et débloquera ainsi cet exercice.
                </p>
                <p>
                    En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à ton abonnement et tu pourras continuer à utiliser gratuitement un seul entraînement de 10 exercices maximum.
                </p>
            </div>
        </Modal>
    );
}
