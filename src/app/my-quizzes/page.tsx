// src/app/my-quizzes/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppHeader } from '@/src/components/layout/AppHeader';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Badge } from '@/src/components/ui/badge';
import { fetchMyQuizzes } from '@/src/lib/api/quizzes';
import type { QuizDTO, Page } from '@/src/lib/types/api';
import { ListChecks, AlertCircle, Loader2, PlusCircle, Eye, Pencil, Trash2, Play, Brain, Clock, ImageOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const formatMillisecondsToMinutes = (ms: number | undefined | null): string | null => {
    if (ms === undefined || ms === null || ms <= 0) {
        return null;
    }
    const minutes = Math.floor(ms / 60000);
    if (minutes === 0) return "<1 phút";
    return `${minutes} phút`;
};

const MyQuizzesPageContent: React.FC = () => {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currentYear = new Date().getFullYear();

    const loadQuizzes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const quizPage: Page<QuizDTO> = await fetchMyQuizzes({ page: 0, size: 20, sort: 'desc' });
            setQuizzes(quizPage.content || []);
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
        console.warn(`[My Quizzes] Delete quiz requested: ${quizId} (Actual API call not implemented)`);
    };

    // Define icon button style based on screen-05-my-quiz.html and image_81483a.png
    const iconButtonStyle = "h-9 w-9 p-0 rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary flex items-center justify-center";

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <AppHeader currentPage="my-quizzes" />

            <main className="flex-1 py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Quiz của tôi</h1>
                        <Link href="/quiz/create" passHref>
                            <Button variant="default" size="default" className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary">
                                <PlusCircle className="mr-2 h-4 w-4" /> Tạo Quiz mới
                            </Button>
                        </Link>
                    </div>

                    {/* Loading, Error, Empty States */}
                    {isLoading && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="overflow-hidden bg-card border-border/50">
                                    <Skeleton className="w-full aspect-video bg-muted/70" />
                                    <CardHeader className="pt-4 pb-2">
                                        <Skeleton className="h-7 w-3/4 mb-1 bg-muted/70" />
                                        <Skeleton className="h-5 w-1/2 mb-2 bg-muted/70" />
                                        <Skeleton className="h-10 w-full bg-muted/70" />
                                    </CardHeader>
                                    <CardContent className="pt-1 pb-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Skeleton className="h-6 w-24 bg-muted/70" />
                                            <Skeleton className="h-6 w-24 bg-muted/70" />
                                            <Skeleton className="h-6 w-24 bg-muted/70" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 pt-3 pb-3 border-t border-border/50">
                                        <Skeleton className="h-9 w-9 rounded-full bg-muted/70" /> {/* Circular skeleton for icon buttons */}
                                        <Skeleton className="h-9 w-9 rounded-full bg-muted/70" />
                                        <Skeleton className="h-9 w-[100px] rounded-md bg-muted/70" /> {/* Adjusted Host button skeleton size */}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                    {!isLoading && error && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive text-destructive-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Lỗi tải Quiz</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                            <Button variant="outline" size="sm" onClick={loadQuizzes} className="mt-4 border-destructive text-destructive-foreground hover:bg-destructive/20">Thử lại</Button>
                        </Alert>
                    )}
                    {!isLoading && !error && quizzes.length === 0 && (
                        <div className="text-center py-16 border border-dashed border-border/50 rounded-lg bg-card">
                            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2 text-foreground">Chưa có Quiz nào</h3>
                            <p className="text-muted-foreground mb-6">Bạn chưa tạo quiz nào. Hãy bắt đầu ngay!</p>
                            <Link href="/quiz/create" passHref>
                                <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Tạo Quiz đầu tiên
                                </Button>
                            </Link>
                        </div>
                    )}

                    {!isLoading && !error && quizzes.length > 0 && (
                        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {quizzes.map((quiz) => {
                                const formattedTimeLimit = formatMillisecondsToMinutes(quiz.totalQuizTimeLimitMs);
                                return (
                                    <Card key={quiz.uuid} className="flex flex-col overflow-hidden bg-card border-border/50 hover:shadow-xl transition-shadow duration-200 ease-in-out">
                                        <div className="aspect-video relative w-full bg-muted/30 overflow-hidden">
                                            {quiz.cover ? (
                                                <Image
                                                    src={quiz.cover}
                                                    alt={`${quiz.title || 'Quiz'} cover image`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    priority={false}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            let fallback = parent.querySelector('.fallback-icon-placeholder');
                                                            if (!fallback) {
                                                                fallback = document.createElement('div');
                                                                fallback.className = "fallback-icon-placeholder w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground";
                                                                const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off opacity-50"><path d="M12.378 12.378a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"/><line x1="2" x2="22" y1="2" y2="22"/><path d="M19 2l-4.142 4.142a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>`;
                                                                fallback.innerHTML = iconSvg;
                                                                parent.appendChild(fallback);
                                                            }
                                                            (fallback as HTMLElement).style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground fallback-icon-placeholder">
                                                    <ImageOff className="w-12 h-12 opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                        <CardHeader className="pt-4 pb-2">
                                            <CardTitle className="truncate text-xl font-semibold text-foreground leading-snug" title={quiz.title || "Chưa có tiêu đề"}>
                                                {quiz.title || "Chưa có tiêu đề"}
                                            </CardTitle>
                                            <CardDescription className="text-sm text-foreground/75 mt-0.5">
                                                Cập nhật: {quiz.modified ? formatDistanceToNow(new Date(quiz.modified), { addSuffix: true, locale: vi }) : 'Không rõ'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow pt-2 pb-3 space-y-2.5">
                                            <p className="text-base text-foreground/80 line-clamp-2 h-[3.25rem] leading-relaxed">
                                                {quiz.description || <i className="text-foreground/60">Không có mô tả</i>}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <Badge variant="outline" className="bg-muted/60 border-border/60 text-foreground/90 rounded-md px-2.5 py-1">
                                                    {quiz.questionCount || 0} Câu hỏi
                                                </Badge>
                                                <Badge
                                                    variant={"outline"}
                                                    className={cn(
                                                        "font-medium rounded-md px-2.5 py-1",
                                                        quiz.visibility === 1
                                                            ? "bg-primary/25 border-primary/40 text-primary-foreground"
                                                            : "bg-muted/60 border-border/60 text-foreground/90"
                                                    )}
                                                >
                                                    {quiz.visibility === 1 ? 'Công khai' : 'Riêng tư'}
                                                </Badge>
                                                {formattedTimeLimit && (
                                                    <Badge variant="outline" className="bg-muted/60 border-border/60 text-foreground/90 rounded-md px-2.5 py-1">
                                                        <Clock className="mr-1.5 h-3.5 w-3.5" /> {formattedTimeLimit}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end items-center gap-2 pt-3 pb-3 border-t border-border/50 mt-auto">
                                            <Link href={`/quiz/create?quizId=${quiz.uuid}`} passHref>
                                                <Button variant="ghost" title="Sửa Quiz" className={cn(iconButtonStyle, "hover:bg-primary/20 hover:text-primary")}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" title="Xoá Quiz" onClick={() => handleDeleteQuiz(quiz.uuid)} className={cn(iconButtonStyle, "hover:bg-destructive/20 hover:text-destructive")}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Link href={`/game/host?quizId=${quiz.uuid}`} passHref>
                                                <Button variant="default" size="sm" title="Tổ chức Game" className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary rounded-md">
                                                    <Play className="mr-1.5 h-4 w-4" /> Tổ chức
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
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