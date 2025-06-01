// src/app/game/host/hooks/useSessionFinalizationHandler.ts
import { useState, useEffect } from "react";
import type { LiveGameState, QuizStructureHost } from "@/src/lib/types";
import { transformLiveStateToFinalizationDto } from "@/src/lib/game-utils/session-transformer";
import { saveSessionResults } from "@/src/lib/api/sessions";

// Import relevant types from your actual toast implementation
// These types are derived from your uploaded use-toast.ts and toast.tsx
import type {
  ToastActionElement as ActualToastActionElement,
  ToastProps as ActualToastProps,
} from "@/src/components/ui/toast";

// This ToasterToast type is defined in your use-toast.ts
type ToasterToastForHook = ActualToastProps & {
  // Renamed to avoid conflict if this file also defines ToasterToast
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ActualToastActionElement;
};

// This is the type of the props that the `toast` function (from use-toast.ts) accepts.
// It's Omit<ToasterToast, "id">
type ToastFunctionArgs = Omit<ToasterToastForHook, "id">;

interface UseSessionFinalizationHandlerProps {
  liveGameState: LiveGameState | null;
  quizData: QuizStructureHost | null;
  isAuthenticated: boolean;
  // This is the signature of the `toast` function returned by `useToast` and defined in `use-toast.ts`
  toast: (props: ToastFunctionArgs) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToastForHook) => void; // Corrected to ToasterToastForHook
  };
}

export function useSessionFinalizationHandler({
  liveGameState,
  quizData,
  isAuthenticated,
  toast,
}: UseSessionFinalizationHandlerProps) {
  const [isFinalizingSession, setIsFinalizingSession] = useState(false);

  useEffect(() => {
    if (
      liveGameState &&
      quizData &&
      (liveGameState.status === "PODIUM" || liveGameState.status === "ENDED") &&
      isAuthenticated &&
      !isFinalizingSession
    ) {
      setIsFinalizingSession(true);
      const finalPayload = transformLiveStateToFinalizationDto(
        liveGameState,
        quizData
      );

      const sendFinalizationRequest = async () => {
        try {
          await saveSessionResults(finalPayload);
          // Props here must match ToastFunctionArgs
          toast({
            title: "Session Results Saved",
            description: "The game results have been successfully recorded.",
          });
        } catch (error: any) {
          // Props here must match ToastFunctionArgs
          toast({
            variant: "destructive",
            title: "Error Saving Results",
            description:
              error.message ||
              "An unexpected error occurred while saving session results.",
          });
        }
      };

      sendFinalizationRequest();
    }
  }, [liveGameState, quizData, isAuthenticated, isFinalizingSession, toast]);
}
