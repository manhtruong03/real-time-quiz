// src/hooks/game/useHostWebSocket.ts
import { useState, useRef, useCallback, useEffect } from "react";
import { Client, IFrame, IMessage, StompSubscription } from "@stomp/stompjs";

// Constants (Consider moving these to a shared config file)
const WEBSOCKET_URL = "ws://localhost:8080/ws-quiz";
const TOPIC_PREFIX = "/topic";
const USER_QUEUE_PREFIX = "/user/queue";

export type ConnectionStatus =
  | "INITIAL"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

interface HostWebSocketHookProps {
  onMessageReceived: (message: IMessage) => void; // Callback for processing messages
}

interface HostWebSocketHookReturn {
  connect: (
    gamePin: string,
    onConnectSuccess?: (clientId: string) => void
  ) => void;
  disconnect: () => void;
  sendMessage: (destination: string, body: string) => void;
  connectionStatus: ConnectionStatus;
  error: string | null;
  hostClientId: string | null;
}

export function useHostWebSocket({
  onMessageReceived,
}: HostWebSocketHookProps): HostWebSocketHookReturn {
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ [key: string]: StompSubscription }>({});
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("INITIAL");
  const [error, setError] = useState<string | null>(null);
  const [hostClientId, setHostClientId] = useState<string | null>(null);
  const onConnectSuccessCallbackRef = useRef<
    ((clientId: string) => void) | null
  >(null);

  // Ensure onMessageReceived is stable if passed directly from props,
  // but relying on the caller to memoize is typical.
  const stableOnMessageReceived = useCallback(
    (message: IMessage) => {
      // console.log("[HostWS Hook] Received message on:", message.headers.destination);
      onMessageReceived(message);
    },
    [onMessageReceived]
  );

  const disconnect = useCallback(() => {
    // console.log("[HostWS Hook] Attempting disconnect...");
    if (!stompClientRef.current) return;

    Object.values(subscriptionsRef.current).forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
        console.error("[HostWS Hook] Error unsubscribing:", e);
      }
    });
    subscriptionsRef.current = {};

    if (stompClientRef.current.active) {
      stompClientRef.current
        .deactivate()
        .then(() => {
          // console.log("[HostWS Hook] Deactivated successfully.");
        })
        .catch((err) => {
          console.error("[HostWS Hook] Error during deactivate:", err);
        })
        .finally(() => {
          stompClientRef.current = null;
          setHostClientId(null);
          setConnectionStatus("DISCONNECTED");
          // console.log("[HostWS Hook] WS state set to DISCONNECTED.");
        });
    } else {
      stompClientRef.current = null;
      setHostClientId(null);
      setConnectionStatus("DISCONNECTED");
      // console.log("[HostWS Hook] WS was not active, state set to DISCONNECTED.");
    }
  }, []); // No dependencies, safe to memoize

  const connect = useCallback(
    (gamePin: string, onConnectSuccess?: (clientId: string) => void) => {
      if (!gamePin) {
        console.error("[HostWS Hook] Cannot connect: Missing gamePin");
        setError("Missing game pin.");
        setConnectionStatus("ERROR");
        return;
      }
      if (stompClientRef.current?.active) {
        console.warn("[HostWS Hook] WS already connected or connecting.");
        return;
      }
      console.log(
        `[HostWS Hook] Attempting WebSocket connection for game pin ${gamePin}...`
      );
      setError(null);
      setConnectionStatus("CONNECTING");
      onConnectSuccessCallbackRef.current = onConnectSuccess || null; // Store the callback

      const client = new Client({
        brokerURL: WEBSOCKET_URL,
        debug: (str) => {
          /* console.log("STOMP DEBUG:", str); */
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: IFrame) => {
          // Note: StompJS generates its own internal session ID,
          // 'user-name' might not be the most reliable source.
          // Using a generated ID if needed, or rely on server assignment if applicable.
          const connectedSessionId =
            frame.headers["user-name"] || `host-${Date.now()}`;
          setHostClientId(connectedSessionId);
          console.log(
            `[HostWS Hook] WebSocket Connected! Session ID (approx): ${connectedSessionId}`
          );

          // Subscribe to relevant topics
          const hostTopic = `${TOPIC_PREFIX}/host/${gamePin}`;
          const playerTopic = `${TOPIC_PREFIX}/player/${gamePin}`; // Host listens to player events too
          // const privateTopic = `${USER_QUEUE_PREFIX}/private`; // Host might have private messages

          console.log(
            `[HostWS Hook] Subscribing to ${hostTopic}, ${playerTopic}`
          );
          try {
            // Clear old subs just in case
            Object.values(subscriptionsRef.current).forEach((sub) =>
              sub.unsubscribe()
            );
            subscriptionsRef.current = {};

            if (!client.active)
              throw new Error("Client deactivated before subscribe");

            subscriptionsRef.current[hostTopic] = client.subscribe(
              hostTopic,
              stableOnMessageReceived
            );
            subscriptionsRef.current[playerTopic] = client.subscribe(
              playerTopic,
              stableOnMessageReceived
            );
            // subscriptionsRef.current[privateTopic] = client.subscribe(privateTopic, stableOnMessageReceived);

            console.log("[HostWS Hook] Subscriptions potentially successful.");
            setConnectionStatus("CONNECTED");
            setError(null);
            // Call the success callback *after* subscriptions are set up
            if (onConnectSuccessCallbackRef.current) {
              onConnectSuccessCallbackRef.current(connectedSessionId);
            }
          } catch (subError: any) {
            console.error("[HostWS Hook] Subscription failed:", subError);
            setError(
              `Failed to subscribe to game topics: ${
                subError?.message || "Unknown error"
              }`
            );
            setConnectionStatus("ERROR");
            if (client.active) client.deactivate();
          }
        },
        onWebSocketError: (error: Event | CloseEvent) => {
          console.error("[HostWS Hook] WS Error:", error);
          // Try to get more details from CloseEvent
          let reason = "WebSocket error.";
          if (error instanceof CloseEvent) {
            reason = `WebSocket closed unexpectedly. Code: ${
              error.code
            }, Reason: ${error.reason || "No reason given"}`;
          }
          setError(reason);
          setConnectionStatus("ERROR");
          stompClientRef.current = null; // Ensure client ref is cleared
          setHostClientId(null);
        },
        onStompError: (frame: IFrame) => {
          console.error(
            "[HostWS Hook] STOMP Error:",
            frame.headers["message"],
            frame.body
          );
          setError(
            `STOMP error: ${frame.headers["message"] || "Unknown STOMP error"}`
          );
          setConnectionStatus("ERROR");
          stompClientRef.current = null; // Ensure client ref is cleared
          setHostClientId(null);
        },
        onDisconnect: () => {
          // This handles unexpected disconnects
          console.log("[HostWS Hook] WS Disconnected unexpectedly.");
          // Avoid calling disconnect() again here to prevent loops if disconnect was intentional
          if (connectionStatus !== "DISCONNECTED") {
            setError("Connection lost.");
            setConnectionStatus("DISCONNECTED");
            setHostClientId(null);
            subscriptionsRef.current = {};
            stompClientRef.current = null;
          }
        },
      });

      client.activate();
      stompClientRef.current = client;
    },
    [stableOnMessageReceived]
  ); // Include stable callback

  const sendMessage = useCallback((destination: string, body: string) => {
    if (!stompClientRef.current || !stompClientRef.current.active) {
      console.error(
        "[HostWS Hook] Cannot send message: Client not connected.",
        { destination }
      );
      setError("Cannot send message: Not connected.");
      // Optionally set status to ERROR or DISCONNECTED? Depends on desired behavior.
      // setConnectionStatus('ERROR');
      return;
    }
    try {
      stompClientRef.current.publish({ destination, body });
      // console.log(`[HostWS Hook] Message sent to ${destination}`);
    } catch (error: any) {
      console.error("[HostWS Hook] Error sending message:", error);
      setError(`Failed to send message: ${error?.message || "Unknown error"}`);
      // Consider if this should trigger an ERROR state
    }
  }, []); // Depends only on the ref

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    connectionStatus,
    error,
    hostClientId,
  };
}
