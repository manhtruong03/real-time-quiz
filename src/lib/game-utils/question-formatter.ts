// src/lib/game-utils/question-formatter.ts
import {
  GameBlock,
  QuizStructureHost,
  QuestionHost,
  ContentBlock,
  QuestionOpenEnded,
  QuizChoicePlayer,
  SurveyChoicePlayer,
  isContentBlock,
  isQuizQuestion,
  isJumbleQuestion,
  isOpenEndedQuestion,
  isSurveyQuestion,
} from "@/src/lib/types";

/**
 * Retrieves the current question object from the host's quiz data based on the index.
 * @param quizData - The complete structure of the quiz (host-side).
 * @param currentQuestionIndex - The 0-based index of the desired question.
 * @returns The QuestionHost object or null if not found or invalid.
 */
export const getCurrentHostQuestion = (
  quizData: QuizStructureHost | null,
  currentQuestionIndex: number
): QuestionHost | null => {
  if (
    !quizData ||
    currentQuestionIndex < 0 ||
    currentQuestionIndex >= quizData.questions.length
  ) {
    return null;
  }
  return quizData.questions[currentQuestionIndex];
};

/**
 * Formats a host-side question object into the structure needed by player clients.
 * Removes correct answer information and potentially randomizes choices (for jumble).
 * @param hostQuestion - The host-side question object.
 * @param questionIdx - The 0-based index of this question in the quiz sequence.
 * @param totalQuestions - The total number of questions/blocks in the quiz.
 * @returns A GameBlock object formatted for players, or null if input is invalid.
 */
export const formatQuestionForPlayer = (
  hostQuestion: QuestionHost | null,
  questionIdx: number,
  totalQuestions: number
): GameBlock | null => {
  if (!hostQuestion) return null;

  // Base properties common to most blocks sent to players
  const baseBlock: Pick<GameBlock, any> = {
    gameBlockIndex: questionIdx,
    questionIndex: questionIdx, // Often the same
    totalGameBlockCount: totalQuestions,
    title: hostQuestion.title || hostQuestion.question || "", // Use question text if title missing
    image: hostQuestion.image || undefined,
    video: (hostQuestion.video as GameBlock["video"]) || undefined, // Cast to expected type
    media: (hostQuestion.media as GameBlock["media"]) || undefined, // Cast to expected type
    timeAvailable: hostQuestion.time || 0,
    timeRemaining: hostQuestion.time || 0, // Initial remaining time is full time
    pointsMultiplier:
      hostQuestion.pointsMultiplier === 0
        ? 0
        : hostQuestion.pointsMultiplier || 1,
    numberOfAnswersAllowed: 1, // Assuming single answer for most types
    getReadyTimeAvailable: 5000, // Default get ready time
    getReadyTimeRemaining: 5000,
    gameBlockType: hostQuestion.type,
    // Properties available in Phase 2 WS messages, might be needed by UI
    // Add defaults or derive if necessary
    currentQuestionAnswerCount: 0,
    layout: "CLASSIC", // Example default
    questionRestricted: false, // Example default
    extensiveMode: true, // Example default
  };

  // Type-specific formatting
  switch (hostQuestion.type) {
    case "content":
      return {
        ...baseBlock,
        type: "content",
        description: hostQuestion.description || "",
        // Nullify fields not applicable to content blocks
        pointsMultiplier: undefined,
        timeAvailable: 0,
        timeRemaining: 0,
        numberOfAnswersAllowed: undefined,
      } as ContentBlock;

    case "quiz":
    case "survey":
      // Remove 'correct' field from choices for players
      const playerChoicesQuizSurvey = hostQuestion.choices.map(
        ({ correct, ...choiceData }) =>
          choiceData as QuizChoicePlayer | SurveyChoicePlayer
      );
      return {
        ...baseBlock,
        type: hostQuestion.type, // 'quiz' or 'survey'
        choices: playerChoicesQuizSurvey,
        numberOfChoices: playerChoicesQuizSurvey.length,
        pointsMultiplier:
          hostQuestion.type === "survey"
            ? undefined
            : baseBlock.pointsMultiplier, // No multiplier for survey
      } as GameBlock; // Cast needed as TS struggles with conditional types here

    case "jumble":
      // Remove 'correct' field and shuffle choices for players
      const playerChoicesJumble = hostQuestion.choices.map(
        ({ correct, ...choiceData }) => choiceData // Get { answer: string }
      );
      // Shuffle the choices *before* sending to the player
      const shuffledChoices = [...playerChoicesJumble].sort(
        () => Math.random() - 0.5
      );
      return {
        ...baseBlock,
        type: "jumble",
        choices: shuffledChoices, // Send shuffled choices
        numberOfChoices: shuffledChoices.length,
      } as GameBlock; // Cast needed

    case "open_ended":
      // No choices sent to player for open_ended
      return {
        ...baseBlock,
        type: "open_ended",
        choices: undefined, // Explicitly undefined
        numberOfChoices: 0, // Explicitly 0
      } as QuestionOpenEnded;

    default:
      // Log error for unknown types but return null
      console.warn(
        "Unknown host question type in formatQuestionForPlayer:",
        (hostQuestion as any).type
      );
      return null;
  }
};
