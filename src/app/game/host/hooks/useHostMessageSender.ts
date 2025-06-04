// src/app/game/host/hooks/useHostMessageSender.ts
import { useEffect, useRef } from "react"; // Added useRef
import type {
  LiveGameState,
  GameBlock,
  LivePlayerState,
} from "@/src/lib/types"; // Added LivePlayerState
import type { PageUiState } from "./useHostPageUIStateManager";
import type { ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";
import type { KickPlayerMessageContent } from "@/src/lib/types/websocket-protocol";

interface PreparedMessage {
  messageString: string | null;
  messageDataId: number | null;
}

interface UseHostMessageSenderProps {
  liveGameState: LiveGameState | null;
  currentBlock: GameBlock | null;
  uiState: PageUiState;
  wsConnectionStatus: WebSocketConnectionStatus;
  sendMessage: (destination: string, body: string) => void;
  prepareQuestionMessage: () => string | null;
  prepareResultMessage: (playerId: string) => PreparedMessage;
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
  const sentKickNotificationsRef = useRef<Set<string>>(new Set());

  // Part A: Dispatch kick message to the specific player via controller channel
  const dispatchKickMessage = (playerCid: string, gamePin: string) => {
    const kickContent: KickPlayerMessageContent = { kickCode: 1 };
    // Message structure based on docs/websocket_message_structure.md, Section 3.5 (Host Kicks Player Message)
    // but channel changed as per user clarification to follow result sending pattern.
    const messagePayload = {
      // channel: `${topicPrefix}/player/${gamePin}`, // Old channel
      channel: `${appPrefix}/controller/${gamePin}`, // CORRECTED CHANNEL for private kick message
      data: {
        gameid: gamePin,
        id: 10, // Kick player message ID
        type: "message",
        host: "VuiQuiz.com", // Or a configurable host identifier
        cid: playerCid, // Target player's CID
        content: JSON.stringify(kickContent),
      },
      // Top-level 'clientId' (Bayeux recipient clientId) is mentioned in docs (Sec 3.5)
      // but LivePlayerState doesn't currently store it. Server should route based on 'data.cid' on this channel.
      // ext: { timetrack: Date.now() }, // Optional Bayeux extensions
    };

    const messageBody = JSON.stringify([messagePayload]); // WebSocket messages often arrive in an array
    console.log(
      `[HostMessageSender] Dispatching KICK message to player ${playerCid} on channel ${messagePayload.channel}:`,
      messageBody
    );
    sendMessage(messagePayload.channel, messageBody);
  };

  useEffect(() => {
    if (!liveGameState) {
      sentKickNotificationsRef.current.clear();
      return;
    }
    if (uiState !== "CONNECTED" || wsConnectionStatus !== "CONNECTED") return;

    const { status, gamePin, players, hostUserId, currentQuestionIndex } =
      liveGameState;

    if (status === "LOBBY") {
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
      if (sentKickNotificationsRef.current.size > 0) {
        console.log(
          "[HostMessageSender] Clearing sentKickNotificationsRef in LOBBY."
        );
        sentKickNotificationsRef.current.clear();
      }
    }

    // Part A: Reactive sending of Kick Notifications
    if (gamePin && players) {
      Object.values(players).forEach((player: LivePlayerState) => {
        if (
          player.playerStatus === "KICKED" &&
          !sentKickNotificationsRef.current.has(player.cid)
        ) {
          console.log(
            `[HostMessageSender] Detected player ${player.cid} needs kick notification.`
          );
          dispatchKickMessage(player.cid, gamePin);
          sentKickNotificationsRef.current.add(player.cid);
        }
      });
    }

    // Part B: Targeted Question Sending
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
            // Results are already sent to individual players if they are not the host
            // and if their status is not KICKED (implicitly handled by prepareResultMessage or if player is no longer in 'players' list after kick)
            // For now, we assume prepareResultMessage handles player-specific logic or this loop naturally skips kicked if they are removed.
            // If kicked players remain in 'players' but with status 'KICKED', ensure prepareResultMessage doesn't generate for them or this loop skips.
            const playerObject = players[playerId];
            if (
              playerObject &&
              playerObject.cid !== hostUserId &&
              playerObject.playerStatus !== "KICKED"
            ) {
              const preparedMsg = prepareResultMessage(playerId);
              if (
                preparedMsg.messageString &&
                preparedMsg.messageDataId !== null
              ) {
                let destinationChannel: string;
                // Result messages (ID 8 or 13) go to the controller channel for privacy
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
                // console.warn( // Original console.warn commented out to reduce noise unless specifically debugging this.
                //   `Could not prepare result/final message for player ${playerId}.`
                // );
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
