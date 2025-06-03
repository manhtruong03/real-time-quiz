// src/hooks/game/useWebSocketMessaging.ts
import { useCallback, useRef } from "react";
import {
  GameBlock,
  QuizStructureHost,
  LiveGameState,
  PlayerAnswerPayload,
  QuestionResultPayload,
  ResultPayloadQuiz,
  ResultPayloadJumble,
  ResultPayloadOpenEnded,
  ResultPayloadSurvey,
  isContentBlock,
} from "@/src/lib/types";
import { getCurrentHostQuestion } from "@/src/lib/game-utils/question-formatter";
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls";

const APP_PREFIX = "/app";
const TOPIC_PREFIX = "/topic";

interface MessagingCallbacks {
  addOrUpdatePlayer: (
    cid: string,
    nickname: string,
    timestamp: number,
    avatarId: string | null
  ) => void;
  updatePlayerAvatar: (
    cid: string,
    avatarId: string,
    timestamp: number
  ) => void;
  processPlayerAnswer: (
    cid: string,
    payload: PlayerAnswerPayload,
    timestamp: number | undefined
  ) => void;
  notifyPlayerJoined: (cid: string) => void;
}

// Define the return type for prepareResultMessage
interface PreparedMessage {
  messageString: string | null;
  messageDataId: number | null;
}

