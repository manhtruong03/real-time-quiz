// src/app/my-quizzes/page.tsx
"use client";

import React from 'react';

import { AppHeader } from '@/src/components/layout/AppHeader';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/context/AuthContext';
import { Brain } from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';

import QuizList from './components/QuizList';
import MyQuizzesLoadingSkeleton from './components/MyQuizzesLoadingSkeleton';
import MyQuizzesEmptyState from './components/MyQuizzesEmptyState';
import MyQuizzesErrorState from './components/MyQuizzesErrorState';
import MyQuizzesPageHeader from './components/MyQuizzesPageHeader';
import QuizzesPagination from './components/QuizzesPagination'; // Import the new pagination component

import { useMyQuizzesData } from './hooks/useMyQuizzesData';
import { useQuizActions } from './hooks/useQuizActions';

const MyQuizzesPageContent: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Destructure new pagination-related values from the hook
    const {
        quizzes,
        isLoading,
        error,
        loadQuizzes, // Keep if retry needs specific page, or rely on goToPage
        setQuizzes,
        currentPage,
        totalPages,
        goToPage
    } = useMyQuizzesData();

    const { isDeleting, handleDeleteQuiz } = useQuizActions({ setQuizzes, toast });

    const currentYear = new Date().getFullYear();

    // Callback for error retry - now using goToPage to reload current page or page 0
    const handleRetryLoadQuizzes = () => {
        goToPage(currentPage); // Or always goToPage(0) if preferred for retries
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <AppHeader currentPage="my-quizzes" />

            <main className="flex-1 py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <MyQuizzesPageHeader />

                    {isLoading && <MyQuizzesLoadingSkeleton />}

                    {!isLoading && error && (
                        <MyQuizzesErrorState error={error} onRetry={handleRetryLoadQuizzes} />
                    )}

                    {!isLoading && !error && quizzes.length === 0 && (
                        <MyQuizzesEmptyState />
                    )}

                    {!isLoading && !error && quizzes.length > 0 && (
                        <>
                            <QuizList
                                quizzes={quizzes}
                                onDelete={handleDeleteQuiz}
                                isDeleting={isDeleting}
                            />
                            {totalPages > 1 && ( // Only show pagination if more than one page
                                <QuizzesPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={goToPage}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            <footer className="bg-background border-t border-border py-8 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Brain className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold text-foreground">VUI QUIZ</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {currentYear} VUI QUIZ. Bản quyền đã được bảo hộ.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default function MyQuizzesPage() {
    return (
        <ProtectedRoute>
            <MyQuizzesPageContent />
        </ProtectedRoute>
    );
}