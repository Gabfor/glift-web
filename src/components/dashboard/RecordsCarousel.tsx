"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RecordsCarouselProps {
    slides: Array<{
        key: string | number;
        content: React.ReactNode;
        onClick?: () => void;
    }>;
    offsetRadius?: number;
    showNavigation?: boolean;
    goToSlide?: number;
    onIndexChange?: (index: number) => void;
}

export default function RecordsCarousel({
    slides,
    offsetRadius = 2,
    showNavigation = false,
    goToSlide: controlledGoToSlide,
    onIndexChange,
}: RecordsCarouselProps) {
    const [index, setIndex] = useState(controlledGoToSlide ?? 0);

    useEffect(() => {
        if (controlledGoToSlide !== undefined) {
            setIndex(controlledGoToSlide);
        }
    }, [controlledGoToSlide]);

    const getSlideStyles = (i: number) => {
        const total = slides.length;
        let distance = i - index;

        // Handle wrapping logic
        if (distance > total / 2) distance -= total;
        if (distance < -total / 2) distance += total;

        // Determine type based on distance
        let type = "hidden";
        if (distance === 0) type = "active";
        else if (distance === -1 || (total > 2 && distance === total - 1)) type = "prev";
        else if (distance === 1 || (total > 2 && distance === -(total - 1))) type = "next";

        // Dimensions
        // Container: 270px. Card: 220px.
        // Active: Scale 1 (339px h). Centered in 270px.
        // Prev/Next: Scale ~0.88 (299px h). Aligned to edges.

        // Scale 0.882 results in height 299px from 339px.
        const scale = type === "active" ? 1 : 0.882;
        const opacity = 1;
        const zIndex = type === "active" ? 10 : 5;
        const isVisible = type !== "hidden";

        // Positioning
        // Base setup: left: 50%, x: -50% (Centers the card)
        // Active: No extra offset.
        // Prev: Needs to move Left. 
        //   Target: Left edge at 0px.
        //   Card Width Scaled: 220 * 0.882 = 194px.
        //   Card Center relative to Container Left: 194 / 2 = 97px.
        //   Container Center: 135px.
        //   Offset needed: 97 - 135 = -38px.
        // Next: Needs to move Right.
        //   Target: Right edge at 270px.
        //   Card Center relative to Container Left: 270 - 97 = 173px.
        //   Offset needed: 173 - 135 = +38px.

        let xOffset = 0;
        if (type === "prev") xOffset = -38;
        if (type === "next") xOffset = 38;

        return {
            left: "50%",
            x: `calc(-50% + ${xOffset}px)`,
            y: "-50%",
            width: "220px",
            height: "339px",
            scale,
            opacity: isVisible ? opacity : 0,
            zIndex,
            display: isVisible ? "block" : "none",
        };
    };

    return (
        <div className="relative h-full w-full perspective-1000">
            {/* perspective class might need tailwind config or manual style if not present, but usually irrelevant for 2D transforms pretending to be 3D */}
            <style jsx>{`
        .record-carousel-container {
            perspective: 1000px;
        }
      `}</style>
            <div className="record-carousel-container relative w-full h-full">
                {slides.map((slide, i) => {
                    const styles = getSlideStyles(i);
                    return (
                        <motion.div
                            key={slide.key}
                            className="absolute top-1/2 origin-center cursor-pointer will-change-transform rounded-[24px]"
                            initial={false}
                            animate={{
                                left: styles.left,
                                x: styles.x,
                                y: styles.y,
                                width: styles.width,
                                height: styles.height,
                                scale: styles.scale,
                                opacity: styles.opacity,
                                zIndex: styles.zIndex,
                                display: styles.display,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            onClick={() => {
                                setIndex(i);
                                if (onIndexChange) onIndexChange(i);
                                slide.onClick?.();
                            }}
                        >
                            {slide.content}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
