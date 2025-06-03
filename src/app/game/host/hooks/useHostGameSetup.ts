// src/app/game/host/hooks/useHostGameSetup.ts
import { useState, useEffect } from "react";
import { fetchQuizDetails } from "@/src/lib/api/quizzes"; // Assuming this path is correct
import type { QuizStructureHost } from "@/src/lib/types"; // Assuming this path is correct

export function useHostGameSetup(quizId: string | null) {
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizDataLoading, setIsQuizDataLoading] = useState(true);
  const [quizApiError, setQuizApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      setQuizApiError("No Quiz ID provided in the URL.");
      setIsQuizDataLoading(false);
      setQuizData(null); // Ensure quizData is null if no quizId
      return;
    }

    let isMounted = true;
    setIsQuizDataLoading(true);
    setQuizApiError(null); // Reset error before new fetch
    setQuizData(null); // Reset quizData before new fetch

    fetchQuizDetails(quizId)
      .then((fetchedQuiz) => {
        if (isMounted) {
          setQuizData(fetchedQuiz as unknown as QuizStructureHost); // Cast if necessary, ensure type alignment
          setIsQuizDataLoading(false);
        }
      })
      .catch((error: any) => {
        if (isMounted) {
          console.error("[useHostGameSetup] Failed to load quiz data:", error);
          setQuizApiError(error.message || "Failed to load quiz data.");
          setIsQuizDataLoading(false);
          setQuizData(null); // Ensure quizData is null on error
        }
      });

    return () => {
      isMounted = false;
    };
  }, [quizId]);

  return { quizData, isQuizDataLoading, quizApiError, setQuizApiError };
}
