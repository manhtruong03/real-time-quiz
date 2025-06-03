// src/lib/game-utils/question-type-transformer.ts
import type { QuestionHost } from "@/src/lib/types";
import type {
  QuestionFormContextType,
  // ChoiceHostSchemaType, // Not directly used in this version of the snippet
} from "@/src/lib/schemas/quiz-question.schema";
import { createDefaultChoice, DEFAULT_TIME_LIMIT } from "./quiz-creation";

export function transformQuestionDataForType(
  currentData: QuestionFormContextType,
  targetType: QuestionHost["type"],
  isTargetTrueFalse: boolean = false
): QuestionFormContextType {
  console.log(
    `[Transformer] Transforming from ${currentData.type} to ${targetType}${
      isTargetTrueFalse && targetType === "quiz" ? " (T/F)" : ""
    }.`
  );

  const newFormData: QuestionFormContextType = {
    image: currentData.image,
    imageFile: currentData.imageFile,
    questionImageUploadKey: currentData.questionImageUploadKey ?? null,
    video: currentData.video,
    media: currentData.media,
    type: targetType,
    question:
      currentData.type === "content" ? currentData.title : currentData.question,
    title:
      targetType === "content"
        ? currentData.question || currentData.title
        : undefined,
    description: targetType === "content" ? currentData.description : undefined,
    time: currentData.time ?? DEFAULT_TIME_LIMIT, // User's time or general default
    pointsMultiplier: currentData.pointsMultiplier ?? 1,
    choices: [...(currentData.choices ?? []).map((c) => ({ ...c }))],
    correctChoiceIndex: currentData.correctChoiceIndex ?? -1,
  };

  // General field setup based on targetType
  if (targetType === "content") {
    newFormData.title =
      newFormData.title || // Preserve if already set (e.g. from currentData.question if current was 'content')
      currentData.title || // Fallback to currentData.title
      "Informational Slide";
    newFormData.description =
      newFormData.description || // Preserve if already set
      currentData.description || // Fallback
      "Add your content here...";
    newFormData.question = undefined; // Content slides don't have a 'question' field in this model
  } else {
    // For non-content types
    newFormData.question =
      newFormData.question || // Preserve if already set (e.g. from currentData.question)
      (currentData.type === "content" ? currentData.title : "New Question..."); // If coming from content, use its title
    newFormData.title = undefined;
    newFormData.description = undefined;
  }

  // Points Multiplier
  if (targetType === "survey" || targetType === "content") {
    newFormData.pointsMultiplier = 0;
  } else if (
    newFormData.pointsMultiplier === 0 &&
    (currentData.type === "survey" || currentData.type === "content")
  ) {
    // If transforming from a type that had 0 points to one that should have points
    newFormData.pointsMultiplier = 1; // Default to 1x
  }
  // If pointsMultiplier is already set from currentData (e.g., user chose 2x), it's preserved unless targetType is survey/content.

  // --- REFINED TIME LIMIT LOGIC ---
  if (targetType === "content") {
    newFormData.time = 0; // Content slides always have 0 time.
  } else {
    // For all non-content target types:
    // newFormData.time currently holds `currentData.time ?? DEFAULT_TIME_LIMIT`.
    // Ensure it's a positive value if it's not content.
    // Zod validation will also check min/max positive constraints.
    if (newFormData.time == null || newFormData.time <= 0) {
      // `== null` checks for undefined or null
      // also catches 0 or negative for non-content.
      newFormData.time = DEFAULT_TIME_LIMIT; // Fallback to a general positive default.
    }
  }
  // Note: The Jumble-specific time override (forcing 60k/90k/120k) has been removed.
  // The .default(60000) in JumbleQuestionSchema will apply if Zod receives 'undefined' for time.
  // This logic ensures a number (user's choice or DEFAULT_TIME_LIMIT) is passed to Zod.

  // Choices and Correctness Logic (as per last fully corrected version)
  if (targetType === "quiz") {
    if (isTargetTrueFalse) {
      newFormData.question = newFormData.question || "True or False: ...";
      newFormData.choices = [
        createDefaultChoice(true, "True"),
        createDefaultChoice(false, "False"),
      ];
      newFormData.correctChoiceIndex = 0;
    } else {
      // Standard Quiz logic
      newFormData.question = newFormData.question || "Quiz Question...";
      if (newFormData.choices.length === 0) {
        newFormData.choices = [
          createDefaultChoice(false, "Answer 1"),
          createDefaultChoice(false, "Answer 2"),
        ];
      } else if (newFormData.choices.length === 1) {
        newFormData.choices = [
          { ...newFormData.choices[0], correct: false },
          createDefaultChoice(false, "Answer 2"),
        ];
      } else {
        newFormData.choices = newFormData.choices.map((choice) => ({
          ...choice,
          correct: false,
        }));
      }
      let authoritativeCorrectIndex = newFormData.correctChoiceIndex;
      if (
        authoritativeCorrectIndex < 0 ||
        authoritativeCorrectIndex >= newFormData.choices.length
      ) {
        if (newFormData.choices.length > 0) {
          authoritativeCorrectIndex = 0;
        } else {
          authoritativeCorrectIndex = -1;
        }
      }
      newFormData.correctChoiceIndex = authoritativeCorrectIndex;
      if (
        newFormData.correctChoiceIndex !== -1 &&
        newFormData.choices.length > 0
      ) {
        newFormData.choices = newFormData.choices.map((choice, index) => ({
          ...choice,
          correct: index === newFormData.correctChoiceIndex,
        }));
      }
      if (newFormData.choices.length > 6) {
        newFormData.choices = newFormData.choices.slice(0, 6);
        if (newFormData.correctChoiceIndex >= newFormData.choices.length) {
          if (newFormData.choices.length > 0) {
            newFormData.correctChoiceIndex = 0;
            newFormData.choices = newFormData.choices.map((choice, index) => ({
              ...choice,
              correct: index === newFormData.correctChoiceIndex,
            }));
          } else {
            newFormData.correctChoiceIndex = -1;
          }
        }
      }
    }
  } else if (targetType === "jumble") {
    newFormData.question = newFormData.question || "Order these items...";
    newFormData.choices = (
      newFormData.choices.length > 0
        ? newFormData.choices
        : [createDefaultChoice(true), createDefaultChoice(true)]
    ).map((choice) => ({
      ...createDefaultChoice(true, choice.answer),
      image: undefined,
    }));
    while (newFormData.choices.length < 2)
      newFormData.choices.push(
        createDefaultChoice(true, `Option ${newFormData.choices.length + 1}`)
      );
    if (newFormData.choices.length > 6)
      newFormData.choices = newFormData.choices.slice(0, 6);
    newFormData.correctChoiceIndex = -1;
  } else if (targetType === "survey") {
    newFormData.question = newFormData.question || "Poll Question...";
    newFormData.choices = (
      newFormData.choices.length > 0
        ? newFormData.choices
        : [createDefaultChoice(true), createDefaultChoice(true)]
    ).map((choice) => ({ ...choice, correct: true }));
    while (newFormData.choices.length < 2)
      newFormData.choices.push(
        createDefaultChoice(true, `Option ${newFormData.choices.length + 1}`)
      );
    if (newFormData.choices.length > 6)
      newFormData.choices = newFormData.choices.slice(0, 6);
    newFormData.correctChoiceIndex = -1;
  } else if (targetType === "open_ended") {
    newFormData.question = newFormData.question || "Type your answer...";
    if (newFormData.choices.length > 0) {
      newFormData.choices = newFormData.choices.map((choice) => ({
        answer: choice.answer || "Acceptable Answer",
        correct: true,
        image: undefined,
      }));
      if (newFormData.choices.length > 10)
        newFormData.choices = newFormData.choices.slice(0, 10);
    } else {
      newFormData.choices = [createDefaultChoice(true, "Correct Answer")];
    }
    newFormData.correctChoiceIndex = -1;
  } else if (targetType === "content") {
    // Ensure content specific fields are definitively set
    newFormData.choices = [];
    newFormData.correctChoiceIndex = -1;
    // newFormData.time = 0; // Already handled by the refined time logic
    // newFormData.pointsMultiplier = 0; // Already handled by pointsMultiplier logic
  }

  // Final check for correctChoiceIndex consistency (can often be simplified or removed if type-specific logic is robust)
  if (
    newFormData.type !== "quiz" ||
    (newFormData.type === "quiz" && isTargetTrueFalse)
  ) {
    // This means: if not a "standard quiz" (i.e., it's Content, Jumble, Survey, OpenEnded, or a T/F Quiz)
    if (newFormData.type !== "quiz") {
      // For truly non-quiz types
      newFormData.correctChoiceIndex = -1;
    }
    // For T/F Quiz, its correctChoiceIndex is already set to 0 and is not -1, so this doesn't override.
    // For standard quiz, this outer condition is false, so it's not affected.
  }

  console.log(
    "[Transformer] Transformation complete. Result:",
    JSON.parse(
      JSON.stringify(newFormData, (key, value) =>
        value instanceof File
          ? { name: value.name, size: value.size, type: value.type }
          : value
      )
    )
  );
  return newFormData;
}
