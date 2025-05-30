// src/lib/game-utils/question-type-transformer.ts
import type { QuestionHost } from "@/src/lib/types"; //
import type {
  QuestionFormContextType,
  ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema"; //
import { createDefaultChoice, DEFAULT_TIME_LIMIT } from "./quiz-creation"; //

export function transformQuestionDataForType(
  currentData: QuestionFormContextType, // This now includes imageFile
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
    imageFile: currentData.imageFile, // Preserve imageFile by default
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
    time: currentData.time ?? DEFAULT_TIME_LIMIT,
    pointsMultiplier: currentData.pointsMultiplier ?? 1,
    choices: [...(currentData.choices ?? []).map((c) => ({ ...c }))],
    correctChoiceIndex: currentData.correctChoiceIndex ?? -1,
  };

  // TYPE-SPECIFIC TRANSFORMATIONS for imageFile
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
    // Content slides can still have images, so image/imageFile are preserved by default from currentData.
    // If content slides should NOT have an image, uncomment below:
    // newFormData.image = null;
    // newFormData.imageFile = null;
  } else {
    newFormData.question =
      newFormData.question ||
      (currentData.type === "content" ? currentData.title : "New Question...");
    newFormData.title = undefined;
    newFormData.description = undefined;
    // For other types, image/imageFile are also preserved by default.
  }

  // ... (rest of the points multiplier, time limit, choices logic remains the same) ...
  // 2. Points Multiplier
  if (targetType === "survey" || targetType === "content") {
    newFormData.pointsMultiplier = 0;
  } else if (
    newFormData.pointsMultiplier === 0 &&
    (currentData.type === "survey" || currentData.type === "content")
  ) {
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
    newFormData.time = 60000;
  } else if (newFormData.time === 0 && currentData.type === "content") {
    newFormData.time = DEFAULT_TIME_LIMIT;
  } else if (!newFormData.time) {
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
          createDefaultChoice(
            true,
            newFormData.choices[0]?.answer || "Answer 1"
          ),
          createDefaultChoice(
            false,
            newFormData.choices[1]?.answer || "Answer 2"
          ),
        ];
        while (newFormData.choices.length < 2)
          newFormData.choices.push(createDefaultChoice(false));
      }
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
    newFormData.choices = [];
    newFormData.correctChoiceIndex = -1;
  }

  if (
    newFormData.type !== "quiz" ||
    (newFormData.type === "quiz" && isTargetTrueFalse)
  ) {
    if (newFormData.type !== "quiz") {
      newFormData.correctChoiceIndex = -1;
    }
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
