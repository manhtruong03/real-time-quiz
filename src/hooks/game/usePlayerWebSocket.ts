// src/hooks/game/usePlayerWebSocket.ts
import { useState, useRef, useCallback, useEffect } from "react";
import { Client, IFrame, IMessage, StompSubscription } from "@stomp/stompjs";

import { PlayerAnswerPayload } from "@/src/lib/types";

const WEBSOCKET_URL = "ws://localhost:8080/ws-quiz";
const APP_PREFIX = "/app";

const TOPIC_PREFIX = "/topic";
const USER_QUEUE_PREFIX = "/user/queue";

export type PlayerConnectionStatus =
  | "INITIAL"
  | "CONNECTING"
  | "NICKNAME_INPUT"
  | "JOINING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

interface PlayerWebSocketHookProps {
  onMessageReceived: (message: IMessage) => void;
}

interface PlayerWebSocketHookReturn {
  connect: (gamePin: string) => void;

  disconnect: () => void;
  // --- MODIFIED: Add avatarId parameter ---
  joinGame: (
    nickname: string,
    gamePin: string,
    avatarId: string | null
  ) => Promise<boolean>;

  sendAnswer: (payload: PlayerAnswerPayload, gamePin: string) => void;
  sendAvatarUpdate: (avatarId: string, gamePin: string) => void;
  connectionStatus: PlayerConnectionStatus;

  error: string | null;
  playerClientId: string | null;
}

