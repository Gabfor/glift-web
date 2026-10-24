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
        // Active: 220px x 339px.
        // Prev/Next: 194px x 299px.

        const width = type === "active" ? "220px" : "194px";
        const height = type === "active" ? "339px" : "299px";
        const opacity = 1;
        const zIndex = type === "active" ? 10 : 5;
        const isVisible = type !== "hidden";

        // Positioning:
        // - active: Centered horizontally (left: 50%, x: -50%)
        // - prev: Aligned to the left edge of the container (left: 0%, x: 0%)
        // - next: Aligned to the right edge of the container (left: 100%, x: -100%)
        let left = "50%";
        let x = "-50%";

        if (type === "prev") {
            left = "0%";
            x = "0%";
        } else if (type === "next") {
            left = "100%";
            x = "-100%";
        } else if (type === "hidden") {
            if (distance < 0) {
                left = "0%";
                x = "0%";
            } else {
                left = "100%";
                x = "-100%";
            }
        }

        const boxShadow = type === "active" ? "-12px 0px 20px -18px rgba(93, 100, 148, 0.15), 12px 0px 20px -18px rgba(93, 100, 148, 0.15)" : "none";

        return {
            left,
            x,
            y: "-50%",
            width,
            height,
            opacity: isVisible ? opacity : 0,
            zIndex,
            display: isVisible ? "block" : "none",
            boxShadow,
        };
    };

    const pointerStartX = React.useRef<number | null>(null);
    const pointerStartY = React.useRef<number | null>(null);
    const isSwiping = React.useRef(false);
    const lastSlideTime = React.useRef(0);

    const triggerSlide = (direction: "next" | "prev") => {
        const now = Date.now();
        if (now - lastSlideTime.current < 250) return;
        lastSlideTime.current = now;

        const total = slides.length;
        if (total <= 1) return;

        if (direction === "next") {
            const nextIdx = (index + 1) % total;
            setIndex(nextIdx);
            if (onIndexChange) onIndexChange(nextIdx);
        } else {
            const prevIdx = (index - 1 + total) % total;
            setIndex(prevIdx);
            if (onIndexChange) onIndexChange(prevIdx);
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pointerStartX.current = e.clientX;
        pointerStartY.current = e.clientY;
        isSwiping.current = false;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (pointerStartX.current === null || pointerStartY.current === null) return;
        const deltaX = e.clientX - pointerStartX.current;
        const deltaY = e.clientY - pointerStartY.current;

        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isSwiping.current = true;
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (pointerStartX.current === null || pointerStartY.current === null) return;
        const deltaX = e.clientX - pointerStartX.current;
        const deltaY = e.clientY - pointerStartY.current;

        pointerStartX.current = null;
        pointerStartY.current = null;

        const threshold = 35;
        if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < -threshold) {
                triggerSlide("next");
            } else if (deltaX > threshold) {
                triggerSlide("prev");
            }
        }

        setTimeout(() => {
            isSwiping.current = false;
        }, 120);
    };

    const handlePointerCancel = () => {
        pointerStartX.current = null;
        pointerStartY.current = null;
        setTimeout(() => {
            isSwiping.current = false;
        }, 120);
    };

    // Native touch event fallbacks
    const handleTouchStart = (e: React.TouchEvent) => {
        pointerStartX.current = e.touches[0].clientX;
        pointerStartY.current = e.touches[0].clientY;
        isSwiping.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (pointerStartX.current === null || pointerStartY.current === null) return;
        const deltaX = e.touches[0].clientX - pointerStartX.current;
        const deltaY = e.touches[0].clientY - pointerStartY.current;

        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isSwiping.current = true;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (pointerStartX.current === null || pointerStartY.current === null) return;
        const deltaX = e.changedTouches[0].clientX - pointerStartX.current;
        const deltaY = e.changedTouches[0].clientY - pointerStartY.current;

        pointerStartX.current = null;
        pointerStartY.current = null;

        const threshold = 35;
        if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < -threshold) {
                triggerSlide("next");
            } else if (deltaX > threshold) {
                triggerSlide("prev");
            }
        }

        setTimeout(() => {
            isSwiping.current = false;
        }, 120);
    };

    return (
        <div className="relative h-full w-full perspective-1000">
            {/* perspective class might need tailwind config or manual style if not present, but usually irrelevant for 2D transforms pretending to be 3D */}
            <style jsx>{`
        .record-carousel-container {
            perspective: 1000px;
        }
      `}</style>
            <div
                className="record-carousel-container relative w-full h-full touch-pan-y select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
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
                                // Ignore synthetic clicks when swiping
                                if (isSwiping.current || Date.now() - lastSlideTime.current < 200) {
                                    return;
                                }

                                // Smart Navigation: Active card overlaps side cards.
                                // If user clicks the edge of the active card, interpret as interaction with side card.
                                if (isActive) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const w = rect.width;
                                    const total = slides.length;

                                    if (x < w * 0.25) {
                                        const prev = (i - 1 + total) % total;
                                        setIndex(prev);
                                        if (onIndexChange) onIndexChange(prev);
                                        return;
                                    } else if (x > w * 0.75) {
                                        const next = (i + 1) % total;
                                        setIndex(next);
                                        if (onIndexChange) onIndexChange(next);
                                        return;
                                    }
                                    return; // Center click on active card does nothing navigation-wise
                                }

                                setIndex(i);
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
