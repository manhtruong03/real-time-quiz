// src/hooks/quiz-editor/form-management/questionFormDefaultValues.ts
import type {
  QuizStructureHost,
  QuestionHost,
  ChoiceHost,
} from "@/src/lib/types/quiz-structure";
import type {
  QuestionFormContextType,
  VideoSchemaType,
  MediaItemSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import {
  createDefaultQuestion,
  DEFAULT_TIME_LIMIT,
} from "@/src/lib/game-utils/quiz-creation";

export const getDefaultValuesForEditor = (
  quizData: QuizStructureHost | null,
  currentSlideIndex: number
): QuestionFormContextType => {
  const questionData = quizData?.questions?.[currentSlideIndex];

  const defaultVideoSchemaValue: VideoSchemaType | null = null;
  const defaultMediaSchemaValue: MediaItemSchemaType[] = [];

  if (questionData) {
    let correctIdx = -1;
    if (questionData.type === "quiz" && questionData.choices) {
      correctIdx = questionData.choices.findIndex((c) => c.correct);
    }
    const defaultChoices =
      questionData.choices?.map((c: ChoiceHost) => ({
        answer: c.answer ?? "",
        image: c.image ?? undefined,
        correct: c.correct ?? false,
      })) ?? [];

    const videoValue = questionData.video
      ? {
          id: questionData.video.id || undefined,
          startTime: questionData.video.startTime ?? 0.0,
          endTime: questionData.video.endTime ?? 0.0,
          service: questionData.video.service ?? "youtube",
          fullUrl: questionData.video.fullUrl ?? "",
        }
      : defaultVideoSchemaValue;

    const mediaValue =
      questionData.media?.map((m) => ({
        type: m.type,
        url: m.url,
        id: m.id,
        altText: m.altText,
        zIndex: m.zIndex,
        isColorOnly: m.isColorOnly,
        contentType: m.contentType,
        origin: m.origin,
        externalRef: m.externalRef,
        resources: m.resources,
        width: m.width,
        height: m.height,
      })) ?? defaultMediaSchemaValue;

    let formQuestion = "";
    let formTitle = "";
    let formDescription = "";

    if (questionData.type === "content") {
      formTitle = questionData.title ?? "";
      formDescription = questionData.description ?? "";
    } else if (
      questionData.type === "quiz" ||
      questionData.type === "jumble" ||
      questionData.type === "open_ended" ||
      questionData.type === "survey"
    ) {
      formQuestion = questionData.question ?? "";
      formTitle = (questionData as any).title ?? "";
      formDescription = (questionData as any).description ?? "";
    }

    return {
      type: questionData.type,
      image: questionData.image ?? null,
      imageFile: questionData.imageFile || null,
      questionImageUploadKey: questionData.questionImageUploadKey || null,
      video: videoValue,
      media: mediaValue,
      question: formQuestion,
      title: formTitle,
      description: formDescription,
      time: questionData.time ?? DEFAULT_TIME_LIMIT,
      pointsMultiplier:
        questionData.pointsMultiplier ??
        (questionData.type === "survey" || questionData.type === "content"
          ? 0
          : 1),
      choices: defaultChoices,
      correctChoiceIndex: correctIdx === -1 ? -1 : correctIdx,
    };
  } else {
    const defaultNewQuestion = createDefaultQuestion("quiz") as QuestionHost;
    return {
      type: defaultNewQuestion.type,
      image: defaultNewQuestion.image ?? null,
      imageFile: defaultNewQuestion.imageFile || null,
      questionImageUploadKey: defaultNewQuestion.questionImageUploadKey || null,
      video: defaultNewQuestion.video
        ? {
            id: defaultNewQuestion.video.id,
            startTime: defaultNewQuestion.video.startTime ?? 0.0,
            endTime: defaultNewQuestion.video.endTime ?? 0.0,
            service: defaultNewQuestion.video.service ?? "youtube",
            fullUrl: defaultNewQuestion.video.fullUrl ?? "",
          }
        : defaultVideoSchemaValue,
      media:
        defaultNewQuestion.media?.map((m) => ({
          type: m.type,
          url: m.url,
          id: m.id,
          altText: m.altText,
          zIndex: m.zIndex,
          isColorOnly: m.isColorOnly,
          contentType: m.contentType,
          origin: m.origin,
          externalRef: m.externalRef,
          resources: m.resources,
          width: m.width,
          height: m.height,
        })) ?? defaultMediaSchemaValue,
      question: defaultNewQuestion.question ?? "",
      title: (defaultNewQuestion as any).title ?? "",
      description: (defaultNewQuestion as any).description ?? "",
      time: defaultNewQuestion.time ?? DEFAULT_TIME_LIMIT,
      pointsMultiplier: defaultNewQuestion.pointsMultiplier ?? 1,
      choices: defaultNewQuestion.choices.map((c) => ({
        answer: c.answer ?? "",
        image: c.image,
        correct: c.correct ?? false,
      })),
      correctChoiceIndex:
        defaultNewQuestion.choices.findIndex((c) => c.correct) ?? -1,
    };
  }
};
