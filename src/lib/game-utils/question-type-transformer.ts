// src/lib/game-utils/question-type-transformer.ts

import type { QuestionHost } from "@/src/lib/types";
import type {
  QuestionFormContextType,
  ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import { createDefaultChoice, DEFAULT_TIME_LIMIT } from "./quiz-creation";

/**
 * Transforms the RHF form data for a question to match the constraints of a target question type.
 */
export function transformQuestionDataForType(
  currentData: QuestionFormContextType,
  targetType: QuestionHost["type"],
  isTargetTrueFalse: boolean = false // For 'quiz' type, if it should be T/F
): QuestionFormContextType {
  console.log(
    `[Transformer] Transforming from ${currentData.type} (isTF: ${
      isTargetTrueFalse && currentData.type === "quiz"
    }) to ${targetType}${
      isTargetTrueFalse && targetType === "quiz" ? " (T/F)" : ""
    }.`
  );
  // console.log("[Transformer] Input data:", JSON.parse(JSON.stringify(currentData)));

  const newFormData: QuestionFormContextType = {
    // Preserve some common fields by default
    image: currentData.image, // Preserve main image
    video: currentData.video, // Preserve video
    media: currentData.media, // Preserve media array

    // Fields to be determined/reset based on targetType
    type: targetType,
    question:
      currentData.type === "content" ? currentData.title : currentData.question, // Sensible default for question text
    title:
      targetType === "content"
        ? currentData.question || currentData.title
        : undefined,
    description: targetType === "content" ? currentData.description : undefined,
    time: currentData.time ?? DEFAULT_TIME_LIMIT,
    pointsMultiplier: currentData.pointsMultiplier ?? 1,
    choices: [...(currentData.choices ?? []).map((c) => ({ ...c }))], // Deep copy choices
    correctChoiceIndex: currentData.correctChoiceIndex ?? -1,
  };

  // --- TYPE-SPECIFIC TRANSFORMATIONS ---

  // 1. Defaults for 'content' type
  if (targetType === "content") {
    newFormData.title =
      currentData.question || currentData.title || "Informational Slide";
    newFormData.description =
      currentData.description || "Add your content here...";
    newFormData.question = undefined;
    newFormData.choices = [];
    newFormData.correctChoiceIndex = -1;
    newFormData.time = 0;
    newFormData.pointsMultiplier = 0;
  } else {
    // For all non-content types
    newFormData.question =
      newFormData.question ||
      (currentData.type === "content" ? currentData.title : "New Question..."); // Default if empty
    newFormData.title = undefined;
    newFormData.description = undefined;
  }

  // 2. Points Multiplier
  if (targetType === "survey" || targetType === "content") {
    newFormData.pointsMultiplier = 0;
  } else if (
    newFormData.pointsMultiplier === 0 &&
    (currentData.type === "survey" || currentData.type === "content")
  ) {
    // If coming from a non-pointed type to a pointed one, default to 1
    newFormData.pointsMultiplier = 1;
  }

  // 3. Time Limit
  if (targetType === "content") {
    newFormData.time = 0;
  } else if (
    targetType === "jumble" &&
    newFormData.time !== 60000 &&
    newFormData.time !== 90000 &&
    newFormData.time !== 120000
  ) {
    // Common jumble times
    newFormData.time = 60000;
  } else if (newFormData.time === 0 && currentData.type === "content") {
    // Coming from content to a timed question
    newFormData.time = DEFAULT_TIME_LIMIT;
  } else if (!newFormData.time) {
    // General fallback if time is undefined/null
    newFormData.time = DEFAULT_TIME_LIMIT;
  }

  // 4. Choices and Correctness Logic
  if (targetType === "quiz") {
    if (isTargetTrueFalse) {
      newFormData.question = newFormData.question || "True or False: ...";
      newFormData.choices = [
        createDefaultChoice(true, "True"),
        createDefaultChoice(false, "False"),
      ];
      newFormData.correctChoiceIndex = 0;
    } else {
      // Standard Quiz
      newFormData.question = newFormData.question || "Quiz Question...";
      if (newFormData.choices.length < 2) {
        newFormData.choices = [
          createDefaultChoice(true, newFormData.choices[0]?.answer || ""),
          createDefaultChoice(false, newFormData.choices[1]?.answer || ""),
        ];
        // Add more if needed to reach a certain default (e.g., 2 or 4)
        while (newFormData.choices.length < 2)
          newFormData.choices.push(createDefaultChoice(false));
      }
      // Ensure only one 'correct' answer for standard quiz
      let foundCorrect = false;
      newFormData.choices = newFormData.choices.map((choice, index) => {
        if (choice.correct) {
          if (!foundCorrect) {
            foundCorrect = true;
            newFormData.correctChoiceIndex = index;
            return choice;
          }
          return { ...choice, correct: false };
        }
        return choice;
      });
      if (!foundCorrect && newFormData.choices.length > 0) {
        newFormData.choices[0].correct = true;
        newFormData.correctChoiceIndex = 0;
      } else if (newFormData.choices.length === 0) {
        newFormData.correctChoiceIndex = -1;
      }
      // Limit choices for quiz
      if (newFormData.choices.length > 6)
        newFormData.choices = newFormData.choices.slice(0, 6);
    }
  } else if (targetType === "jumble") {
    newFormData.question = newFormData.question || "Order these items...";
    newFormData.choices = (
      newFormData.choices.length > 0
        ? newFormData.choices
        : [createDefaultChoice(true), createDefaultChoice(true)]
    ).map((choice) => ({
      ...createDefaultChoice(true, choice.answer), // Ensure answer is string, correct is true
      image: undefined, // Jumble doesn't use images in choices per schema
    }));
    while (newFormData.choices.length < 2)
      newFormData.choices.push(
        createDefaultChoice(true, `Option ${newFormData.choices.length + 1}`)
      );
    if (newFormData.choices.length > 6)
      newFormData.choices = newFormData.choices.slice(0, 6);
    newFormData.correctChoiceIndex = -1; // Not used by Jumble RHF state
  } else if (targetType === "survey") {
    newFormData.question = newFormData.question || "Poll Question...";
    newFormData.choices = (
      newFormData.choices.length > 0
        ? newFormData.choices
        : [createDefaultChoice(true), createDefaultChoice(true)]
    ).map((choice) => ({ ...choice, correct: true })); // All choices are structurally correct
    while (newFormData.choices.length < 2)
      newFormData.choices.push(
        createDefaultChoice(true, `Option ${newFormData.choices.length + 1}`)
      );
    if (newFormData.choices.length > 6)
      newFormData.choices = newFormData.choices.slice(0, 6);
    newFormData.correctChoiceIndex = -1; // Not used
  } else if (targetType === "open_ended") {
    newFormData.question = newFormData.question || "Type your answer...";
    // Open ended might have multiple "acceptable" answers, all marked as correct: true
    // If coming from a type with choices, attempt to use the first one.
    if (newFormData.choices.length > 0) {
      newFormData.choices = newFormData.choices.map((choice) => ({
        answer: choice.answer || "Acceptable Answer",
        correct: true,
        image: undefined, // Open Ended choices are text only
      }));
      if (newFormData.choices.length > 10)
        newFormData.choices = newFormData.choices.slice(0, 10);
    } else {
      newFormData.choices = [createDefaultChoice(true, "Correct Answer")];
    }
    newFormData.correctChoiceIndex = -1; // Not used
  } else if (targetType === "content") {
    // Already handled at the top mostly
    newFormData.choices = [];
    newFormData.correctChoiceIndex = -1;
  }

  // Final check: if not a quiz, correctChoiceIndex should be -1
  if (
    newFormData.type !== "quiz" ||
    (newFormData.type === "quiz" && isTargetTrueFalse)
  ) {
    if (newFormData.type !== "quiz") {
      // For jumble, survey, OE, content
      newFormData.correctChoiceIndex = -1;
    }
  }

  console.log(
    "[Transformer] Transformation complete. Result:",
    JSON.parse(JSON.stringify(newFormData))
  );
  return newFormData;
}