export function usePlayerWebSocket({
  onMessageReceived,
}: PlayerWebSocketHookProps): PlayerWebSocketHookReturn {
  const stompClientRef = useRef<Client | null>(null);

  const subscriptionsRef = useRef<{ [key: string]: StompSubscription }>({});
  const [connectionStatus, setConnectionStatus] =
    useState<PlayerConnectionStatus>("INITIAL");

  const [error, setError] = useState<string | null>(null);
  const [playerClientId, setPlayerClientId] = useState<string | null>(null);
  const currentPinRef = useRef<string | null>(null);

  const stableOnMessageReceived = useCallback(
    (message: IMessage) => {
      onMessageReceived(message);
    },
    [onMessageReceived]
  );

  const disconnect = useCallback(() => {
    // console.log("[PlayerWS Hook] Attempting disconnect...");
    if (!stompClientRef.current) return;

    Object.values(subscriptionsRef.current).forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
        console.error("[PlayerWS Hook] Error unsubscribing:", e);
      }
    });
    subscriptionsRef.current = {};

    if (stompClientRef.current.active) {
      stompClientRef.current
        .deactivate()

        .catch((err) =>
          console.error("[PlayerWS Hook] Error during deactivate:", err)
        )

        .finally(() => {
          stompClientRef.current = null;
          setPlayerClientId(null);
          setConnectionStatus("DISCONNECTED");
          currentPinRef.current = null;
        });
    } else {
      stompClientRef.current = null;
      setPlayerClientId(null);
      setConnectionStatus("DISCONNECTED");

      currentPinRef.current = null;
    }
  }, []);

  const connect = useCallback(
    (gamePin: string) => {
      if (!gamePin) {
        console.error("[PlayerWS Hook] Cannot connect: Missing gamePin");
        setError("Game PIN cannot be empty.");
        setConnectionStatus("ERROR");
        return;
      }
      if (stompClientRef.current?.active) {
        console.warn("[PlayerWS Hook] WS already connected or connecting.");

        if (currentPinRef.current && currentPinRef.current !== gamePin) {
          console.log(
            `[PlayerWS Hook] Different pin detected (${gamePin} vs ${currentPinRef.current}), disconnecting first.`
          );
          disconnect();
        } else {
          if (connectionStatus === "CONNECTED")
            setConnectionStatus("NICKNAME_INPUT");
          return;
        }
      }
      console.log(
        `[PlayerWS Hook] Attempting WebSocket connection for game pin ${gamePin}...`
      );

      setError(null);
      setConnectionStatus("CONNECTING");
      currentPinRef.current = gamePin;

      const client = new Client({
        brokerURL: WEBSOCKET_URL,
        debug: (str) => {
          console.log("STOMP PLAYER DEBUG:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: IFrame) => {
          const connectedClientId =
            frame.headers["user-name"] ||
            `player_${Date.now().toString().slice(-6)}`;
          setPlayerClientId(connectedClientId);
          console.log(
            `[PlayerWS Hook] WebSocket Connected! Client ID: ${connectedClientId}`
          );

          const playerTopic = `${TOPIC_PREFIX}/player/${gamePin}`;
          const privateTopic = `${USER_QUEUE_PREFIX}/private`;

          console.log(
            `[PlayerWS Hook] Subscribing to ${playerTopic} and ${privateTopic}`
          );
          try {
            Object.values(subscriptionsRef.current).forEach((sub) =>
              sub.unsubscribe()
            );

            subscriptionsRef.current = {};

            if (!client.active)
              throw new Error("Client deactivated before subscribe");

            subscriptionsRef.current[playerTopic] = client.subscribe(
              playerTopic,
              stableOnMessageReceived
            );

            subscriptionsRef.current[privateTopic] = client.subscribe(
              privateTopic,
              stableOnMessageReceived
            );

            console.log("[PlayerWS Hook] Subscriptions successful.");
            setConnectionStatus("NICKNAME_INPUT");
            setError(null);
          } catch (subError: any) {
            console.error("[PlayerWS Hook] Subscription failed:", subError);

            setError(
              `Failed to subscribe: ${subError?.message || "Unknown error"}`
            );

            setConnectionStatus("ERROR");
            if (client.active) client.deactivate();
          }
        },
        onWebSocketError: (error: Event | CloseEvent) => {
          console.error("[PlayerWS Hook] WS Error:", error);

          let reason = "WebSocket error.";
          if (error instanceof CloseEvent) {
            reason = `WebSocket closed unexpectedly. Code: ${
              error.code
            }, Reason: ${error.reason || "No reason given"}`;
          }

          setError(reason);
          setConnectionStatus("ERROR");
          stompClientRef.current = null;
          setPlayerClientId(null);

          currentPinRef.current = null;
        },
        onStompError: (frame: IFrame) => {
          console.error(
            "[PlayerWS Hook] STOMP Error:",
            frame.headers["message"],
            frame.body
          );

          setError(
            `Connection failed: ${
              frame.headers["message"] || "Unknown STOMP error"
            }`
          );

          setConnectionStatus("ERROR");
          stompClientRef.current = null;
          setPlayerClientId(null);
          currentPinRef.current = null;
        },
        onDisconnect: () => {
          console.log("[PlayerWS Hook] WS Disconnected unexpectedly.");

          if (
            connectionStatus !== "DISCONNECTED" &&
            connectionStatus !== "INITIAL"
          ) {
            setError("Connection lost.");

            setConnectionStatus("DISCONNECTED");
            setPlayerClientId(null);
            subscriptionsRef.current = {};
            stompClientRef.current = null;
            currentPinRef.current = null;
          }
        },
      });

      client.activate();
      stompClientRef.current = client;
    },
    [stableOnMessageReceived, disconnect, connectionStatus]
  );

  const joinGame = useCallback(
    // --- MODIFIED: Accept avatarId ---
    async (
      nickname: string,
      gamePin: string,
      avatarId: string | null
    ): Promise<boolean> => {
      const trimmedNickname = nickname.trim();
      if (!trimmedNickname) {
        setError("Nickname cannot be empty.");
        return false;
      }
      if (!stompClientRef.current || !stompClientRef.current.active) {
        setError("Not connected to server.");
        setConnectionStatus("ERROR");
        return false;
      }
      if (!playerClientId) {
        setError("Client ID not assigned yet.");
        setConnectionStatus("ERROR");
        return false;
      }

      console.log(
        `[PlayerWS Hook] Joining game ${gamePin} as ${trimmedNickname} with avatar ${avatarId}`
      );
      setConnectionStatus("JOINING");
      setError(null);

      // --- MODIFIED: Construct content payload including avatar ---
      const contentPayload = {
        avatar: avatarId ? { id: avatarId } : null, // Include avatar ID if present
        device: {
          // Keep existing device info if needed
          userAgent: navigator?.userAgent,
          screen: {
            width: window?.screen?.width,
            height: window?.screen?.height,
          },
        },
      };
      const contentString = JSON.stringify(contentPayload);
      // --- END MODIFIED ---

      const joinMessagePayload = {
        name: trimmedNickname,
        type: "joined",
        // --- MODIFIED: Use the new content string ---
        content: contentString,
        // --- END MODIFIED ---
        cid: playerClientId,
      };

      const messageToSend = {
        channel: `${APP_PREFIX}/controller/${gamePin}`,
        data: joinMessagePayload,
        ext: { timetrack: Date.now() },
      };

      try {
        stompClientRef.current.publish({
          destination: messageToSend.channel,
          body: JSON.stringify([messageToSend]),
        });

        console.log("[PlayerWS Hook] Join message sent.");
        // Page transitions to 'PLAYING' on successful send
        return true;
      } catch (error: any) {
        console.error("[PlayerWS Hook] Failed to send join message:", error);

        setError(
          `Failed to send join message: ${error?.message || "Unknown error"}`
        );

        setConnectionStatus("ERROR");
        return false;
      }
    },
    [playerClientId]
  );

  const sendAnswer = useCallback(
    (payload: PlayerAnswerPayload, gamePin: string) => {
      if (!stompClientRef.current || !stompClientRef.current.active) {
        console.error(
          "[PlayerWS Hook] Cannot send answer: Client not connected."
        );
        setError("Cannot send answer: Not connected.");
        return;
      }
      if (!playerClientId) {
        console.error("[PlayerWS Hook] Cannot send answer: Missing Client ID.");
        setError("Cannot send answer: Client ID missing.");
        return;
      }
      if (!gamePin) {
        console.error("[PlayerWS Hook] Cannot send answer: Missing Game PIN.");
        setError("Cannot send answer: Game PIN missing.");
        return;
      }

      const contentString = JSON.stringify(payload);
      const messageToSend = {
        channel: `${APP_PREFIX}/controller/${gamePin}`,
        data: {
          gameid: gamePin,
          id: 6,
          type: "message",

          content: contentString,
          cid: playerClientId,
        },
        ext: { timetrack: Date.now() },
      };

      try {
        stompClientRef.current.publish({
          destination: messageToSend.channel,
          body: JSON.stringify([messageToSend]),
        });
      } catch (error: any) {
        console.error("[PlayerWS Hook] Failed to send answer message:", error);

        setError(`Failed to send answer: ${error?.message || "Unknown error"}`);
      }
    },
    [playerClientId]
  );

  const sendAvatarUpdate = useCallback(
    (avatarId: string, gamePin: string) => {
      if (!stompClientRef.current || !stompClientRef.current.active) {
        console.error(
          "[PlayerWS Hook] Cannot send avatar update: Client not connected."
        );
        setError("Cannot update avatar: Not connected.");
        return;
      }
      if (!playerClientId) {
        console.error(
          "[PlayerWS Hook] Cannot send avatar update: Missing Client ID."
        );
        setError("Cannot update avatar: Client ID missing.");
        return;
      }
      if (!gamePin) {
        console.error(
          "[PlayerWS Hook] Cannot send avatar update: Missing Game PIN."
        );
        setError("Cannot update avatar: Game PIN missing.");
        return;
      }

      const contentPayload = { avatar: { id: avatarId } };
      const contentString = JSON.stringify(contentPayload);

      // Structure based on docs/websocket_message_structure.txt example 3.3
      const messageToSend = {
        channel: `${APP_PREFIX}/controller/${gamePin}`, // Send to host controller
        data: {
          gameid: gamePin,
          id: 46, // Specific ID for Avatar Change
          type: "message",
          content: contentString,
          cid: playerClientId, // Identify the player making the change
        },
        ext: { timetrack: Date.now() },
      };

      try {
        stompClientRef.current.publish({
          destination: messageToSend.channel,
          body: JSON.stringify([messageToSend]), // Wrap in array
        });
        console.log(
          `[PlayerWS Hook] Avatar update message sent (Avatar ID: ${avatarId}).`
        );
      } catch (error: any) {
        console.error(
          "[PlayerWS Hook] Failed to send avatar update message:",
          error
        );
        setError(
          `Failed to update avatar: ${error?.message || "Unknown error"}`
        );
      }
    },
    [playerClientId]
  ); // Depends only on playerClientId (and implicitly stompClientRef)
  // --- END ADDED ---

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    joinGame,
    sendAnswer,
    sendAvatarUpdate,
    connectionStatus,
    error,
    playerClientId,
  };
}
