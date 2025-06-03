// src/lib/api-utils/quiz-transformer.ts
// ADD THESE CHANGES:
import type {
  QuizStructureHost,
  QuestionHost,
  // ChoiceHost, // No longer needed here if QuestionDTO is used
  // VideoDetailsHost, // No longer needed here
  // MediaItemHost, // No longer needed here
} from "@/src/lib/types/quiz-structure";
import type {
  QuizDTO,
  QuestionDTO,
  ChoiceDTO,
  VideoDetailDTO,
  ImageDetailDTO,
} from "@/src/lib/types/api";

// Utility function to generate unique keys for image uploads
const generateUniqueImageKey = (prefix: string, index?: number): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9); // Shorter random part
  if (index !== undefined) {
    return `${prefix}_${index}_${timestamp}_${randomSuffix}`;
  }
  return `${prefix}_${timestamp}_${randomSuffix}`;
};

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
              const imageDTO: ImageDetailDTO | undefined = choiceHost.image
                ? {
                    url: choiceHost.image.url || "", // Assuming url is always present if image object exists
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

      // Assuming media items are simple URLs for now as per QuestionDTO
      const mediaDTO: string[] | undefined =
        qHost.media && qHost.media.length > 0
          ? (qHost.media || [])
              .map((mediaHost) => mediaHost?.url || mediaHost?.id) // Prioritize URL, fallback to ID if it's an identifier
              .filter((item): item is string => !!item) // Filter out null/undefined
          : undefined;

      // ---- START: Logic for questionImageUploadKey and adding file to FormData ----
      let questionImageUploadKeyValue: string | null = null;
      let questionImageForDto: string | null = qHost.image || null;

      if (qHost.imageFile instanceof File) {
        questionImageUploadKeyValue = generateUniqueImageKey("q_img", index);
        formData.append(
          questionImageUploadKeyValue,
          qHost.imageFile,
          qHost.imageFile.name
        );
        questionImageForDto = null; // Set image to null in DTO as file is uploaded with key
        console.log(
          `[Transformer] Question ${index}: Appended imageFile '${qHost.imageFile.name}' with key '${questionImageUploadKeyValue}'`
        );
      } else if (qHost.questionImageUploadKey && qHost.image) {
        // This case handles if a key was somehow set but no new file (e.g., during UI state changes before save)
        // If a key exists AND an image URL also exists, and NO new file, it's ambiguous.
        // For safety, if a key is present, we assume the intent was to upload, and nullify the direct image URL in DTO.
        // However, without a qHost.imageFile, nothing would be appended to FormData for this key.
        // This state should ideally be prevented by robust UI logic.
        // For now, let's prioritize a new file upload. If no new file, and key exists, it's an edge case.
        // The API docs imply if `questionImageUploadKey` is present, `image` should be null.
        // So, if qHost.questionImageUploadKey is truthy, we should set image to null,
        // but a file should have been appended.
        // If qHost.questionImageUploadKey is present from previous state but imageFile is now null,
        // it means the file was removed; so questionImageUploadKey should also be nullified.
        if (!qHost.imageFile && qHost.questionImageUploadKey) {
          console.warn(
            `[Transformer] Question ${index}: questionImageUploadKey exists but no imageFile. Clearing key.`
          );
          questionImageUploadKeyValue = null; // Clear the key
          // image will be taken from qHost.image
        } else if (qHost.questionImageUploadKey) {
          // This branch implies qHost.imageFile was also present.
          questionImageUploadKeyValue = qHost.questionImageUploadKey;
          questionImageForDto = null;
        }
      }
      // ---- END: Logic for questionImageUploadKey ----

      const questionJsonDTO: QuestionDTO = {
        type: qHost.type,
        position: index,
        title:
          (qHost.type === "content" ? qHost.title : qHost.question) ||
          `Question ${index + 1}`,
        image: questionImageForDto, // Use the determined image URL or null
        questionImageUploadKey: questionImageUploadKeyValue, // Add the key to DTO
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

  // ---- START: Logic for coverImageUploadKey and adding file to FormData ----
  let coverImageUploadKeyValue: string | null = null;
  let coverImageForDto: string | null = quizState.cover || null;

  if (quizState.coverImageFile instanceof File) {
    coverImageUploadKeyValue = generateUniqueImageKey("cover_img");
    formData.append(
      coverImageUploadKeyValue,
      quizState.coverImageFile,
      quizState.coverImageFile.name
    );
    coverImageForDto = null; // Set cover to null in DTO as file is uploaded with key
    console.log(
      `[Transformer] Cover: Appended imageFile '${quizState.coverImageFile.name}' with key '${coverImageUploadKeyValue}'`
    );
  } else if (quizState.coverImageUploadKey && quizState.cover) {
    // Similar to question: if key exists but no file, clear key.
    if (!quizState.coverImageFile && quizState.coverImageUploadKey) {
      console.warn(
        `[Transformer] Cover: coverImageUploadKey exists but no imageFile. Clearing key.`
      );
      coverImageUploadKeyValue = null;
    } else if (quizState.coverImageUploadKey) {
      // implies coverImageFile was also present
      coverImageUploadKeyValue = quizState.coverImageUploadKey;
      coverImageForDto = null;
    }
  }
  // ---- END: Logic for coverImageUploadKey ----

  const quizDataForJson: QuizDTO = {
    title: quizState.title,
    visibility: quizState.visibility,
    questions: questionsForJsonDTO,
    description: quizState.description || undefined,
    status: (quizState as any).status || "DRAFT", // Type assertion if status is not on QuizStructureHost
    tags: quizState.tags || [], // Use quizState.tags directly
    cover: coverImageForDto, // Use the determined cover URL or null
    coverImageUploadKey: coverImageUploadKeyValue, // Add the key to DTO
    lobby_video: lobbyVideoJsonDTO,
    quizType: quizState.quizType,
    playAsGuest: quizState.playAsGuest,
    type: quizState.type,
    ...(quizState.uuid && { uuid: quizState.uuid }),
  };

  formData.append(
    "quizData",
    new Blob([JSON.stringify(quizDataForJson)], { type: "application/json" })
  );
  console.log(
    "[transformQuizStateToDTO] Appended quizData JSON part:",
    JSON.stringify(quizDataForJson, null, 2)
  );

  // The old logic for appending coverImageFile and questionImageFiles directly has been replaced
  // by the per-image key-based appending above.

  return formData;
}
