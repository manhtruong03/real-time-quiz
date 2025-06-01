// src/app/my-quizzes/hooks/useQuizActions.ts
"use client";

import { useState } from "react";
import { deleteQuizById } from "@/src/lib/api/quizzes";
import type { QuizDTO } from "@/src/lib/types/api";

// Define a more specific type for the toast function's props
// This should match the props your actual toast function expects
interface ToastProps {
  title: string;
  description: string;
  variant?: "default" | "destructive"; // Add other variants if you have them
  // Add any other properties your toast function accepts
}

interface UseQuizActionsProps {
  setQuizzes: React.Dispatch<React.SetStateAction<QuizDTO[]>>;
  toast: (props: ToastProps) => void; // Type the toast function directly
}

export const useQuizActions = ({ setQuizzes, toast }: UseQuizActionsProps) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteQuiz = async (
    quizId: string | undefined,
    quizTitle: string | undefined
  ) => {
    if (!quizId) return;
    setIsDeleting(quizId);
    try {
      await deleteQuizById(quizId);
      setQuizzes((prevQuizzes) =>
        prevQuizzes.filter((quiz) => quiz.uuid !== quizId)
      );
      toast({
        // Ensure these properties match ToastProps
        title: "Quiz Deleted",
        description: `"${
          quizTitle || "The quiz"
        }" has been successfully deleted.`,
      });
    } catch (err: any) {
      console.error(`Failed to delete quiz ${quizId}:`, err);
      toast({
        // Ensure these properties match ToastProps
        variant: "destructive",
        title: "Delete Failed",
        description:
          err.message ||
          `Could not delete "${quizTitle || "the quiz"}". Please try again.`,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return { isDeleting, handleDeleteQuiz };
};
