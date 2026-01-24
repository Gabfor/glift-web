"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";
import CTAButton from "@/components/CTAButton";

interface AddExerciseLockedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: () => void;
}

export default function AddExerciseLockedModal({
    isOpen,
    onClose,
    onUnlock,
}: AddExerciseLockedModalProps) {
    return (
        <Modal
            open={isOpen}
            title="Ajout d’exercice impossible"
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
                title="Pourquoi est-il impossible d’ajouter un exercice ?"
                description="L’ajout d’un exercice est impossible car votre formule d’abonnement actuelle vous limite à 10 exercices utilisables."
                className="mb-6"
            />

            <div className="space-y-4 text-[14px] font-medium text-[#5D6494] leading-[1.6]">
                <p>
                    En cliquant sur <span className="font-bold text-[#3A416F]">« Débloquer »</span> vous serez redirigé vers votre compte où vous pourrez choisir la formule d’abonnement Premium qui donne accès à un stockage illimité et vous permettra d’ajouter de nouveaux exercices.
                </p>
                <p>
                    En cliquant sur <span className="font-bold text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à votre abonnement et vous pourrez continuer à utiliser gratuitement un seul entraînement de 10 exercices maximum.
                </p>
            </div>
        </Modal>
    );
}
