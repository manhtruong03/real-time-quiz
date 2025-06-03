// src/app/reports/sessions/[sessionId]/components/questions/SortControls.tsx
import React from 'react';
import { Button } from '@/src/components/ui/button'; //
import { ArrowDownUp, ArrowDown, ArrowUp, ListOrdered, BarChartHorizontalBig } from 'lucide-react';
import { cn } from '@/src/lib/utils'; //
import type { QuestionReportItemDto } from '@/src/lib/types/reports'; //

interface SortButtonProps {
    label: string;
    sortKey: keyof QuestionReportItemDto | string;
    isActive: boolean;
    direction: 'asc' | 'desc' | null;
    onClick: () => void;
    icon?: React.ReactNode;
}

const SortButton: React.FC<SortButtonProps> = ({ label, isActive, direction, onClick, icon }) => {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 text-sm h-9 px-3 py-1.5",
                isActive ? "border-primary text-primary bg-primary-foreground" : "text-text-secondary hover:bg-muted/50 hover:text-text-primary"
            )}
        >
            {icon}
            {label}
            {isActive && direction === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
            {isActive && direction === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
            {!isActive && <ArrowDownUp className="h-3.5 w-3.5 opacity-40" />}
        </Button>
    );
};

interface SortControlsProps {
    currentSortProperty: keyof QuestionReportItemDto | string;
    currentSortDirection: 'asc' | 'desc';
    onSortChange: (sortProperty: keyof QuestionReportItemDto | string) => void;
}

const SortControls: React.FC<SortControlsProps> = ({
    currentSortProperty,
    currentSortDirection,
    onSortChange,
}) => {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-start gap-2 py-1">
            <span className="text-sm font-medium text-text-secondary mr-1 self-center">Sắp xếp:</span>
            <SortButton
                label="Thứ tự"
                sortKey="slideIndex"
                icon={<ListOrdered className="h-4 w-4" />}
                isActive={currentSortProperty === 'slideIndex'}
                direction={currentSortProperty === 'slideIndex' ? currentSortDirection : null}
                onClick={() => onSortChange('slideIndex')}
            />
            <SortButton
                label="Độ chính xác %"
                sortKey="averageAccuracy"
                icon={<BarChartHorizontalBig className="h-4 w-4" />}
                isActive={currentSortProperty === 'averageAccuracy'}
                direction={currentSortProperty === 'averageAccuracy' ? currentSortDirection : null}
                onClick={() => onSortChange('averageAccuracy')}
            />
        </div>
    );
};

export default SortControls;