// src/components/ui/container.tsx
import { cn } from "@/src/lib/utils";
import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("container mx-auto px-4 sm:px-6 lg:px-8", className)}
            {...props}
        />
    )
);
Container.displayName = "Container";