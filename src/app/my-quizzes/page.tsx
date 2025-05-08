// src/app/my-quizzes/page.tsx (Create this new file)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // For cover images
import { formatDistanceToNow } from 'date-fns'; // For relative time

import { AppHeader } from '@/src/components/layout/AppHeader';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Badge } from '@/src/components/ui/badge';
import { fetchMyQuizzes } from '@/src/lib/api/quizzes'; // Import the new API function
import type { QuizDTO, Page } from '@/src/lib/types/api'; // Import types
import { ListChecks, AlertCircle, Loader2, PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'; // Icons
import { Brain, Play } from "lucide-react";

const MyQuizzesPageContent: React.FC = () => {
    const { user } = useAuth(); // Get user info if needed
    const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // TODO: Add state for pagination if implementing fully
    // const [currentPage, setCurrentPage] = useState(0);
    // const [totalPages, setTotalPages] = useState(0);

    const loadQuizzes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch first page, sorted by last modified
            const quizPage: Page<QuizDTO> = await fetchMyQuizzes({ page: 0, size: 20 });
            setQuizzes(quizPage.content || []);
            // setTotalPages(quizPage.totalPages);
            // setCurrentPage(quizPage.number);
            console.log("Fetched quizzes:", quizPage.content);
        } catch (err: any) {
            console.error("Failed to fetch quizzes:", err);
            setError(err.message || "Could not load your quizzes.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQuizzes();
    }, [loadQuizzes]);

    const handleDeleteQuiz = (quizId: string | undefined) => {
        if (!quizId) return;
        console.warn(`[My Quizzes] Delete quiz requested: ${quizId} (Delete API call not implemented)`);
        // TODO: Implement API call to delete quiz and update state
        // Example:
        // try {
        //   await deleteQuizApiCall(quizId);
        //   setQuizzes(prev => prev.filter(q => q.uuid !== quizId));
        //   toast({ title: "Quiz deleted" });
        // } catch (err) { toast({ variant: "destructive", title: "Error", description: "Could not delete quiz."}) }
    };


    return (
        <div className="min-h-screen flex flex-col">
            <AppHeader currentPage="profile" /> {/* Or a new identifier */}

            <main className="flex-1 py-8 md:py-12 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold">My Quizzes</h1>
                        <Link href="/quiz/create" passHref>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
                            </Button>
                        </Link>
                    </div>

                    {isLoading && (
                        // Skeleton Loading State
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-24 w-full mb-3" />
                                        <Skeleton className="h-4 w-1/4" />
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-8 w-16" />
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}

                    {!isLoading && error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error Loading Quizzes</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                            <Button variant="outline" size="sm" onClick={loadQuizzes} className="mt-4">Retry</Button>
                        </Alert>
                    )}

                    {!isLoading && !error && quizzes.length === 0 && (
                        <div className="text-center py-16 border border-dashed rounded-lg bg-card">
                            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Quizzes Yet</h3>
                            <p className="text-muted-foreground mb-6">You haven't created any quizzes. Start creating one now!</p>
                            <Link href="/quiz/create" passHref>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Quiz
                                </Button>
                            </Link>
                        </div>
                    )}

                    {!isLoading && !error && quizzes.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {quizzes.map((quiz) => (
                                <Card key={quiz.uuid} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="truncate">{quiz.title || "Untitled Quiz"}</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">
                                            {/* Format timestamp */}
                                            Last modified: {quiz.modified ? formatDistanceToNow(new Date(quiz.modified), { addSuffix: true }) : 'Unknown'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {quiz.cover && (
                                            <div className="aspect-video relative w-full bg-muted rounded overflow-hidden mb-3">
                                                <Image
                                                    src={quiz.cover}
                                                    alt={`${quiz.title || 'Quiz'} cover image`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {quiz.description || <i>No description</i>}
                                        </p>
                                        <Badge variant="outline">{quiz.questionCount || 0} Question{quiz.questionCount !== 1 ? 's' : ''}</Badge>
                                        <Badge variant={quiz.visibility === 1 ? "secondary" : "outline"} className='ml-2'>
                                            {quiz.visibility === 1 ? 'Public' : 'Private'}
                                        </Badge>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
                                        {/* Add Link to Edit Page */}
                                        <Link href={`/quiz/create/${quiz.uuid}`} passHref>
                                            <Button variant="outline" size="sm" title="Edit Quiz">
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                        </Link>
                                        <Button variant="destructive" size="sm" title="Delete Quiz" onClick={() => handleDeleteQuiz(quiz.uuid)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                        {/* Add Link to Host Page */}
                                        <Link href={`/game/host?quizId=${quiz.uuid}`} passHref>
                                            <Button size="sm" title="Host Game">
                                                <Play className="mr-1 h-4 w-4" /> Host
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                    {/* TODO: Add Pagination controls if totalPages > 1 */}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-muted/30 border-t py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Brain className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">VUI QUIZ</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        &copy; {new Date().getFullYear()} VUI QUIZ. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

// Wrap with ProtectedRoute
export default function MyQuizzesPage() {
    return (
        <ProtectedRoute>
            <MyQuizzesPageContent />
        </ProtectedRoute>
    );
}