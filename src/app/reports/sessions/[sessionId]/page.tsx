// File: @/src/app/reports/sessions/[sessionId]/page.tsx
// Purpose: Displays the detailed report, now with dynamic tab labels.
'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Container } from '@/src/components/ui/container';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Button } from '@/src/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { FileWarning, Info, Users, HelpCircle } from 'lucide-react';

import { useSessionSummaryData } from './hooks/useSessionSummaryData';
import { AccuracyChartCard } from './components/overview/AccuracyChartCard';
import { QuizMetaInfoCard } from './components/overview/QuizMetaInfoCard';

// Import PlayersTabContent
import PlayersTabContent from '../../components/players/PlayersTabContent';

// Import QuestionsTabContent
import QuestionsTabContent from './components/questions/QuestionsTabContent'; // Added this import

// Remove QuestionsTabPlaceholder as it's being replaced
// const QuestionsTabPlaceholder = () => <div className="p-6 text-muted-foreground">Questions tab content will be implemented in Phase 3.</div>;

type ReportPageParams = {
    sessionId: string;
};

interface TabDetail {
    value: string;
    label: string;
    icon?: React.ElementType; // Optional icon for tabs
}

export default function ReportSessionPage() {
    const params = useParams() as ReportPageParams;
    const sessionId = params?.sessionId;

    const [activeTab, setActiveTab] = useState<string>('overview');
    const {
        summaryData,
        isLoading: isLoadingSummary,
        error: summaryError,
        refetch: refetchSummary
    } = useSessionSummaryData(sessionId);

    const OverviewTabContent = () => {
        // ... (OverviewTabContent remains unchanged - content from your provided file)
        if (isLoadingSummary) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <section className="lg:col-span-2">
                        <Skeleton className="h-[400px] w-full bg-card" />
                    </section>
                    <aside className="lg:col-span-1">
                        <Skeleton className="h-[300px] w-full bg-card" />
                    </aside>
                </div>
            );
        }
        if (summaryError) {
            return (
                <Alert variant="destructive" className="mt-4">
                    <FileWarning className="h-4 w-4" />
                    <AlertTitle>Error Loading Summary Data</AlertTitle>
                    <AlertDescription>
                        <p>{summaryError.message}</p>
                        <Button onClick={() => refetchSummary()} variant="link" className="p-0 h-auto mt-2 text-destructive-foreground">
                            Try to reload
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }
        if (!summaryData) {
            return (
                <Alert className="mt-4 border-border text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>
                        No summary data is currently available for this session.
                    </AlertDescription>
                </Alert>
            );
        }
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <section className="lg:col-span-2">
                    <AccuracyChartCard accuracy={summaryData.averageAccuracy} />
                </section>
                <aside className="lg:col-span-1">
                    <QuizMetaInfoCard summary={summaryData} />
                </aside>
            </div>
        );
    };
    // --- End of OverviewTabContent definition


    const getTabDetails = (): TabDetail[] => {
        let playersLabel = "Người tham gia";
        let questionsLabel = "Câu hỏi";

        if (summaryData && !isLoadingSummary) {
            playersLabel = `Người tham gia (${summaryData.controllersCount ?? 0})`;
            questionsLabel = `Câu hỏi (${summaryData.questionsCount ?? 0})`;
        }

        return [
            { value: 'overview', label: 'Tóm tắt', icon: Info }, // Changed Icon for Overview for consistency
            { value: 'players', label: playersLabel, icon: Users },
            { value: 'questions', label: questionsLabel, icon: HelpCircle },
        ];
    };

    const tabs: TabDetail[] = getTabDetails(); // This will now correctly update when summaryData changes


    if (!sessionId && !isLoadingSummary && !summaryError) {
        // ... (Fallback logic remains unchanged)
    }


    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader /> {/* Assuming AppHeader does not need specific title from this page directly */}
            <main className="flex-grow bg-background text-foreground">
                <Container className="py-8 md:py-10">
                    <div className="mb-2">
                        <span className="text-base font-medium text-muted-foreground tracking-wide uppercase">
                            BÁO CÁO
                        </span>
                    </div>
                    <div className="mb-8">
                        {isLoadingSummary && !summaryData ? (
                            <Skeleton className="h-10 w-3/4" />
                        ) : summaryData?.quizInfo?.title ? (
                            <h1 className="text-4xl font-bold tracking-tight text-primary-foreground"> {/* Assuming text-primary-foreground is for dark text on light bg or vice versa */}
                                {summaryData.quizInfo.title}
                            </h1>
                        ) : summaryData?.name ? (
                            <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">
                                {summaryData.name}
                            </h1>
                        ) : summaryError ? (
                            <div className="h-10 w-3/4 bg-destructive/10 rounded flex items-center px-3">
                                <span className="text-lg text-destructive">Could not load quiz title</span>
                            </div>
                        ) : (
                            sessionId ? <Skeleton className="h-10 w-3/4" /> : <div className="h-10 w-3/4 text-muted-foreground italic flex items-center">Loading session details...</div>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-8 bg-muted p-1 rounded-md">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="capitalize data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-sm py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    {tab.icon && <tab.icon className="h-4 w-4" />}
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="overview" className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                            <OverviewTabContent />
                        </TabsContent>
                        <TabsContent value="players" className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                            {sessionId ? (
                                <PlayersTabContent sessionId={sessionId} />
                            ) : (
                                <div className="p-6 text-muted-foreground">Session ID is missing. Cannot load players.</div>
                            )}
                        </TabsContent>
                        <TabsContent value="questions" className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                            {/* Replace QuestionsTabPlaceholder with QuestionsTabContent */}
                            {sessionId ? (
                                <QuestionsTabContent /> // QuestionsTabContent uses useParams internally
                            ) : (
                                <div className="p-6 text-muted-foreground">Session ID is missing. Cannot load questions.</div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Container>
            </main>
        </div>
    );
}