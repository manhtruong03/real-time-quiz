// src/hooks/quiz-editor/useQuizCreator.ts
import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QuizMetadataSchema,
  QuizMetadataSchemaType,
  QuizVisibilityEnum,
} from "@/src/lib/schemas/quiz-settings.schema";
import type {
  QuestionHost,
  QuizStructureHost,
} from "@/src/lib/types/quiz-structure";
import { createDefaultQuestion } from "@/src/lib/game-utils/quiz-creation";

// Helper to create a default QuizStructureHost shell
const createDefaultQuizShell = (): QuizStructureHost => ({
  uuid: "", // Will be generated on actual save
  creator: "", // Will be set based on logged-in user
  creator_username: "",
  visibility: 0, // Default to Private (0)
  title: "",
  description: "",
  quizType: "quiz",
  cover: "",
  lobby_video: {
    youtube: {
      id: "",
      startTime: 0.0,
      endTime: 0.0,
      service: "youtube",
      fullUrl: "",
    },
  },
  questions: [],
  isValid: false,
  playAsGuest: true,
  type: "quiz",
  created: Date.now(),
  modified: Date.now(),
});

/**
 * Custom hook to manage the state and logic for the quiz creation/editing process.
 * Encapsulates the main quiz data (`QuizStructureHost`), the currently selected slide/view index,
 * and the React Hook Form instance for quiz metadata settings.
 */
export function useQuizCreator() {
  // State for the entire quiz structure being built/edited
  const [quizData, setQuizData] = useState<QuizStructureHost>(
    createDefaultQuizShell()
  );
  // State to track the currently selected slide index (-1 represents the main Quiz Settings view)
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1);

  // --- RHF Form Management specifically for Quiz Metadata ---
  const formMethods = useForm<QuizMetadataSchemaType>({
    resolver: zodResolver(QuizMetadataSchema),
    defaultValues: {
      // Initial form values match the default shell
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [],
      cover: quizData.cover || null,
    },
    mode: "onChange", // Validate on change for better UX
  });
  const { reset: resetForm, handleSubmit: handleMetadataSubmit } = formMethods;

  // Effect to sync the RHF form if the core quizData metadata changes externally
  // (e.g., loading an existing quiz, although load logic isn't implemented yet)
  useEffect(() => {
    console.log("useQuizCreator: Syncing form with quizData metadata");
    resetForm({
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      // tags: quizData.tags || [], // Assuming tags are part of quizData eventually
      cover: quizData.cover || null,
    });
  }, [
    quizData.title,
    quizData.description,
    quizData.visibility,
    quizData.cover,
    resetForm,
  ]);

  /**
   * Updates the core quizData state with validated data from the metadata form.
   * Intended to be called by the form's onSubmit handler.
   */
  const updateQuizMetadata = useCallback(
    (data: QuizMetadataSchemaType) => {
      console.log(
        "useQuizCreator: Updating Quiz Metadata state from form data"
      );
      setQuizData((prevData) => ({
        ...prevData,
        title: data.title,
        description: data.description ?? "",
        visibility: data.visibility === QuizVisibilityEnum.enum.PUBLIC ? 1 : 0,
        // tags: data.tags, // Update tags if/when managed here
        cover: data.cover ?? "",
        modified: Date.now(), // Update modification timestamp
      }));
    },
    [setQuizData]
  ); // Dependency: only the state setter function reference

  /**
   * Adds a new default question of the specified type to the quiz.
   * Updates the quizData state and sets the currentSlideIndex to the new question.
   * @param type - The type of question/slide to add.
   * @param isTrueFalse - Flag to specify the True/False quiz variant.
   * @returns The index of the newly added question.
   */
  const addQuestion = useCallback(
    (type: QuestionHost["type"], isTrueFalse: boolean = false): number => {
      console.log(
        `useQuizCreator: Adding question - Type: ${type}, Is T/F: ${isTrueFalse}`
      );
      const newQuestion = createDefaultQuestion(type, isTrueFalse);
      let newIndex = 0;
      setQuizData((prevData) => {
        // Ensure questions array exists
        const currentQuestions = prevData.questions || [];
        const updatedQuestions = [...currentQuestions, newQuestion];
        newIndex = updatedQuestions.length - 1; // Index of the newly added question
        console.log(
          `useQuizCreator: New question created at index ${newIndex}`,
          newQuestion
        );
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
      // Set index *after* state update is queued
      setCurrentSlideIndex(newIndex);
      return newIndex;
    },
    [setQuizData, setCurrentSlideIndex]
  ); // Dependencies

  /**
   * Resets the entire creator state back to a default empty quiz shell.
   */
  const resetCreatorState = useCallback(() => {
    const initialQuiz = createDefaultQuizShell();
    setQuizData(initialQuiz);
    resetForm({
      // Reset form to match the new shell
      title: initialQuiz.title,
      description: initialQuiz.description,
      visibility:
        initialQuiz.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [],
      cover: initialQuiz.cover || null,
    });
    setCurrentSlideIndex(-1); // Go back to settings view index
    console.log("useQuizCreator: State reset to default shell");
  }, [setQuizData, setCurrentSlideIndex, resetForm]);

  // Return state and functions to be used by the page component
  return {
    quizData,
    setQuizData, // Expose setter for potential advanced use cases (like loading)
    currentSlideIndex,
    setCurrentSlideIndex,
    formMethods, // RHF methods for the metadata form
    updateQuizMetadata, // Function to apply form data to state
    handleMetadataSubmit, // RHF's submit handler trigger
    addQuestion,
    resetCreatorState,
  };
}
