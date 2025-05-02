// src/hooks/game/useWebSocketMessaging.ts
import { useCallback, useRef } from "react";
import {
  GameBlock,
  QuizStructureHost,
  LiveGameState,
  PlayerAnswerPayload,
  QuestionResultPayload, // Import the specific result type
  ResultPayloadQuiz,
  ResultPayloadJumble,
  ResultPayloadOpenEnded,
  ResultPayloadSurvey,
  isContentBlock,
} from "@/src/lib/types";
import { getCurrentHostQuestion } from "@/src/lib/game-utils/question-formatter";
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls"; // Keep if using DevMockControls

// Define the expected structure for callbacks passed to this hook
interface MessagingCallbacks {
  addOrUpdatePlayer: (cid: string, nickname: string, timestamp: number) => void;
  updatePlayerAvatar: (
    cid: string,
    avatarId: number,
    timestamp: number
  ) => void;
  processPlayerAnswer: (
    cid: string,
    payload: PlayerAnswerPayload,
    timestamp: number | undefined
  ) => void;
  notifyPlayerJoined: (cid: string) => void;
  // Add other callbacks if needed (e.g., handleDisconnect)
}

export function useWebSocketMessaging(
  liveGameStateRef: React.RefObject<LiveGameState | null>, // Use Ref for reading current state
  quizData: QuizStructureHost | null, // Needed for preparing results
  callbacks: MessagingCallbacks // Pass in functions to call for specific messages
) {
  // --- Prepare Outgoing Messages ---

  const prepareQuestionMessage = useCallback(
    (blockToSend: GameBlock | null): string | null => {
      const currentState = liveGameStateRef.current;
      if (!blockToSend || !currentState) return null;
      //   console.log("[MessagingHook] Preparing question message:", blockToSend.type);
      const contentString = JSON.stringify(blockToSend);
      const wsMessage = {
        channel: "/service/player", // Target channel for broadcast
        data: {
          gameid: currentState.gamePin,
          type: "message",
          id: isContentBlock(blockToSend) ? 1 : 2, // 1=GetReady/Content, 2=Question
          content: contentString,
          host: "VuiQuiz.com", // Optional host identifier
        },
      };
      return JSON.stringify([wsMessage]); // Wrap in array as per protocol examples
    },
    [liveGameStateRef]
  ); // Depends only on ref

  const prepareResultMessage = useCallback(
    (playerId: string): string | null => {
      const currentState = liveGameStateRef.current;
      if (!currentState || !quizData) {
        console.error(
          "[MessagingHook] Cannot prepare result: missing state or quizData"
        );
        return null;
      }

      const currentIdx = currentState.currentQuestionIndex;
      const player = currentState.players[playerId];
      if (!player) {
        console.warn(
          `[MessagingHook] Cannot prepare result for unknown player: ${playerId}`
        );
        return null;
      }

      // Find the answer record for the current question
      const playerAnswer = player.answers.find(
        (a) => a.questionIndex === currentIdx
      );
      if (!playerAnswer) {
        // This might happen if the results are prepared before timeout logic fully processes
        // Or if a player was disconnected before answering. Send a default "no answer" result?
        console.warn(
          `[MessagingHook] No answer record found for player ${playerId} on question ${currentIdx}. Cannot send result.`
        );
        // TODO: Decide how to handle this - maybe send a default "timeout" result?
        return null;
      }

      const hostQuestion = getCurrentHostQuestion(quizData, currentIdx);
      if (!hostQuestion) {
        console.error(
          `[MessagingHook] Cannot find host question data for index ${currentIdx}`
        );
        return null;
      }

      // Ensure pointsData exists, provide default if somehow null
      const pointsData = playerAnswer.pointsData ?? {
        totalPointsWithBonuses: 0,
        questionPoints: 0,
        answerStreakPoints: {
          streakLevel: 0,
          previousStreakLevel: player.currentStreak,
        },
        lastGameBlockIndex: currentIdx,
      };

      // Base payload common to all result types
      const basePayload = {
        rank: player.rank, // TODO: Rank needs calculation before sending results
        totalScore: player.totalScore,
        pointsData: pointsData,
        hasAnswer: playerAnswer.status !== "TIMEOUT",
        type: playerAnswer.blockType,
        points: playerAnswer.finalPointsEarned,
        isCorrect: playerAnswer.isCorrect,
        text: playerAnswer.text || "", // Player's submitted text if available
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
            ...basePayload, // Spread common fields
            type: "quiz",
            choice: playerAnswer.choice as number, // Player's choice index
            correctChoices: correctChoicesIndices,
            // Ensure text is the choice text if available (might be redundant if basePayload handles it)
            text:
              hostQuestion.choices[playerAnswer.choice as number]?.answer ??
              basePayload.text,
          } as ResultPayloadQuiz; // Cast to specific type
          break;
        case "jumble":
          // Jumble text might need construction based on player's choice order
          // This requires mapping player's indices back to original text, complex here.
          // Sending the raw choice array might be sufficient if UI handles display.
          finalPayload = {
            ...basePayload,
            type: "jumble",
            choice: playerAnswer.choice as number[], // Player's submitted order indices
            correctChoices: correctChoicesIndices, // Correct order indices
            text: "Jumble Order Placeholder", // Placeholder text
          } as ResultPayloadJumble;
          break;
        case "open_ended":
          finalPayload = {
            ...basePayload,
            type: "open_ended",
            text: playerAnswer.text || "", // Player's submitted text
            correctTexts: correctTexts,
            choice: undefined, // Explicitly undefined for open_ended result DTO
          } as ResultPayloadOpenEnded;
          break;
        case "survey":
          // Find the text corresponding to the player's choice index
          const surveyChoiceText =
            hostQuestion.choices[playerAnswer.choice as number]?.answer ?? "";
          finalPayload = {
            ...basePayload,
            type: "survey",
            choice:
              typeof playerAnswer.choice === "number" ? playerAnswer.choice : 0,
            text: surveyChoiceText, // Text of the chosen option
            points: undefined, // No points/correctness for survey
            isCorrect: undefined,
          } as ResultPayloadSurvey;
          break;
        default:
          console.error(
            `[MessagingHook] Unknown block type in player answer record: ${playerAnswer.blockType}`
          );
          return null; // Cannot prepare message for unknown type
      }

      if (!finalPayload) return null;

      const contentString = JSON.stringify(finalPayload);
      const wsMessage = {
        channel: "/service/player", // Send to individual player? No, usually broadcast or targeted. Check protocol. Assuming targetted based on original code.
        data: {
          gameid: currentState.gamePin,
          type: "message",
          id: 8, // ID for Question Result
          content: contentString,
          cid: playerId, // Target the specific player
          host: "VuiQuiz.com",
        },
        ext: { timetrack: Date.now() },
      };
      return JSON.stringify([wsMessage]); // Wrap in array
    },
    [liveGameStateRef, quizData]
  ); // Dependencies

  // --- Handle Incoming Messages ---
  const handleIncomingMessage = useCallback(
    (rawMessage: MockWebSocketMessage | string) => {
      console.log("[MessagingHook] Received message:", rawMessage);
      let parsedMessage: any = null;
      let messageList: any[] = [];

      // Parsing logic (same as before)
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
      const type = data?.type; // e.g., 'joined', 'message'
      const id = data?.id; // e.g., 6, 45, 46 (numeric ID within 'data')
      const cid = data?.cid; // Player client ID

      if (!data) {
        console.warn("[MessagingHook] Message has no data field");
        return;
      }

      // --- Routing based on message type/ID ---
      if (type === "login" || type === "joined" || type === "IDENTIFY") {
        // Player Join/Identify message
        if (cid && data.name) {
          console.log(
            `[MessagingHook] Processing join for ${cid} (${data.name})`
          );
          // Step 1: Update player state
          callbacks.addOrUpdatePlayer(
            cid,
            data.name,
            parsedMessage.ext?.timetrack ?? Date.now()
          );
          // Step 2: Notify coordinator that this player joined
          callbacks.notifyPlayerJoined(cid); // <<< Call the new callback
        } else {
          console.warn(
            "[MessagingHook] Join/Login message missing cid or name",
            data
          );
        }
      } else if (id === 6 || id === 45) {
        // Answer Message IDs
        console.log(
          `[MessagingHook] Identified Answer Message (ID: ${id}) for CID: ${cid}`
        ); // Log identification
        if (cid && data.content) {
          try {
            const payload = JSON.parse(data.content) as PlayerAnswerPayload;
            if (payload.type && payload.questionIndex !== undefined) {
              // ---> Check if this line is reached and what's in callbacks <---
              console.log(
                "[MessagingHook] Calling callbacks.processPlayerAnswer with:",
                { cid, payload }
              );
              console.log("[MessagingHook] Callbacks object:", callbacks); // See if processPlayerAnswer exists
              callbacks.processPlayerAnswer(
                cid,
                payload,
                parsedMessage.ext?.timetrack
              );
            } else {
              console.warn(
                "[MessagingHook] Invalid answer payload structure",
                payload
              );
            }
          } catch (e) {
            console.error(
              "[MessagingHook] Error parsing answer content:",
              e,
              data.content
            );
          }
        } else {
          console.warn(
            "[MessagingHook] Answer message missing cid or content",
            data
          );
        }
      } else if (id === 46) {
        // Avatar Change ID
        if (cid && data.content) {
          try {
            const parsedContent = JSON.parse(data.content);
            const avatarId = parsedContent?.avatar?.id;
            if (typeof avatarId === "number") {
              callbacks.updatePlayerAvatar(
                cid,
                avatarId,
                parsedMessage.ext?.timetrack ?? Date.now()
              );
            } else {
              console.warn(
                "[MessagingHook] Invalid avatar payload",
                parsedContent
              );
            }
          } catch (e) {
            console.error(
              "[MessagingHook] Error parsing avatar content",
              e,
              data.content
            );
          }
        } else {
          console.warn(
            "[MessagingHook] Avatar message missing cid or content",
            data
          );
        }
      }
      // Add more routing logic here for other message types/IDs if needed
      // else if (type === 'SOME_OTHER_TYPE') { ... }
      else {
        console.log(
          "[MessagingHook] Unhandled message type/id:",
          type ?? id,
          data
        );
      }
    },
    [callbacks]
  ); // Dependency on the callbacks object

  return {
    prepareQuestionMessage,
    prepareResultMessage,
    handleIncomingMessage,
    // Expose functions needed by the coordinator/page
  };
}
