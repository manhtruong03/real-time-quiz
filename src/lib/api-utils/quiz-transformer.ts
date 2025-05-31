// src/lib/api-utils/quiz-transformer.ts
import type {
  QuizStructureHost,
  QuestionHost,
  ChoiceHost,
  // VideoDetailsHost, // Already imported if types/quiz-structure is correct
  // MediaItemHost,   // Already imported if types/quiz-structure is correct
} from "@/src/lib/types/quiz-structure";
import type {
  QuizDTO,
  QuestionDTO,
  ChoiceDTO,
  VideoDetailDTO,
  ImageDetailDTO,
} from "@/src/lib/types/api"; // Import API DTO types

/**
 * Transforms the internal frontend quiz state into FormData
 * expected by the backend API (/api/quizzes) for multipart/form-data requests.
 * @param quizState - The current state of the quiz from useQuizCreator.
 * @returns A FormData object ready to be sent to the backend.
 */
export function transformQuizStateToDTO(
  quizState: QuizStructureHost
): FormData {
  const formData = new FormData();

  // --- Prepare Questions DTO for the JSON part ---
  const questionsForJsonDTO: QuestionDTO[] = quizState.questions.map(
    (qHost, index): QuestionDTO => {
      const choicesDTO: ChoiceDTO[] | undefined =
        qHost.type !== "content"
          ? qHost.choices.map((choiceHost): ChoiceDTO => {
              // Assuming choice images remain URL-based as per current ChoiceHost structure
              const imageDTO: ImageDetailDTO | undefined = choiceHost.image
                ? {
                    url: choiceHost.image.url || "",
                    altText: choiceHost.image.altText,
                    contentType: choiceHost.image.contentType,
                  }
                : undefined;

              return {
                answer: choiceHost.answer,
                image: imageDTO,
                correct: choiceHost.correct,
              };
            })
          : undefined;

      const videoDTO: VideoDetailDTO | undefined | null = qHost.video
        ? {
            id: qHost.video.id,
            startTime: qHost.video.startTime,
            endTime: qHost.video.endTime,
            service: qHost.video.service,
            fullUrl: qHost.video.fullUrl,
          }
        : null;

      const mediaDTO: string[] | undefined =
        qHost.media && qHost.media.length > 0
          ? (qHost.media || [])
              .map((mediaHost) => mediaHost?.url || mediaHost?.id)
              .filter((item): item is string => !!item)
          : undefined;

      const questionJsonDTO: QuestionDTO = {
        type: qHost.type,
        position: index,
        title:
          (qHost.type === "content" ? qHost.title : qHost.question) ||
          `Question ${index + 1}`,
        // If qHost.imageFile exists, set image to null in JSON, file will be sent separately.
        // Otherwise, use the existing qHost.image URL.
        image: qHost.imageFile ? null : qHost.image || null,
        ...(qHost.type === "content" && {
          description: qHost.description || "",
        }),
        ...(qHost.type !== "content" && { time: qHost.time ?? 20000 }),
        ...(qHost.type !== "content" &&
          qHost.type !== "survey" && {
            pointsMultiplier: qHost.pointsMultiplier ?? 1,
          }),
        ...(qHost.type !== "content" && choicesDTO && { choices: choicesDTO }),
        ...(videoDTO && { video: videoDTO }),
        ...(mediaDTO && mediaDTO.length > 0 && { media: mediaDTO }),
      };
      return questionJsonDTO;
    }
  );

  // --- Prepare Lobby Video DTO for the JSON part ---
  const lobbyVideoJsonDTO: QuizDTO["lobby_video"] | null = quizState.lobby_video
    ?.youtube
    ? {
        youtube: {
          id: quizState.lobby_video.youtube.id,
          startTime: quizState.lobby_video.youtube.startTime,
          endTime: quizState.lobby_video.youtube.endTime,
          service: quizState.lobby_video.youtube.service,
          fullUrl: quizState.lobby_video.youtube.fullUrl,
        },
      }
    : null;

  // --- Construct the main Quiz DTO for the JSON part ---
  const quizDataForJson: QuizDTO = {
    title: quizState.title,
    visibility: quizState.visibility,
    questions: questionsForJsonDTO,
    description: quizState.description || undefined,
    status: (quizState as any).status || "DRAFT",
    tags: (quizState as any).tags || [],
    // If quizState.coverImageFile exists, set cover to null in JSON, file will be sent separately.
    // Otherwise, use the existing quizState.cover URL.
    cover: quizState.coverImageFile ? null : quizState.cover || null,
    lobby_video: lobbyVideoJsonDTO,
    quizType: quizState.quizType,
    playAsGuest: quizState.playAsGuest,
    type: quizState.type, // Confirm if this is needed or if quizType suffices
    ...(quizState.uuid && { uuid: quizState.uuid }),
  };

  // Append the JSON part
  formData.append("quizData", JSON.stringify(quizDataForJson));
  console.log(
    "[transformQuizStateToDTO] Appended quizData:",
    JSON.stringify(quizDataForJson, null, 2)
  );

  // Append the cover image file, if it exists
  if (quizState.coverImageFile instanceof File) {
    formData.append(
      "coverImageFile",
      quizState.coverImageFile,
      quizState.coverImageFile.name
    );
    console.log(
      `[transformQuizStateToDTO] Appended coverImageFile: ${quizState.coverImageFile.name}`
    );
  }

  // Append question image files, if they exist, in order
  quizState.questions.forEach((qHost, index) => {
    if (qHost.imageFile instanceof File) {
      formData.append(
        "questionImageFiles",
        qHost.imageFile,
        qHost.imageFile.name
      );
      console.log(
        `[transformQuizStateToDTO] Appended questionImageFiles (for q index ${index}): ${qHost.imageFile.name}`
      );
    }
  });

  return formData;
}
