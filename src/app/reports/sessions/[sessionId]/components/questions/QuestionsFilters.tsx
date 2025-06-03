// src/app/reports/sessions/[sessionId]/components/questions/QuestionsFilters.tsx
import React from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { QuestionFilterType } from '@/src/app/reports/hooks/useSessionQuestionsData'; // Import the type

interface QuestionFilterSubTabItem {
    key: QuestionFilterType;
    label: string;
}

// Define the filter tabs for questions
const subTabs: QuestionFilterSubTabItem[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'difficult', label: 'Câu hỏi khó' },
];

interface QuestionsFiltersProps {
    activeFilterTab: QuestionFilterType;
    onFilterTabChange: (tab: QuestionFilterType) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    // We can add counts here later if needed, similar to playerCounts
    // questionCounts?: { [key in QuestionFilterType]?: number };
}

const QuestionsFilters: React.FC<QuestionsFiltersProps> = ({
    activeFilterTab,
    onFilterTabChange,
    searchTerm,
    onSearchChange,
    // questionCounts,
}) => {
    return (
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 border border-border-neutral rounded-md p-1 bg-background-elevated">
                {subTabs.map((tab) => (
                    <Button
                        key={tab.key}
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilterTabChange(tab.key)}
                        className={cn(
                            'px-3 py-1.5 text-sm font-medium rounded-md',
                            activeFilterTab === tab.key
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'text-text-secondary hover:bg-muted/50 hover:text-text-primary'
                        )}
                    >
                        {tab.label}
                        {/* Example for counts:
            {questionCounts && questionCounts[tab.key] !== undefined
              ? ` (${questionCounts[tab.key]})`
              : ''}
            */}
                    </Button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
                <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-3 py-2 text-sm bg-background-elevated border-border-neutral focus:border-accent text-text-primary placeholder:text-text-placeholder rounded-md w-full"
                />
            </div>
        </div>
    );
};

export default QuestionsFilters;