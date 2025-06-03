// src/app/my-quizzes/components/QuizCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Button, buttonVariants } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Loader2, Eye, Pencil, Trash2, Play, Clock, ImageOff } from 'lucide-react';
import { cn } from '@/src/lib/utils'; // Keep cn if used
import { formatMillisecondsToMinutes } from '@/src/lib/utils'; // Import the moved function
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import type { QuizDTO } from '@/src/lib/types/api';

// Helper function formatMillisecondsToMinutes is REMOVED from here

interface QuizCardProps {
    quiz: QuizDTO;
    onDelete: (quizId: string | undefined, quizTitle: string | undefined) => void;
    isDeleting: string | null;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onDelete, isDeleting }) => {
    const formattedTimeLimit = formatMillisecondsToMinutes(quiz.totalQuizTimeLimitMs); // Now uses the imported function
    const iconButtonStyle = "h-9 w-9 p-0 rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary flex items-center justify-center";

    return (
        <Card className="flex flex-col overflow-hidden bg-card border-border/50 hover:shadow-xl transition-shadow duration-200 ease-in-out">
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
                                    // Simple ImageOff icon as SVG for direct embed
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
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" title="Xoá Quiz" disabled={isDeleting === quiz.uuid} className={cn(iconButtonStyle, "hover:bg-destructive/20 hover:text-destructive")}>
                            {isDeleting === quiz.uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Quiz "<span className="font-semibold">{quiz.title || 'Không tiêu đề'}</span>" sẽ bị xóa vĩnh viễn.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(quiz.uuid, quiz.title)}
                                className={cn(buttonVariants({ variant: "destructive" }))}
                            >
                                Xóa Quiz
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Link href={`/game/host?quizId=${quiz.uuid}`} passHref>
                    <Button variant="default" size="sm" title="Tổ chức Game" className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary rounded-md">
                        <Play className="mr-1.5 h-4 w-4" /> Tổ chức
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default QuizCard;