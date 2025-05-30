// src/hooks/quiz-editor/useQuizCreator.ts
import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QuizMetadataSchema,
  QuizMetadataSchemaType, // This type will now include coverImageFile due to schema update
  QuizVisibilityEnum,
} from "@/src/lib/schemas/quiz-settings.schema";
import type {
  QuestionHost,
  QuizStructureHost,
  ChoiceHost,
} from "@/src/lib/types/quiz-structure"; // QuizStructureHost and QuestionHost now include File fields
// QuestionFormContextType will include imageFile due to schema update
import type {
  QuestionFormContextType,
  ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import { createDefaultQuestion } from "@/src/lib/game-utils/quiz-creation";

const createDefaultQuizShell = (): QuizStructureHost => ({
  uuid: "",
  creator: "",
  creator_username: "",
  visibility: 0,
  title: "",
  description: "",
  quizType: "quiz",
  cover: "",
  coverImageFile: null, // Initialize new field
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

export function useQuizCreator() {
  const [quizData, setQuizData] = useState<QuizStructureHost>(
    createDefaultQuizShell()
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1);

  const formMethods = useForm<QuizMetadataSchemaType>({
    resolver: zodResolver(QuizMetadataSchema),
    defaultValues: {
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [],
      cover: quizData.cover || null,
      coverImageFile: quizData.coverImageFile || null, // Initialize in RHF
    },
    mode: "onChange",
  });

  const { reset: resetForm, handleSubmit: handleMetadataSubmitRHF } =
    formMethods; // Renamed to avoid conflict

  useEffect(() => {
    resetForm({
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: (quizData as any).tags || [],
      cover: quizData.cover || null,
      coverImageFile: quizData.coverImageFile || null, // Reset in RHF
    });
  }, [
    quizData.title,
    quizData.description,
    quizData.visibility,
    quizData.cover,
    quizData.coverImageFile, // Add to dependencies
    resetForm,
  ]);

  const updateQuizMetadata = useCallback(
    (data: QuizMetadataSchemaType) => {
      // data now includes coverImageFile
      setQuizData((prevData) => ({
        ...prevData,
        title: data.title,
        description: data.description ?? "",
        visibility: data.visibility === QuizVisibilityEnum.enum.PUBLIC ? 1 : 0,
        tags: data.tags,
        cover: data.cover ?? "", // This would be the objectURL or actual URL
        coverImageFile: data.coverImageFile, // Persist the File object
        modified: Date.now(),
      }));
    },
    [setQuizData]
  );

  const addQuestion = useCallback(
    (type: QuestionHost["type"], isTrueFalse: boolean = false): number => {
      // createDefaultQuestion should ideally initialize imageFile: null
      const newQuestion = createDefaultQuestion(type, isTrueFalse);
      if (!("imageFile" in newQuestion)) {
        (newQuestion as QuestionHost).imageFile = null; // Ensure it's there
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
        // finalQuestionData comes from QuestionFormManagement, which should include image and imageFile
        updatedQuestions[index] = finalQuestionData;
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
          newCurrentSlideIndexValue = currentSlideIndex;
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
        const duplicatedQuestion = JSON.parse(
          JSON.stringify(originalQuestion)
        ) as QuestionHost;

        // IMPORTANT: Reset imageFile for the duplicated question if the original had one,
        // as the File object itself cannot be truly "duplicated" by JSON.stringify.
        // The user will need to re-select a file for the duplicated question if they want a file.
        // The image URL (preview or actual) will be copied.
        if (originalQuestion.imageFile) {
          duplicatedQuestion.imageFile = null; // Or undefined, depending on your type preference
          // Optionally, you might want to keep the 'image' (URL) field if it was an objectURL from the original.
          // However, for a true duplicate intending a new file, clearing `image` might also be desired if imageFile was present.
          // For now, let's assume `image` (the URL) is copied, but `imageFile` is reset.
        }

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
      title: initialQuiz.title,
      description: initialQuiz.description,
      visibility:
        initialQuiz.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [],
      cover: initialQuiz.cover || null,
      coverImageFile: null, // Reset in RHF
    });
    setCurrentSlideIndex(-1);
    console.log("useQuizCreator: State reset to default shell");
  }, [setQuizData, setCurrentSlideIndex, resetForm]);

  return {
    quizData,
    setQuizData,
    currentSlideIndex,
    setCurrentSlideIndex,
    formMethods,
    updateQuizMetadata,
    handleMetadataSubmit: handleMetadataSubmitRHF, // Expose RHF's handleSubmit
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    resetCreatorState,
  };
}
