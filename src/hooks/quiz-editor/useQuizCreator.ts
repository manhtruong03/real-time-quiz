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
  // ChoiceHost, // Not directly used for modification here
} from "@/src/lib/types/quiz-structure";
// QuestionFormContextType might also need awareness if it's directly used for defaults before full QuestionHost construction
// import type {
//   QuestionFormContextType,
//   ChoiceHostSchemaType,
// } from "@/src/lib/schemas/quiz-question.schema";
import { createDefaultQuestion } from "@/src/lib/game-utils/quiz-creation";

const createDefaultQuizShell = (): QuizStructureHost => ({
  uuid: "", // Will be set by backend upon save
  creator: "", // Will be set by backend
  creator_username: "", // Will be set by backend
  visibility: 0, // Default to Private (0)
  title: "",
  description: "",
  quizType: "quiz", // Default quizType
  cover: "", // URL string, initially empty or null
  coverImageFile: null,
  coverImageUploadKey: null, // Initialize new field
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
  isValid: false, // Backend might set this
  playAsGuest: true, // Default
  type: "quiz", // Default, seems redundant with quizType but present in mock
  created: Date.now(),
  modified: Date.now(),
  tags: [], // Initialize tags as empty array
});

export function useQuizCreator() {
  const [quizData, setQuizData] = useState<QuizStructureHost>(
    createDefaultQuizShell()
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1); // -1 for settings/add view

  const formMethods = useForm<QuizMetadataSchemaType>({
    resolver: zodResolver(QuizMetadataSchema),
    defaultValues: {
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: quizData.tags || [],
      cover: quizData.cover || null,
      coverImageFile: quizData.coverImageFile || null,
      coverImageUploadKey: quizData.coverImageUploadKey || null, // Initialize in RHF
    },
    mode: "onChange", // Or "onBlur"
  });

  const { reset: resetForm, handleSubmit: handleMetadataSubmitRHF } =
    formMethods;

  useEffect(() => {
    // Sync RHF settings form with quizData
    resetForm({
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: quizData.tags || [],
      cover: quizData.cover || null,
      coverImageFile: quizData.coverImageFile || null,
      coverImageUploadKey: quizData.coverImageUploadKey || null, // Sync in RHF reset
    });
  }, [
    quizData.title,
    quizData.description,
    quizData.visibility,
    quizData.tags, // Added tags
    quizData.cover,
    quizData.coverImageFile,
    quizData.coverImageUploadKey, // Add to dependencies
    resetForm,
  ]);

  const updateQuizMetadata = useCallback(
    (data: QuizMetadataSchemaType) => {
      // data now includes coverImageFile and coverImageUploadKey from RHF
      setQuizData((prevData) => ({
        ...prevData,
        title: data.title,
        description: data.description ?? "",
        visibility: data.visibility === QuizVisibilityEnum.enum.PUBLIC ? 1 : 0,
        tags: data.tags, // Persist tags
        cover: data.cover ?? "", // This is the objectURL or actual URL from MediaManager
        coverImageFile: data.coverImageFile, // Persist the File object
        coverImageUploadKey: data.coverImageUploadKey, // Persist the upload key
        modified: Date.now(),
      }));
    },
    [setQuizData]
  );

  const addQuestion = useCallback(
    (type: QuestionHost["type"], isTrueFalse: boolean = false): number => {
      const newQuestion = createDefaultQuestion(type, isTrueFalse);
      // Ensure questionImageUploadKey is initialized in the new question object
      // createDefaultQuestion should ideally handle this, but we can ensure it here.
      if (!("questionImageUploadKey" in newQuestion)) {
        (newQuestion as QuestionHost).questionImageUploadKey = null;
      }
      if (!("imageFile" in newQuestion)) {
        (newQuestion as QuestionHost).imageFile = null;
      }

      let newIndex = 0;
      setQuizData((prevData) => {
        const currentQuestions = prevData.questions || [];
        const updatedQuestions = [...currentQuestions, newQuestion];
        newIndex = updatedQuestions.length - 1;
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
      return newIndex;
    },
    [setQuizData]
  );

  const updateQuestion = useCallback(
    (index: number, finalQuestionData: QuestionHost | null) => {
      console.log(
        `[useQuizCreator updateQuestion] Called for index ${index}. Incoming type: ${
          finalQuestionData?.type ?? "null"
        }`
      );
      if (finalQuestionData === null) {
        console.error(
          `[useQuizCreator] Update failed for index ${index} because incoming data was null.`
        );
        return;
      }
      // Ensure questionImageUploadKey is part of finalQuestionData if imageFile exists, or null otherwise.
      // This should ideally be handled by useQuestionFormManagement before calling this.
      // For robustness, we can double-check here:
      if (
        finalQuestionData.imageFile &&
        !finalQuestionData.questionImageUploadKey
      ) {
        // This scenario is less likely if MediaManager and useQuestionFormManagement work correctly,
        // as MediaManager should set the key when imageFile is set.
        // If this happens, it implies a potential state inconsistency that needs debugging upstream.
        console.warn(
          `[useQuizCreator] Updating question ${index}: imageFile exists but questionImageUploadKey is missing. The key should be generated by MediaManager/QuestionForm.`
        );
      } else if (
        !finalQuestionData.imageFile &&
        finalQuestionData.questionImageUploadKey
      ) {
        // If imageFile was removed, the key should also be nullified.
        finalQuestionData.questionImageUploadKey = null;
        console.log(
          `[useQuizCreator] Updating question ${index}: imageFile removed, nullified questionImageUploadKey.`
        );
      }

      setQuizData((prevData) => {
        if (index < 0 || index >= prevData.questions.length) {
          console.error(
            `[useQuizCreator] Invalid index ${index} for updateQuestion.`
          );
          return prevData;
        }
        console.log(
          `[useQuizCreator] Successfully updating question at index ${index}`
        );
        const updatedQuestions = [...prevData.questions];
        updatedQuestions[index] = finalQuestionData; // finalQuestionData should include image, imageFile, and questionImageUploadKey
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
    },
    [setQuizData]
  );

  const deleteQuestion = useCallback(
    (indexToDelete: number) => {
      console.log(
        `[useQuizCreator] Attempting to delete question at index: ${indexToDelete}`
      );
      let newCurrentSlideIndexValue = currentSlideIndex;

      setQuizData((prevData) => {
        if (indexToDelete < 0 || indexToDelete >= prevData.questions.length) {
          console.warn(
            `[useQuizCreator] Invalid index ${indexToDelete} for deletion. No changes made.`
          );
          newCurrentSlideIndexValue = prevData.questions.length > 0 ? 0 : -1;
          return prevData;
        }

        const updatedQuestions = prevData.questions.filter(
          (_, index) => index !== indexToDelete
        );

        if (updatedQuestions.length === 0) {
          newCurrentSlideIndexValue = -1;
        } else if (indexToDelete < currentSlideIndex) {
          newCurrentSlideIndexValue = currentSlideIndex - 1;
        } else if (indexToDelete === currentSlideIndex) {
          newCurrentSlideIndexValue = Math.min(
            indexToDelete,
            updatedQuestions.length - 1
          );
          if (newCurrentSlideIndexValue < 0 && updatedQuestions.length > 0)
            newCurrentSlideIndexValue = 0;
          else if (updatedQuestions.length === 0)
            newCurrentSlideIndexValue = -1;
        } else {
          newCurrentSlideIndexValue = currentSlideIndex; // Stays the same if deleting after current
        }
        console.log(
          `[useQuizCreator internal] Intended new currentSlideIndex after deletion: ${newCurrentSlideIndexValue}`
        );
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
      // It's important that setCurrentSlideIndex is called *after* setQuizData has completed
      // to avoid potential race conditions if the view manager relies on quizData.questions.length
      // A useEffect in the parent page might be better to handle this based on quizData change.
      // For now, direct call:
      setCurrentSlideIndex(newCurrentSlideIndexValue);
    },
    [setQuizData, currentSlideIndex, setCurrentSlideIndex]
  );

  const duplicateQuestion = useCallback(
    (indexToDuplicate: number): number => {
      console.log(
        `[useQuizCreator] Attempting to duplicate question at index: ${indexToDuplicate}`
      );
      let newSlideIndex = -1;

      setQuizData((prevData) => {
        if (
          indexToDuplicate < 0 ||
          indexToDuplicate >= prevData.questions.length
        ) {
          console.warn(
            `[useQuizCreator] Invalid index ${indexToDuplicate} for duplication. No changes made.`
          );
          return prevData;
        }

        const originalQuestion = prevData.questions[indexToDuplicate];
        // Deep clone the question. JSON.parse(JSON.stringify()) will strip File objects.
        const duplicatedQuestionData = JSON.parse(
          JSON.stringify(originalQuestion)
        ) as Omit<QuestionHost, "imageFile">;

        const duplicatedQuestion: QuestionHost = {
          ...duplicatedQuestionData,
          id: undefined, // Ensure new question gets a new ID from backend if saved, or generate client-side UUID if needed for keys
          imageFile: null, // New question starts without a File object, even if original had one.
          questionImageUploadKey: null, // Correspondingly, no upload key for the duplicate initially.
          // The user must explicitly add/upload an image for the duplicated question.
          // image: originalQuestion.image, // Keep the original image URL for visual consistency if it was a URL.
          // If original had an imageFile, originalQuestion.image would be an objectURL, which is fine to copy.
        };
        // If originalQuestion.imageFile existed, its objectURL was in originalQuestion.image.
        // We keep originalQuestion.image, but imageFile and questionImageUploadKey are reset for the duplicate.

        const updatedQuestions = [...prevData.questions];
        const insertionPoint = indexToDuplicate + 1;
        updatedQuestions.splice(insertionPoint, 0, duplicatedQuestion);

        newSlideIndex = insertionPoint;

        console.log(
          `[useQuizCreator] Duplicated question inserted at index: ${newSlideIndex}`
        );
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });

      setCurrentSlideIndex(newSlideIndex);
      return newSlideIndex;
    },
    [setQuizData, setCurrentSlideIndex]
  );

  const resetCreatorState = useCallback(() => {
    const initialQuiz = createDefaultQuizShell();
    setQuizData(initialQuiz);
    resetForm({
      // RHF settings form reset
      title: initialQuiz.title,
      description: initialQuiz.description,
      visibility:
        initialQuiz.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: initialQuiz.tags || [],
      cover: initialQuiz.cover || null,
      coverImageFile: null,
      coverImageUploadKey: null, // Reset key in RHF
    });
    setCurrentSlideIndex(-1);
    console.log("useQuizCreator: State reset to default shell");
  }, [setQuizData, setCurrentSlideIndex, resetForm]);

  return {
    quizData,
    setQuizData,
    currentSlideIndex,
    setCurrentSlideIndex,
    formMethods, // RHF methods for Quiz Settings form
    updateQuizMetadata, // For Quiz Settings
    handleMetadataSubmit: handleMetadataSubmitRHF, // For Quiz Settings
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    resetCreatorState,
  };
}
