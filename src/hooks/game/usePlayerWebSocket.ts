// src/hooks/game/usePlayerWebSocket.ts
import { useState, useRef, useCallback, useEffect } from "react";
import { Client, IFrame, IMessage, StompSubscription } from "@stomp/stompjs";
import { PlayerAnswerPayload } from "@/src/lib/types"; // Import necessary types

// Constants
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
  joinGame: (nickname: string, gamePin: string) => Promise<boolean>; // Returns true on success, false on failure
  sendAnswer: (payload: PlayerAnswerPayload, gamePin: string) => void;
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
  const currentPinRef = useRef<string | null>(null); // Keep track of the current pin

  const stableOnMessageReceived = useCallback(
    (message: IMessage) => {
      // console.log("[PlayerWS Hook] Received message on:", message.headers.destination);
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
          // console.log("[PlayerWS Hook] WS state set to DISCONNECTED.");
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
        // If connecting to a different pin, disconnect first
        if (currentPinRef.current && currentPinRef.current !== gamePin) {
          console.log(
            `[PlayerWS Hook] Different pin detected (${gamePin} vs ${currentPinRef.current}), disconnecting first.`
          );
          disconnect();
        } else {
          // Already connected/connecting to the same pin, maybe transition state?
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
      currentPinRef.current = gamePin; // Store the pin we are connecting to

      const client = new Client({
        brokerURL: WEBSOCKET_URL,
        debug: (str) => {
          /* console.log("STOMP DEBUG:", str); */
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
          const privateTopic = `${USER_QUEUE_PREFIX}/private`; // Player's private message queue

          console.log(
            `[PlayerWS Hook] Subscribing to ${playerTopic} and ${privateTopic}`
          );
          try {
            // Clear old subs
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
            setConnectionStatus("NICKNAME_INPUT"); // Ready for nickname
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
            // Avoid state change if already disconnected/initial
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
  ); // Include disconnect and status

  const joinGame = useCallback(
    async (nickname: string, gamePin: string): Promise<boolean> => {
      const trimmedNickname = nickname.trim();
      if (!trimmedNickname) {
        setError("Nickname cannot be empty.");
        // setConnectionStatus('NICKNAME_INPUT'); // Stay on nickname input
        return false;
      }
      if (!stompClientRef.current || !stompClientRef.current.active) {
        setError("Not connected to server.");
        setConnectionStatus("ERROR");
        return false;
      }
      if (!playerClientId) {
        setError("Client ID not assigned yet.");
        setConnectionStatus("ERROR"); // Or maybe retry connection?
        return false;
      }

      console.log(
        `[PlayerWS Hook] Joining game ${gamePin} as ${trimmedNickname}`
      );
      setConnectionStatus("JOINING"); // Indicate joining process
      setError(null);

      // Simplified join payload based on PlayerPage logic
      const joinMessagePayload = {
        name: trimmedNickname,
        type: "joined", // Event type for join
        // Send minimal content, or gather device info if needed
        content: JSON.stringify({
          device: {
            userAgent: navigator?.userAgent,
            screen: {
              width: window?.screen?.width,
              height: window?.screen?.height,
            },
          },
        }),
        cid: playerClientId,
      };

      // Message structure based on PlayerPage logic
      const messageToSend = {
        channel: `${APP_PREFIX}/controller/${gamePin}`, // Destination for host controller
        data: joinMessagePayload,
        ext: { timetrack: Date.now() },
      };

      try {
        stompClientRef.current.publish({
          destination: messageToSend.channel,
          body: JSON.stringify([messageToSend]), // Wrap in array
        });
        console.log("[PlayerWS Hook] Join message sent.");
        // Assume success for now, transition in page based on game start message
        // setConnectionStatus('CONNECTED'); // Or 'PLAYING' - Let page handle this transition
        return true; // Indicate successful send attempt
      } catch (error: any) {
        console.error("[PlayerWS Hook] Failed to send join message:", error);
        setError(
          `Failed to send join message: ${error?.message || "Unknown error"}`
        );
        setConnectionStatus("ERROR"); // Error occurred during publish
        return false;
      }
    },
    [playerClientId]
  ); // Dependency on playerClientId

  const sendAnswer = useCallback(
    (payload: PlayerAnswerPayload, gamePin: string) => {
      if (!stompClientRef.current || !stompClientRef.current.active) {
        console.error(
          "[PlayerWS Hook] Cannot send answer: Client not connected."
        );
        setError("Cannot send answer: Not connected.");
        // Optionally set status to ERROR or DISCONNECTED
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
      // Structure based on PlayerPage logic and protocol doc phase 3
      const messageToSend = {
        channel: `${APP_PREFIX}/controller/${gamePin}`,
        data: {
          gameid: gamePin,
          id: 6, // ID for answer submission
          type: "message",
          content: contentString,
          cid: playerClientId,
        },
        ext: { timetrack: Date.now() },
      };

      try {
        stompClientRef.current.publish({
          destination: messageToSend.channel,
          body: JSON.stringify([messageToSend]), // Wrap in array
        });
        // console.log('[PlayerWS Hook] Answer message sent.');
      } catch (error: any) {
        console.error("[PlayerWS Hook] Failed to send answer message:", error);
        setError(`Failed to send answer: ${error?.message || "Unknown error"}`);
        // Maybe set error state?
      }
    },
    [playerClientId]
  ); // Dependency

  // Cleanup on unmount
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
    connectionStatus,
    error,
    playerClientId,
  };
}
