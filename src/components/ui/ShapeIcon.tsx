// src/components/ui/ShapeIcon.tsx
import React from 'react';
import { LucideProps } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ShapeIconProps {
    IconComponent: React.ElementType<LucideProps>;
    iconProps?: LucideProps; // To pass stroke, fill, strokeWidth
    containerClassName?: string; // For the div's background, padding, rounded corners
    wrapperDivProps?: React.HTMLAttributes<HTMLDivElement>; // For additional div attributes
}

export const ShapeIcon: React.FC<ShapeIconProps> = ({
    IconComponent,
    iconProps,
    containerClassName,
    wrapperDivProps,
}) => {
    return (
        <div
            className={cn(
                'flex items-center justify-center p-0.5', // Adjust padding as needed for the background effect
                containerClassName
            )}
            {...wrapperDivProps}
        >
            <IconComponent
                {...iconProps}
            />
        </div>
    );
};