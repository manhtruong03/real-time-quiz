// src/app/game/host/hooks/useHostMessageSender.ts
import { useEffect } from "react";
import type { LiveGameState, GameBlock } from "@/src/lib/types";
import type { PageUiState } from "./useHostPageUIStateManager"; // Assuming PageUiState is exported
import type { ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket"; // Assuming ConnectionStatus is exported

// Define the structure for prepared messages if not already globally available
interface PreparedMessage {
  messageString: string | null;
  messageDataId: number | null;
}

interface UseHostMessageSenderProps {
  liveGameState: LiveGameState | null;
  currentBlock: GameBlock | null; // From coordinator
  uiState: PageUiState; // From uiManager
  wsConnectionStatus: WebSocketConnectionStatus; // From useHostWebSocket
  sendMessage: (destination: string, body: string) => void; // From useHostWebSocket
  prepareQuestionMessage: () => string | null; // From coordinator
  prepareResultMessage: (playerId: string) => PreparedMessage; // From coordinator
  lastSentQuestionIndexRef: React.MutableRefObject<number | null>;
  appPrefix: string;
  topicPrefix: string;
}

export function useHostMessageSender({
  liveGameState,
  currentBlock,
  uiState,
  wsConnectionStatus,
  sendMessage,
  prepareQuestionMessage,
  prepareResultMessage,
  lastSentQuestionIndexRef,
  appPrefix,
  topicPrefix,
}: UseHostMessageSenderProps) {
  useEffect(() => {
    if (!liveGameState) return;
    if (uiState !== "CONNECTED" || wsConnectionStatus !== "CONNECTED") return;

    const { status, gamePin, players, hostUserId, currentQuestionIndex } =
      liveGameState;

    if (status === "QUESTION_SHOW" || status === "QUESTION_GET_READY") {
      if (
        currentBlock &&
        currentBlock.questionIndex === currentQuestionIndex &&
        lastSentQuestionIndexRef.current !== currentQuestionIndex
      ) {
        const messageBody = prepareQuestionMessage();
        if (messageBody && gamePin) {
          const destination = `${topicPrefix}/player/${gamePin}`;
          sendMessage(destination, messageBody);
          lastSentQuestionIndexRef.current = currentQuestionIndex;
        }
      }
    } else if (
      status === "SHOWING_STATS" ||
      status === "PODIUM" ||
      status === "ENDED"
    ) {
      const isFinalMessage = status === "PODIUM" || status === "ENDED";
      if (
        lastSentQuestionIndexRef.current === currentQuestionIndex ||
        (isFinalMessage && lastSentQuestionIndexRef.current !== -999)
      ) {
        if (players && Object.keys(players).length > 0 && gamePin) {
          Object.keys(players).forEach((playerId) => {
            if (playerId !== hostUserId) {
              const preparedMsg = prepareResultMessage(playerId);
              if (
                preparedMsg.messageString &&
                preparedMsg.messageDataId !== null
              ) {
                let destinationChannel: string;
                if (
                  preparedMsg.messageDataId === 8 ||
                  preparedMsg.messageDataId === 13
                ) {
                  destinationChannel = `${appPrefix}/controller/${gamePin}`;
                } else {
                  destinationChannel = `${topicPrefix}/player/${gamePin}`;
                }
                sendMessage(destinationChannel, preparedMsg.messageString);
              } else {
                console.warn(
                  `Could not prepare result/final message for player ${playerId}.`
                );
              }
            }
          });
        }
        if (!isFinalMessage) {
          lastSentQuestionIndexRef.current = null;
        } else if (
          isFinalMessage &&
          lastSentQuestionIndexRef.current !== -999
        ) {
          lastSentQuestionIndexRef.current = -999;
        }
      }
    } else if (status === "LOBBY") {
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
    }
  }, [
    liveGameState,
    currentBlock,
    uiState,
    wsConnectionStatus,
    sendMessage,
    prepareQuestionMessage,
    prepareResultMessage,
    lastSentQuestionIndexRef,
    appPrefix,
    topicPrefix,
  ]);
}
