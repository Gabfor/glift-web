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

    const targetRef = React.useRef(controlledGoToSlide);

    useEffect(() => {
        if (controlledGoToSlide === undefined) return;

        // Check if target changed to trigger immediate first step
        const isNewTarget = targetRef.current !== controlledGoToSlide;
        targetRef.current = controlledGoToSlide;

        const total = slides.length;
        if (total === 0) return;

        // Calculate shortest path distance
        let diff = controlledGoToSlide - index;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        if (diff === 0) return;

        // Step one by one towards target
        const direction = diff > 0 ? 1 : -1;
        const nextIndex = (index + direction + total) % total;

        // If new target, start immediately (0ms). 
        // Otherwise wait for previous transition (150ms).
        const delay = isNewTarget ? 0 : 150;

        const timeout = setTimeout(() => {
            setIndex(nextIndex);
        }, delay);

        return () => clearTimeout(timeout);
    }, [controlledGoToSlide, index, slides.length]);

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
        // Active: 220px x 339px.
        // Prev/Next: Scale 0.882 -> 194px x 299px.

        const width = type === "active" ? "220px" : "194px";
        const height = type === "active" ? "339px" : "299px";
        const opacity = 1;
        const zIndex = type === "active" ? 10 : 5;
        const isVisible = type !== "hidden";

        // Positioning
        // Base setup: left: 50%, x: -50% (Centers the card)

        // Prev: -38px offset.
        // Next: +38px offset.

        let xOffset = 0;
        if (type === "prev") xOffset = -38;
        if (type === "next") xOffset = 38;

        const boxShadow = type === "active" ? "-12px 0px 20px -18px rgba(93, 100, 148, 0.15), 12px 0px 20px -18px rgba(93, 100, 148, 0.15)" : "none";

        return {
            left: "50%",
            x: `calc(-50% + ${xOffset}px)`,
            y: "-50%",
            width,
            height,
            opacity: isVisible ? opacity : 0,
            zIndex,
            display: isVisible ? "block" : "none",
            boxShadow,
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
                    const isActive = i === index;

                    // Clone the content to inject isActive prop if it's a valid element
                    const contentWithProps = React.isValidElement(slide.content)
                        ? React.cloneElement(slide.content as React.ReactElement<any>, { isActive })
                        : slide.content;

                    return (
                        <motion.div
                            key={slide.key}
                            className="absolute top-1/2 origin-center cursor-pointer rounded-[24px]"
                            initial={false}
                            animate={{
                                left: styles.left,
                                x: styles.x,
                                y: styles.y,
                                width: styles.width,
                                height: styles.height,
                                opacity: styles.opacity,
                                zIndex: styles.zIndex,
                                display: styles.display,
                                boxShadow: styles.boxShadow,
                            }}
                            transition={{
                                type: "tween",
                                duration: 0.15,
                                ease: "easeInOut",
                            }}
                            onClick={(e) => {
                                // Smart Navigation: Active card overlaps side cards.
                                // If user clicks the edge of the active card, interpret as interaction with side card.
                                if (isActive) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const w = rect.width;
                                    const total = slides.length;

                                    if (x < w * 0.25) {
                                        const prev = (i - 1 + total) % total;
                                        if (onIndexChange) onIndexChange(prev);
                                        return;
                                    } else if (x > w * 0.75) {
                                        const next = (i + 1) % total;
                                        if (onIndexChange) onIndexChange(next);
                                        return;
                                    }
                                    return; // Center click on active card does nothing navigation-wise
                                }

                                if (onIndexChange) onIndexChange(i);
                                slide.onClick?.();
                            }}
                        >
                            {contentWithProps}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
