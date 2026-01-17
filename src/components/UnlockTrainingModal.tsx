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
            title="Entraînement bloqué"
            onClose={onClose}
            footer={
                <div className="flex justify-center gap-4">
                    <CTAButton variant="secondary" onClick={onClose}>
                        Annuler
                    </CTAButton>
                    <CTAButton onClick={onUnlock}>
                        Débloquer
                    </CTAButton>
                </div>
            }
        >
            <ModalMessage
                variant="info"
                title="Pourquoi cet entraînement est-il bloqué ?"
                description="Cet entraînement est bloqué car votre formule d'abonnement actuelle vous limite à un seul entraînement utilisable."
                className="mb-6"
            />

            <div className="space-y-4 text-[14px] font-semibold text-[#5D6494] leading-relaxed">
                <p>
                    En cliquant sur <span className="text-[#3A416F]">« Débloquer »</span> vous serez redirigé vers votre compte où vous pourrez choisir la formule d'abonnement Premium qui donne accès à un stockage illimité et débloquera ainsi cet entraînement.
                </p>
                <p>
                    En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à votre abonnement et vous pourrez continuer à utiliser gratuitement un seul entraînement de 10 exercices maximum.
                </p>
            </div>
        </Modal>
    );
}
