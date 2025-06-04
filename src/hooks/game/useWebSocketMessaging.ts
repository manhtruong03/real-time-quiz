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
  ParticipantLeftPayload,
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
  handleParticipantLeft: (payload: ParticipantLeftPayload) => void; 
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
    // Assuming rawMessage is the STOMP message body (string) or a mock object.
    // For actual STOMP integration, this might be `stompMessage: IMessage`
    // and you'd use `stompMessage.body`.
    (rawMessage: MockWebSocketMessage | string) => {
      let outerParsedPayload: any = null;

      try {
        if (typeof rawMessage === "string") {
          outerParsedPayload = JSON.parse(rawMessage);
        } else if (typeof rawMessage === "object" && rawMessage !== null) {
          // This branch handles MockWebSocketMessage for dev/testing
          outerParsedPayload = rawMessage;
        } else {
          console.warn(
            "[WebSocketMessaging] Invalid raw message type:",
            typeof rawMessage
          );
          return;
        }
      } catch (e) {
        console.error(
          "[WebSocketMessaging] Error parsing outer message body:",
          e,
          rawMessage
        );
        return;
      }

      // 1. Check for PARTICIPANT_LEFT (direct message type)
      // This message is expected to have "type": "PARTICIPANT_LEFT" at its root.
      if (
        outerParsedPayload &&
        outerParsedPayload.type === "PARTICIPANT_LEFT"
      ) {
        const participantLeftData =
          outerParsedPayload as ParticipantLeftPayload;
        // Basic validation for required fields
        if (
          participantLeftData.affectedId &&
          participantLeftData.hostId !== undefined && // hostId can be an empty string, but should exist
          typeof participantLeftData.playerCount === "number"
        ) {
          // console.log("[WebSocketMessaging] Detected PARTICIPANT_LEFT message:", participantLeftData); // Logging for debug
          callbacks.handleParticipantLeft(participantLeftData);
        } else {
          console.warn(
            "[WebSocketMessaging] Received PARTICIPANT_LEFT message with missing or invalid fields:",
            participantLeftData
          );
        }
        return; // Message handled
      }

      // 2. If not PARTICIPANT_LEFT, proceed with existing Bayeux-style message handling
      // The existing logic expects messages to be potentially wrapped in an array (Bayeux style)
      // and then have a 'data' field.
      let messageList: any[] = [];
      if (Array.isArray(outerParsedPayload)) {
        messageList = outerParsedPayload;
      } else {
        // If it wasn't an array and not PARTICIPANT_LEFT, it might be a single Bayeux message object
        messageList = [outerParsedPayload];
      }

      const parsedMessage = // This is the first element of the Bayeux message array, or the message itself
        Array.isArray(messageList) && messageList.length > 0
          ? messageList[0]
          : messageList;

      // Existing logic for Bayeux-style messages (within a 'data' object)
      const data = parsedMessage?.data; // The 'data' object within the Bayeux envelope
      const type = data?.type; // This is `data.type` (e.g., "joined", "message")
      const id = data?.id; // This is `data.id` (e.g., 6, 45 for answers, type of content)
      const cid = data?.cid; // This is `data.cid` (player CID)

      if (!data) {
        // Avoid logging if it was already handled as PARTICIPANT_LEFT or if it's an unrecognized direct message
        // We only log here if we expected a 'data' field and didn't find it.
        if (
          !(
            outerParsedPayload && outerParsedPayload.type === "PARTICIPANT_LEFT"
          )
        ) {
          console.warn(
            "[WebSocketMessaging] Message has no 'data' field (Bayeux style). Original payload:",
            outerParsedPayload
          );
        }
        return;
      }

      // --- Existing message handling logic ---
      if (type === "login" || type === "joined" || type === "IDENTIFY") {
        if (cid && data.name) {
          let avatarId: string | null = null;
          // Attempt to parse avatar from content, robustly
          if (data.content && typeof data.content === "string") {
            try {
              const parsedContent = JSON.parse(data.content);
              avatarId = parsedContent?.avatar?.id ?? null;
              if (avatarId && typeof avatarId !== "string") {
                console.warn(
                  "[WebSocketMessaging] Parsed avatarId is not a string, treating as null.",
                  parsedContent?.avatar
                );
                avatarId = null; // Ensure it's null if not a valid string
              }
            } catch (e) {
              // console.debug("[WebSocketMessaging] Content for join/login not valid JSON or no avatar:", data.content, e);
            }
          }
          callbacks.addOrUpdatePlayer(
            cid,
            data.name,
            parsedMessage.ext?.timetrack ?? Date.now(),
            avatarId
          );
          callbacks.notifyPlayerJoined(cid);
        } else {
          console.warn(
            "[WebSocketMessaging] 'login'/'joined'/'IDENTIFY' message missing cid or name:",
            data
          );
        }
      } else if (id === 6 || id === 45) {
        // Player Answer Message
        if (cid && data.content) {
          try {
            const payload = JSON.parse(data.content) as PlayerAnswerPayload;
            // Basic validation of the answer payload
            if (payload.type && payload.questionIndex !== undefined) {
              callbacks.processPlayerAnswer(
                cid,
                payload,
                parsedMessage.ext?.timetrack
              );
            } else {
              console.warn(
                "[WebSocketMessaging] Invalid answer payload structure:",
                payload
              );
            }
          } catch (e) {
            console.error(
              "[WebSocketMessaging] Error parsing answer content:",
              e,
              data.content
            );
          }
        } else {
          console.warn(
            "[WebSocketMessaging] Answer message (id 6/45) missing cid or content:",
            data
          );
        }
      } else if (id === 46) {
        // Player Avatar Change Message
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
            } else {
              console.warn(
                "[WebSocketMessaging] Avatar change message has invalid or missing avatar.id:",
                parsedContent
              );
            }
          } catch (e) {
            console.error(
              "[WebSocketMessaging] Error parsing avatar change content:",
              e,
              data.content
            );
          }
        } else {
          console.warn(
            "[WebSocketMessaging] Avatar change message (id 46) missing cid or content:",
            data
          );
        }
      } else {
        // console.log("[WebSocketMessaging] Received unhandled Bayeux message type/id:", { type, id, data });
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