export function useWebSocketMessaging(
  liveGameStateRef: React.RefObject<LiveGameState | null>,
  quizData: QuizStructureHost | null,
  callbacks: MessagingCallbacks
) {
  const prepareQuestionMessage = useCallback(
    (blockToSend: GameBlock | null): string | null => {
      const currentState = liveGameStateRef.current;
      if (!blockToSend || !currentState) return null;
      const contentString = JSON.stringify(blockToSend);
      const wsMessage = {
        // Default to public channel for questions
        channel: `${TOPIC_PREFIX}/player/${currentState.gamePin}`, // Use TOPIC_PREFIX
        data: {
          gameid: currentState.gamePin,
          type: "message",
          id: isContentBlock(blockToSend) ? 1 : 2,
          content: contentString,
          host: "VuiQuiz.com",
        },
      };
      return JSON.stringify([wsMessage]);
    },
    [liveGameStateRef]
  );

  const prepareResultMessage = useCallback(
    (playerId: string): PreparedMessage => {
      // Return PreparedMessage
      const currentState = liveGameStateRef.current;
      if (!currentState || !quizData) {
        console.error(
          "[MessagingHook] Cannot prepare result: missing state or quizData"
        );
        return { messageString: null, messageDataId: null };
      }

      const currentIdx = currentState.currentQuestionIndex;
      const player = currentState.players[playerId];
      if (!player) {
        console.warn(
          `[MessagingHook] Cannot prepare result for unknown player: ${playerId}`
        );
        return { messageString: null, messageDataId: null };
      }

      const playerAnswer = player.answers.find(
        (a) => a.questionIndex === currentIdx
      );
      if (!playerAnswer) {
        console.warn(
          `[MessagingHook] No answer record found for player ${playerId} on question ${currentIdx}. Cannot send result.`
        );
        return { messageString: null, messageDataId: null };
      }

      const hostQuestion = getCurrentHostQuestion(quizData, currentIdx);
      if (!hostQuestion) {
        console.error(
          `[MessagingHook] Cannot find host question data for index ${currentIdx}`
        );
        return { messageString: null, messageDataId: null };
      }

      const pointsData = playerAnswer.pointsData ?? {
        totalPointsWithBonuses: 0,
        questionPoints: 0,
        answerStreakPoints: {
          streakLevel: 0,
          previousStreakLevel: player.currentStreak,
        },
        lastGameBlockIndex: currentIdx,
      };
      const basePayload = {
        rank: player.rank,
        totalScore: player.totalScore,
        pointsData: pointsData,
        hasAnswer: playerAnswer.status !== "TIMEOUT",
        type: playerAnswer.blockType,
        points: playerAnswer.finalPointsEarned,
        isCorrect: playerAnswer.isCorrect,
        text: playerAnswer.text || "",
      };

      let finalPayload: QuestionResultPayload | null = null;
      const correctChoicesIndices = hostQuestion.choices
        .map((choice, index) => (choice.correct ? index : -1))
        .filter((index) => index !== -1);
      const correctTexts = hostQuestion.choices
        .map((choice) => choice.answer)
        .filter(Boolean) as string[];

      switch (playerAnswer.blockType) {
        case "quiz":
          finalPayload = {
            ...basePayload,
            type: "quiz",
            choice: playerAnswer.choice as number,
            correctChoices: correctChoicesIndices,
            text:
              hostQuestion.choices[playerAnswer.choice as number]?.answer ??
              basePayload.text,
          } as ResultPayloadQuiz;
          break;
        case "jumble":
          finalPayload = {
            ...basePayload,
            type: "jumble",
            choice: playerAnswer.choice as number[],
            correctChoices: correctChoicesIndices,
            text: "Jumble Order Placeholder",
          } as ResultPayloadJumble;
          break;
        case "open_ended":
          finalPayload = {
            ...basePayload,
            type: "open_ended",
            text: playerAnswer.text || "",
            correctTexts: correctTexts,
            choice: undefined,
          } as ResultPayloadOpenEnded;
          break;
        case "survey":
          const surveyChoiceText =
            hostQuestion.choices[playerAnswer.choice as number]?.answer ?? "";
          finalPayload = {
            ...basePayload,
            type: "survey",
            choice:
              typeof playerAnswer.choice === "number" ? playerAnswer.choice : 0,
            text: surveyChoiceText,
            points: undefined,
            isCorrect: undefined,
          } as ResultPayloadSurvey;
          break;
        default:
          console.error(
            `[MessagingHook] Unknown block type in player answer record: ${playerAnswer.blockType}`
          );
          return { messageString: null, messageDataId: null };
      }

      if (!finalPayload) return { messageString: null, messageDataId: null };

      const contentString = JSON.stringify(finalPayload);

      const messageDataId =
        currentState.status === "PODIUM" || currentState.status === "ENDED"
          ? 13
          : 8;

      // The channel here is for the *content* of the message if it were part of a larger structure,
      // but the STOMP destination is what truly matters for routing.
      // We are removing the direct setting of 'channel' inside the wsMessage envelope's data part,
      // as it was confusing. The actual STOMP destination is handled in page.tsx
      const wsMessage = {
        // channel: destinationChannel, // REMOVE THIS, STOMP destination is separate
        data: {
          gameid: currentState.gamePin,
          type: "message",
          id: messageDataId,
          content: contentString,
          cid: playerId,
          host: "VuiQuiz.com",
        },
        ext: { timetrack: Date.now() },
      };
      return {
        messageString: JSON.stringify([wsMessage]),
        messageDataId: messageDataId,
      };
    },
    [liveGameStateRef, quizData]
  );

  const handleIncomingMessage = useCallback(
    (rawMessage: MockWebSocketMessage | string) => {
      // ... (rest of the function remains the same)
      let parsedMessage: any = null;
      let messageList: any[] = [];

      try {
        if (typeof rawMessage === "string")
          messageList = JSON.parse(rawMessage);
        else if (typeof rawMessage === "object" && rawMessage !== null)
          messageList = [rawMessage];
        else {
          console.warn(
            "[MessagingHook] Invalid message type:",
            typeof rawMessage
          );
          return;
        }
        parsedMessage =
          Array.isArray(messageList) && messageList.length > 0
            ? messageList[0]
            : messageList;
      } catch (e) {
        console.error("[MessagingHook] Error parsing message:", e, rawMessage);
        return;
      }

      const data = parsedMessage?.data;
      const type = data?.type;
      const id = data?.id;
      const cid = data?.cid;

      if (!data) {
        console.warn("[MessagingHook] Message has no data field");
        return;
      }

      if (type === "login" || type === "joined" || type === "IDENTIFY") {
        if (cid && data.name) {
          let avatarId: string | null = null;
          if (data.content && typeof data.content === "string") {
            try {
              const parsedContent = JSON.parse(data.content);
              avatarId = parsedContent?.avatar?.id ?? null;
              if (avatarId && typeof avatarId !== "string") {
                avatarId = null;
              }
            } catch (e) {}
          }
          callbacks.addOrUpdatePlayer(
            cid,
            data.name,
            parsedMessage.ext?.timetrack ?? Date.now(),
            avatarId
          );
          callbacks.notifyPlayerJoined(cid);
        }
      } else if (id === 6 || id === 45) {
        if (cid && data.content) {
          try {
            const payload = JSON.parse(data.content) as PlayerAnswerPayload;
            if (payload.type && payload.questionIndex !== undefined) {
              callbacks.processPlayerAnswer(
                cid,
                payload,
                parsedMessage.ext?.timetrack
              );
            }
          } catch (e) {}
        }
      } else if (id === 46) {
        if (cid && data.content) {
          try {
            const parsedContent = JSON.parse(data.content);
            const avatarIdStr = parsedContent?.avatar?.id;
            if (typeof avatarIdStr === "string" && avatarIdStr) {
              callbacks.updatePlayerAvatar(
                cid,
                avatarIdStr,
                parsedMessage.ext?.timetrack ?? Date.now()
              );
            }
          } catch (e) {}
        }
      }
    },
    [callbacks]
  );

  return {
    prepareQuestionMessage,
    prepareResultMessage,
    handleIncomingMessage,
  };
}
