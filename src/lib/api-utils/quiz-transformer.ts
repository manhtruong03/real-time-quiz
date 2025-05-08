// src/lib/api-utils/quiz-transformer.ts
import type {
  QuizStructureHost,
  QuestionHost,
  ChoiceHost,
  VideoDetailsHost, // Assuming this exists in quiz-structure.ts
  MediaItemHost, // Assuming this exists in quiz-structure.ts
} from "@/src/lib/types/quiz-structure";
import type {
  QuizDTO,
  QuestionDTO,
  ChoiceDTO,
  VideoDetailDTO,
  ImageDetailDTO,
} from "@/src/lib/types/api"; // Import API DTO types

/**
 * Transforms the internal frontend quiz state into the DTO format
 * expected by the backend API (/api/quizzes).
 * @param quizState - The current state of the quiz from useQuizCreator.
 * @returns A QuizDTO object ready to be sent to the backend.
 */
export function transformQuizStateToDTO(quizState: QuizStructureHost): QuizDTO {
  const questionsDTO: QuestionDTO[] = quizState.questions.map(
    (qHost, index): QuestionDTO => {
      // --- Map Choices ---
      const choicesDTO: ChoiceDTO[] | undefined =
        qHost.type !== "content"
          ? qHost.choices.map((choiceHost): ChoiceDTO => {
              const imageDTO: ImageDetailDTO | undefined = choiceHost.image
                ? {
                    url: choiceHost.image.url || "", // Use provided URL or default empty
                    altText: choiceHost.image.altText,
                    contentType: choiceHost.image.contentType,
                  }
                : undefined;

              return {
                answer: choiceHost.answer,
                image: imageDTO,
                // For Quiz type, 'correct' is determined by correctChoiceIndex later if needed,
                // but ChoiceDTO requires a boolean. We map the host's value directly.
                correct: choiceHost.correct,
              };
            })
          : undefined; // Content slides have no choices

      // --- Map Video ---
      const videoDTO: VideoDetailDTO | undefined | null = qHost.video
        ? {
            id: qHost.video.id,
            startTime: qHost.video.startTime,
            endTime: qHost.video.endTime,
            service: qHost.video.service,
            fullUrl: qHost.video.fullUrl,
          }
        : null;

      // --- Map Media (assuming API expects simple string array of URLs/IDs) ---
      const mediaDTO: string[] | undefined =
        qHost.media && qHost.media.length > 0
          ? (qHost.media || [])
              .map((mediaHost) => mediaHost?.url || mediaHost?.id)
              .filter((item): item is string => !!item)
          : undefined; // Send undefined if empty

      // --- Construct QuestionDTO conditionally ---
      const questionDTO: QuestionDTO = {
        // Common fields
        type: qHost.type,
        position: index,
        // Title: Use 'title' for content, 'question' for others. Fallback provided.
        title:
          (qHost.type === "content" ? qHost.title : qHost.question) ||
          `Question ${index + 1}`,
        image: qHost.image || null, // Ensure null if undefined/empty
        // Conditionally add fields based on type
        ...(qHost.type === "content" && {
          description: qHost.description || "",
        }), // Only add description for content
        ...(qHost.type !== "content" && { time: qHost.time ?? 20000 }), // Add time unless content
        ...(qHost.type !== "content" &&
          qHost.type !== "survey" && {
            pointsMultiplier: qHost.pointsMultiplier ?? 1,
          }), // Add points unless content/survey
        ...(qHost.type !== "content" && choicesDTO && { choices: choicesDTO }), // Add choices unless content
        ...(videoDTO && { video: videoDTO }), // Add video if it exists
        ...(mediaDTO && mediaDTO.length > 0 && { media: mediaDTO }), // Add media if it exists and isn't empty
      };

      return questionDTO;
    }
  );

  // --- Map Lobby Video ---
  const lobbyVideoDTO: QuizDTO["lobby_video"] | null = quizState.lobby_video
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

  // --- Construct Final QuizDTO ---
  const quizDTO: QuizDTO = {
    // Required fields
    title: quizState.title,
    visibility: quizState.visibility,
    questions: questionsDTO,
    // Optional fields from QuizStructureHost / QuizMetadataSchemaType
    description: quizState.description || undefined,
    status: (quizState as any).status || "DRAFT", // Default to DRAFT
    tags: (quizState as any).tags || [],
    cover: quizState.cover || null,
    lobby_video: lobbyVideoDTO,
    quizType: quizState.quizType,
    playAsGuest: quizState.playAsGuest,
    type: quizState.type,
    // Include UUID if updating an existing quiz
    ...(quizState.uuid && { uuid: quizState.uuid }),
  };

  return quizDTO;
}
