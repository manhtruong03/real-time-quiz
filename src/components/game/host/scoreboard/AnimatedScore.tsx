// src/components/game/host/scoreboard/AnimatedScore.tsx
import React, { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion"; // Import motion as well for potential direct use
import { cn } from "@/src/lib/utils";

interface AnimatedScoreProps {
    fromValue: number;
    toValue: number;
    duration?: number;
    delay?: number; // Optional delay before animation starts
    className?: string;
    prefix?: string; // e.g., "+" for points gained
    onAnimationComplete?: () => void; // Callback when animation finishes
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
    fromValue,
    toValue,
    duration = 0.8,
    delay = 0,
    className,
    prefix = "",
    onAnimationComplete,
}) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const isInViewRef = useRef(false);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        // Ensure animation runs if toValue changes, even if fromValue is the same initially
        // and respect isInViewRef to only animate once on view, or if values change.
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isInViewRef.current) {
                    isInViewRef.current = true; // Mark as viewed to prevent re-trigger on scroll
                    observer.unobserve(node); // Stop observing once in view and animation starts

                    const controls = animate(fromValue, toValue, {
                        duration,
                        delay,
                        ease: "easeOut",
                        onUpdate(value) {
                            if (nodeRef.current) { // Check if node is still mounted
                                nodeRef.current.textContent =
                                    prefix + Math.round(value).toLocaleString();
                            }
                        },
                        onComplete() {
                            if (onAnimationComplete) {
                                onAnimationComplete();
                            }
                        }
                    });
                    return () => controls.stop();
                }
            },
            { threshold: 0.1 } // Trigger when 10% is visible
        );

        observer.observe(node);
        // Initial text before animation starts
        node.textContent = prefix + fromValue.toLocaleString();


        return () => {
            if (node) { // Check if node exists before trying to unobserve
                observer.unobserve(node);
            }
            isInViewRef.current = false; // Reset if component re-mounts
        };
        // Re-run animation if fromValue or toValue changes significantly,
        // or if prefix/duration/delay changes and component is already in view.
        // The key is that fromValue might be the same if the score didn't change,
        // but if toValue changed (e.g. new player with score 0 to 0) it should reflect.
    }, [fromValue, toValue, duration, delay, prefix, onAnimationComplete]);


    return (
        <span ref={nodeRef} className={className}>
            {/* Initial text content will be set by useEffect */}
        </span>
    );
};