// src/hooks/quiz-editor/useQuizViewManager.ts
"use client";

import {
  useState,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { UseFormReturn } from "react-hook-form";
import { QuizStructureHost } from "@/src/lib/types/quiz-structure";
import { QuizMetadataSchemaType } from "@/src/lib/schemas/quiz-settings.schema";
import { useToast } from "@/src/hooks/use-toast";

export type QuizEditorViewMode = "settings" | "add-slide" | "editor";

interface UseQuizViewManagerProps {
  initialQuizData: QuizStructureHost | null;
  currentSlideIndex: number;
  setCurrentSlideIndex: Dispatch<SetStateAction<number>>;
  saveCurrentQuestionIfNeeded: () => Promise<boolean>;
  settingsFormMethods: UseFormReturn<QuizMetadataSchemaType>;
  updateQuizMetadata: (data: QuizMetadataSchemaType) => void;
}

export function useQuizViewManager({
  initialQuizData,
  currentSlideIndex,
  setCurrentSlideIndex,
  saveCurrentQuestionIfNeeded,
  settingsFormMethods,
  updateQuizMetadata,
}: UseQuizViewManagerProps) {
  const [viewMode, setViewMode] = useState<QuizEditorViewMode>("settings");
  const { toast } = useToast();
  const {
    formState: settingsFormState,
    trigger: triggerSettingsValidation,
    handleSubmit: handleSettingsSubmitRHF,
  } = settingsFormMethods;

  // Effect to manage viewMode based on quizData and currentSlideIndex
  useEffect(() => {
    if (!initialQuizData) return;
    const numQuestions = initialQuizData.questions.length;

    if (viewMode === "editor" && currentSlideIndex === -1) {
      if (numQuestions > 0) {
        setCurrentSlideIndex(0);
        // viewMode remains 'editor'
      } else {
        setViewMode("add-slide");
      }
    } else if (
      viewMode !== "settings" &&
      viewMode !== "add-slide" &&
      numQuestions === 0
    ) {
      setViewMode("add-slide");
      setCurrentSlideIndex(-1);
    }
  }, [
    initialQuizData?.questions.length,
    currentSlideIndex,
    viewMode,
    setCurrentSlideIndex,
    initialQuizData,
  ]);

  const navigateToSettings = useCallback(async () => {
    if (viewMode === "editor") {
      const canProceed = await saveCurrentQuestionIfNeeded();
      if (!canProceed) return;
    }
    setCurrentSlideIndex(-1);
    setViewMode("settings");
  }, [
    viewMode,
    saveCurrentQuestionIfNeeded,
    setCurrentSlideIndex,
    setViewMode,
  ]);

  const navigateToAddSlide = useCallback(async () => {
    if (viewMode === "editor") {
      const canProceed = await saveCurrentQuestionIfNeeded();
      if (!canProceed) return;
    }
    if (viewMode === "settings" && settingsFormState.isDirty) {
      const settingsValid = await triggerSettingsValidation();
      if (settingsValid) {
        await handleSettingsSubmitRHF(updateQuizMetadata)(); // Save settings
        await new Promise((resolve) => setTimeout(resolve, 50)); // Allow state to propagate
      } else {
        toast({
          title: "Unsaved Settings",
          description:
            "Please fix errors in quiz settings before adding a slide.",
          variant: "destructive",
        });
        return;
      }
    }
    setCurrentSlideIndex(-1);
    setViewMode("add-slide");
  }, [
    viewMode,
    saveCurrentQuestionIfNeeded,
    settingsFormState.isDirty,
    triggerSettingsValidation,
    handleSettingsSubmitRHF,
    updateQuizMetadata,
    toast,
    setCurrentSlideIndex,
    setViewMode,
  ]);

  const navigateToEditorSlide = useCallback(
    async (index: number) => {
      if (index === currentSlideIndex && viewMode === "editor") return;

      if (viewMode === "editor") {
        const canProceedFromEditor = await saveCurrentQuestionIfNeeded();
        if (!canProceedFromEditor) return;
      }
      if (viewMode === "settings" && settingsFormState.isDirty) {
        const settingsValid = await triggerSettingsValidation();
        if (settingsValid) {
          await handleSettingsSubmitRHF(updateQuizMetadata)();
          await new Promise((resolve) => setTimeout(resolve, 50));
        } else {
          toast({
            title: "Unsaved Settings",
            description:
              "Please fix errors in quiz settings before selecting a slide.",
            variant: "destructive",
          });
          return;
        }
      }
      setCurrentSlideIndex(index);
      setViewMode("editor");
    },
    [
      viewMode,
      currentSlideIndex,
      saveCurrentQuestionIfNeeded,
      settingsFormState.isDirty,
      triggerSettingsValidation,
      handleSettingsSubmitRHF,
      updateQuizMetadata,
      toast,
      setCurrentSlideIndex,
      setViewMode,
    ]
  );

  return {
    viewMode,
    setViewMode, // Expose setViewMode directly if needed for more complex scenarios
    navigateToSettings,
    navigateToAddSlide,
    navigateToEditorSlide,
  };
}
