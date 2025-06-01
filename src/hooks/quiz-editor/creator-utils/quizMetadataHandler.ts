// src/hooks/quiz-editor/creator-utils/quizMetadataHandler.ts
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QuizMetadataSchema,
  QuizMetadataSchemaType,
  QuizVisibilityEnum,
} from "@/src/lib/schemas/quiz-settings.schema";
import type { QuizStructureHost } from "@/src/lib/types/quiz-structure";

interface UseQuizMetadataFormArgs {
  quizData: QuizStructureHost;
  setQuizData: React.Dispatch<React.SetStateAction<QuizStructureHost>>;
}

export function useQuizMetadataForm({
  quizData,
  setQuizData,
}: UseQuizMetadataFormArgs) {
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
      coverImageUploadKey: quizData.coverImageUploadKey || null,
    },
    mode: "onChange",
  });

  const { reset: resetMetadataForm, handleSubmit: handleMetadataSubmitRHF } =
    formMethods;

  useEffect(() => {
    resetMetadataForm({
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: quizData.tags || [],
      cover: quizData.cover || null,
      coverImageFile: quizData.coverImageFile || null,
      coverImageUploadKey: quizData.coverImageUploadKey || null,
    });
  }, [
    quizData.title,
    quizData.description,
    quizData.visibility,
    quizData.tags,
    quizData.cover,
    quizData.coverImageFile,
    quizData.coverImageUploadKey,
    resetMetadataForm,
  ]);

  const updateQuizMetadataCallback = useCallback(
    (data: QuizMetadataSchemaType) => {
      setQuizData((prevData) => ({
        ...prevData,
        title: data.title,
        description: data.description ?? "",
        visibility: data.visibility === QuizVisibilityEnum.enum.PUBLIC ? 1 : 0,
        tags: data.tags,
        cover: data.cover ?? "",
        coverImageFile: data.coverImageFile,
        coverImageUploadKey: data.coverImageUploadKey,
        modified: Date.now(),
      }));
    },
    [setQuizData]
  );

  const handleMetadataSubmit = handleMetadataSubmitRHF(
    updateQuizMetadataCallback
  );

  return {
    metadataFormMethods: formMethods,
    handleMetadataSubmit,
    updateQuizMetadataDirectly: updateQuizMetadataCallback, // This is the raw callback
    resetMetadataForm,
  };
}
