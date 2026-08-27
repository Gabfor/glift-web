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
            title={
                <div className="flex flex-col items-center gap-3">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.5774 7.5C22.7321 5.5 25.2679 5.5 26.4226 7.5L43.7428 37.5C44.8975 39.5 43.6296 42 41.3202 42H6.6798C4.3704 42 3.10246 39.5 4.25716 37.5L21.5774 7.5Z" fill="#7069FA" />
                        <path d="M24 18V27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="24" cy="33" r="2" fill="white" />
                    </svg>
                    <span>Exercice bloqué</span>
                </div>
            }
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
                    En cliquant sur <span className="text-[#3A416F] font-bold">« Débloquer »</span> tu seras redirigé vers ton compte où tu pourras choisir la formule d’abonnement Premium qui donne accès à un stockage illimité et débloquera ainsi cet exercice.
                </p>
                <p>
                    En cliquant sur <span className="text-[#3A416F] font-bold">« Annuler »</span> aucun changement ne sera appliqué à ton abonnement et tu pourras continuer à utiliser gratuitement un seul entraînement de 10 exercices maximum.
                </p>
            </div>
        </Modal>
    );
}
