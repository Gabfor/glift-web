"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import CTAButton from "@/components/CTAButton"; // Verify exist
import { CurveOptionValue } from "@/constants/curveOptions";

// Re-using constants from the block if possible or redefining
const DEFAULT_GOAL_ICON_SRC = "/icons/trophy.svg";
const COMPLETED_GOAL_ICON_SRC = "/icons/trophy_gold.svg";
const DEFAULT_GOAL_RING_COLOR = "#7069FA";
const COMPLETED_GOAL_RING_COLOR = "#00D591";
const DEFAULT_GOAL_BASE_RING_COLOR = "#E9E7F3";
const EMPTY_GOAL_ICON_SRC = "/icons/trophy_grey.svg";
const EMPTY_GOAL_RING_COLOR = "#ECE9F1";

interface DashboardRecordCardProps {
    dateLabel: string;
    valueLabel: string; // e.g. "30 kg"
    typeLabel: string; // e.g. "Poids moyen"
    goalProgress: number | null; // 0-100 or null
    hasGoal: boolean;
    onActionClick: () => void;
    isFavorite?: boolean; // Little heart icon top right?
    iconSrc: string;
    onFavoriteToggle?: () => void;
    onCancelGoal?: () => void;
    isActive?: boolean;
}

export default function DashboardRecordCard({
    dateLabel,
    valueLabel,
    typeLabel,
    goalProgress,
    hasGoal,
    onActionClick,
    isFavorite = false,
    iconSrc,
    onFavoriteToggle,
    onCancelGoal,
    isActive = true,
}: DashboardRecordCardProps) {
    const [isHeartHovered, setIsHeartHovered] = useState(false);

    // Derived values
    const hasReachedGoal = goalProgress !== null && goalProgress >= 100;
    const goalIconSrc = hasGoal
        ? hasReachedGoal
            ? COMPLETED_GOAL_ICON_SRC
            : DEFAULT_GOAL_ICON_SRC
        : EMPTY_GOAL_ICON_SRC;

    const goalRingColor = hasGoal
        ? hasReachedGoal
            ? COMPLETED_GOAL_RING_COLOR
            : DEFAULT_GOAL_RING_COLOR
        : EMPTY_GOAL_RING_COLOR;

    const goalBaseRingColor = hasGoal ? DEFAULT_GOAL_BASE_RING_COLOR : EMPTY_GOAL_RING_COLOR;

    const GoalCircle = () => (
        <div className="relative h-[134px] w-[134px]">
            <svg viewBox="0 0 36 36" className="h-full w-full">
                <path
                    stroke={goalBaseRingColor}
                    strokeWidth="1.61"
                    fill="none"
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                />
                {hasGoal && goalProgress !== null && (
                    <path
                        stroke={goalRingColor}
                        strokeWidth="1.61"
                        strokeDasharray={`${goalProgress}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                        className="transition-[stroke-dasharray] duration-500 ease-out"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {hasGoal && goalProgress !== null ? (
                    <>
                        <span className={`text-[24px] font-bold leading-none transition-all duration-200 ${hasReachedGoal ? 'text-[#00D591]' : 'text-[#7069FA]'}`}>
                            {Math.round(goalProgress)}%
                        </span>
                        <span className="text-[10px] font-bold text-[#5D6494] leading-tight mt-1 max-w-[60px] transition-all duration-200">
                            de l&apos;objectif atteint
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-[24px] font-bold text-[#D7D4DC] leading-none transition-all duration-200">
                            0%
                        </span>
                        <span className="text-[10px] font-bold text-[#D7D4DC] leading-tight mt-1 max-w-[90px] transition-all duration-200">
                            Aucun objectif défini
                        </span>
                    </>
                )}
            </div>
            {/* Small Trophy Icon at top center of ring? Or kept separate? Mock shows text inside. Let's stick to text inside. */}
        </div>
    );

    // Date logic: 40x40 box, current date if empty/invalid
    const { dayStr, monthStr } = useMemo(() => {
        let label = dateLabel;
        // Check for empty or "Aucune donnée" (normalized)
        if (!label || label.toLowerCase().includes("aucune")) {
            const today = new Date();
            const day = today.getDate();
            const month = today.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
            // Capitalize month
            const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
            label = `${day} ${monthCap}`;
        }

        const parts = label.split(" ");
        return {
            dayStr: parts[0] || "",
            monthStr: parts[1] || ""
        };
    }, [dateLabel]);

    return (
        <div className="flex h-full w-full flex-col items-center justify-between rounded-[24px] border border-[#D7D4DC] bg-white p-[20px] shadow-sm select-none transition-all duration-200 ease-in-out">


            {/* Re-structuring header based on Mock 2 interpretation if I can? 
               User just asked for "icone en haut à gauche".
               I will put the icon at the top left.
               I will move the Date and Value/Label below.
            */}
            <div className="w-full flex flex-col gap-4">
                <div className="flex w-full items-start justify-between">
                    {/* Icon Top Left */}
                    <Image src={iconSrc} alt="" width={18} height={18} />

                    {/* Heart Top Right */}
                    <button
                        className="text-[#EF4F4E] transition-transform duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onFavoriteToggle) onFavoriteToggle();
                        }}
                        onMouseEnter={() => setIsHeartHovered(true)}
                        onMouseLeave={() => setIsHeartHovered(false)}
                    >
                        <Image
                            src={isFavorite ? "/icons/coeur_red.svg" : (isHeartHovered ? "/icons/coeur_hover.svg" : "/icons/coeur_grey.svg")}
                            alt="Favori"
                            width={18}
                            height={18}
                            className="transition-opacity duration-200"
                        />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Box */}
                    <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#ECE9F1] w-[40px] h-[40px] px-0 py-0 min-w-0 transition-all duration-200">
                        <span className="text-[13px] font-bold text-[#3A416F] leading-none text-center transition-all duration-200">
                            {dayStr}
                        </span>
                        <span className="text-[10px] font-semibold text-[#C2BFC6] leading-none mt-1 text-center transition-all duration-200">
                            {monthStr}
                        </span>
                    </div>

                    {/* Value & Type */}
                    <div className="flex flex-col">
                        <span className="text-[22px] font-bold text-[#3A416F] leading-none transition-all duration-200">{valueLabel}</span>
                        <span className={`transition-all duration-200 ${isActive ? 'text-[11px]' : 'text-[9px]'} font-semibold text-[#3A416F]`}>{typeLabel}</span>
                    </div>
                </div>
            </div>

            {/* Center Circle */}
            <div className="flex-1 flex items-center justify-center transition-all duration-200">
                <GoalCircle />
            </div>

            {/* Footer Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onActionClick();
                }}
                className={`group flex items-center justify-center gap-1 rounded-full border border-[#7069FA] px-5 py-3 transition-all duration-200 ${isActive ? 'text-[12px]' : 'text-[10px]'} font-bold text-[#7069FA] hover:bg-[#7069FA] hover:text-white w-full`}
            >
                <span>{hasGoal ? "Voir mon objectif" : "Définir un objectif"}</span>
                <Image
                    src="/icons/arrow_purple.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="transition-all group-hover:brightness-0 group-hover:invert"
                />
            </button>
            <button
                className={`mt-2 text-[10px] font-semibold transition-colors ${hasGoal
                    ? "text-[#7069FA] hover:text-[#6660E4] cursor-pointer"
                    : "text-[#D7D4DC] cursor-not-allowed"
                    }`}
                disabled={!hasGoal}
                onClick={(e) => {
                    e.stopPropagation();
                    if (hasGoal && onCancelGoal) onCancelGoal();
                }}
            >
                Annuler mon objectif
            </button>
        </div>
    );
}
