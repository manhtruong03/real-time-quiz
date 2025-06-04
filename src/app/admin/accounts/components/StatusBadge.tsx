// src/app/admin/accounts/components/StatusBadge.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/lib/utils.ts]

interface StatusBadgeProps {
    isActive: boolean;
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive, className }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full capitalize inline-block";
    // Based on screen-admin-01-account.html:
    // .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: capitalize; }
    // .status-active { background-color: var(--success-color); color: var(--primary-bg); }
    // .status-inactive { background-color: var(--disabled-color); color: var(--text-secondary); }

    // Assuming CSS variables are mapped in tailwind.config.js or globals.css
    // For example, bg-success-color, text-primary-bg, bg-disabled-color, text-text-secondary
    // If not, you might need to use inline styles or define these colors in Tailwind config.
    // For now, using conceptual Tailwind classes that you'd define:
    const activeClasses = "bg-success-color text-primary-bg-for-badge"; // e.g., text-black or a dark gray if primary-bg is dark
    const inactiveClasses = "bg-disabled-color text-text-secondary-for-badge"; // e.g., text-gray-300

    // Fallback to more generic Tailwind if specific theme colors aren't set up:
    // const activeClasses = "bg-green-500 text-white";
    // const inactiveClasses = "bg-gray-500 text-gray-200";


    return (
        <span
            className={cn(
                baseClasses,
                isActive ? 'bg-[var(--success-color)] text-[var(--primary-bg)]' : 'bg-[var(--disabled-color)] text-[var(--text-secondary)]',
                // The above uses CSS variables directly. Ensure these are defined in globals.css
                // and accessible. If you prefer Tailwind utility classes, you'd need to configure
                // 'success-color', 'primary-bg', 'disabled-color', 'text-secondary' in your tailwind.config.js
                // Example with placeholder Tailwind classes (if vars are mapped):
                // isActive ? 'bg-success-color text-primary-bg-text' : 'bg-disabled-color text-text-secondary-text',
                className
            )}
        >
            {isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
        </span>
    );
};

export default StatusBadge;