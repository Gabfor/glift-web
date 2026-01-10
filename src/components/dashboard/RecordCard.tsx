"use client";

import Image from "next/image";
import React from "react";

interface RecordCardProps {
    value: string;
    unit: string;
    label: string;
    date: string;
    onClick?: () => void;
}

export default function RecordCard({
    value,
    unit,
    label,
    date,
    onClick,
}: RecordCardProps) {
    return (
        <div
            className="flex h-[240px] w-[200px] flex-col items-center justify-center rounded-[20px] bg-white px-4 text-center shadow-lg"
            onClick={onClick}
        >
            <div className="mb-4">
                <Image
                    src="/icons/trophy_gold.svg" /* Using generic trophy or maybe specific icon? Mock showed trophy/icon at top sometimes? Original carousel card has an image. Mock shows clean card with big numbers. Let's stick to Big Numbers as per "Record" design in current block */
                    alt="Record"
                    width={40}
                    height={40}
                    className="h-10 w-10 opacity-20" /* subtle icon or similar? The mock actually shows the "Goal" circle in one card, and "Record" in another. Wait, the user request says "Zone 2: Records AND Objectives/Goals". The Carousel allows passing from one record to another.
          
          Let's look at the Mock again (uploaded_image_1768035721921.jpg).
          Zone 2 (Right side) shows:
          - A card with "19 Nov" "30 kg Poids moyen".
          - A BIG circular progress bar "72% de l'objectif atteint".
          - "Voir mon objectif ->" button.
          
          Another card in the carousel (presumably) shows:
          - "08 Jan" "12 Rép. Répétition maximum".
          - "0% Aucun objectif défini".
          - "Définir un objectif ->".
          
          So the Card needs to display:
          1. Header: Date + Value + Unit + Label.
          2. Content: The Goal Ring/Circle.
          3. Footer: Action button.
          
          I need to adapt ReacordCard to match this complex content, not just "Title".
          Actually, I should probably build a `CarouselCard` that takes children or specific props for this rich content.
          
          Let's make `RecordCard` a detailed component that renders exactly what's in the mock.
          */
                />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-[30px] font-bold text-[#3A416F]">{value}</span>
                <span className="text-[16px] font-bold text-[#3A416F]">{unit}</span>
            </div>
            <p className="mt-1 text-[12px] font-bold text-[#3A416F]">{label}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#5D6494]">{date}</p>
        </div>
    );
}
