// Path: @/src/app/reports/sessions/[sessionId]/components/players/PlayersFilters.tsx
import React from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type PlayerFilterSubTabKey = 'all' | 'needHelp' | 'didNotFinish';

interface PlayerFilterSubTabItem {
    key: PlayerFilterSubTabKey;
    label: string;
}

const subTabs: PlayerFilterSubTabItem[] = [
    { key: 'all', label: 'All Players' },
    { key: 'needHelp', label: 'Need Help' },
    { key: 'didNotFinish', label: 'Did Not Finish' },
];

interface PlayersFiltersProps {
    activeSubTab: PlayerFilterSubTabKey;
    onSubTabChange: (tab: PlayerFilterSubTabKey) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    // Placeholder for future counts, not implemented in this step
    // playerCounts?: { [key in PlayerFilterSubTabKey]?: number };
}

const PlayersFilters: React.FC<PlayersFiltersProps> = ({
    activeSubTab,
    onSubTabChange,
    searchTerm,
    onSearchChange,
}) => {
    return (
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-2"> {/* Conceptual: participants-filters */}
            {/* Sub Tabs */}
            <div className="flex items-center space-x-1 border border-border-neutral rounded-md p-1 bg-background-elevated"> {/* Conceptual: sub-tabs container from screen-10-report-player.html */}
                {subTabs.map((tab) => (
                    <Button
                        key={tab.key}
                        variant="ghost"
                        size="sm"
                        onClick={() => onSubTabChange(tab.key)}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md",
                            activeSubTab === tab.key
                                ? "bg-accent text-accent-foreground shadow-sm" // Active tab style based on Shadcn primary button
                                : "text-text-secondary hover:bg-muted/50 hover:text-text-primary", // Inactive tab style
                        )}
                    >
                        {tab.label}
                        {/* Placeholder for counts: {playerCounts && playerCounts[tab.key] !== undefined ? ` (${playerCounts[tab.key]})` : ''} */}
                    </Button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[250px]"> {/* Conceptual: search-container */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" /> {/* Conceptual: search-icon */}
                <Input
                    type="text"
                    placeholder="Search player..." // Conceptual: placeholder from screen-10-report-player.html
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-3 py-2 text-sm bg-background-elevated border-border-neutral focus:border-accent text-text-primary placeholder:text-text-placeholder rounded-md w-full" // Conceptual: search-input
                />
            </div>
        </div>
    );
};

export default PlayersFilters;