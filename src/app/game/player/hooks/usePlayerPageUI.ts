import { useState, useCallback, useEffect } from "react";
import { PlayerConnectionStatus } from "@/src/hooks/game/usePlayerWebSocket";

export type PageUiState =
  | "PIN_INPUT"
  | "CONNECTING"
  | "NICKNAME_INPUT"
  | "PLAYING"
  | "DISCONNECTED"
  | "ERROR"
  // --- START ADDED CODE ---
  | "KICKED";
// --- END ADDED CODE ---

interface UsePlayerPageUIProps {
  // WebSocket related functions and states
  wsConnectionStatus: PlayerConnectionStatus;
  wsError: string | null;
  connectFn: (pin: string) => void;
  joinGameFn: (
    nickname: string,
    gamePin: string,
    avatarId: string | null
  ) => Promise<boolean>;

  // Game manager related functions
  setPlayerNicknameInGameManagerFn: (name: string) => void;
  currentAvatarIdFromGameManager: string | null;
  // Note: resetCoreGameStateFn and disconnectFn are called from page.tsx wrappers or directly
}

export interface UsePlayerPageUIReturn {
  uiState: PageUiState;
  gamePin: string;
  nicknameInput: string;
  pageError: string | null;
  isProcessingPin: boolean;

  setGamePinInput: React.Dispatch<React.SetStateAction<string>>;
  setNicknameInputFieldValue: React.Dispatch<React.SetStateAction<string>>;

  submitPin: () => void;
  submitNickname: () => Promise<boolean>; // Returns success status
  resetToPinInputState: (
    disconnectFn: () => void,
    resetCoreGameStateFn: () => void
  ) => void; // Renamed and takes dependencies
  processPlayerKick: (disconnectFn: () => void) => void; // For external kick trigger
}

export function usePlayerPageUI({
  wsConnectionStatus,
  wsError,
  connectFn,
  joinGameFn,
  setPlayerNicknameInGameManagerFn,
  currentAvatarIdFromGameManager,
}: UsePlayerPageUIProps): UsePlayerPageUIReturn {
  const [uiState, setUiState] = useState<PageUiState>("PIN_INPUT");
  const [gamePin, setGamePinInput] = useState<string>("");
  const [nicknameInput, setNicknameInputFieldValue] = useState<string>("");
  const [pageError, setPageErrorInternal] = useState<string | null>(null); // Internal error state
  const [joinAttempted, setJoinAttempted] = useState(false);

  const isProcessingPin = wsConnectionStatus === "CONNECTING";

  // Sync internal pageError with wsError from the WebSocket hook
  useEffect(() => {
    if (wsError) {
      setPageErrorInternal(wsError);
    }
  }, [wsError]);

  const resetToPinInputState = useCallback(
    (disconnectFn: () => void, resetCoreGameStateFn: () => void) => {
      disconnectFn();
      resetCoreGameStateFn();
      setPlayerNicknameInGameManagerFn("");
      setGamePinInput("");
      setNicknameInputFieldValue("");
      setPageErrorInternal(null);
      setJoinAttempted(false);
      setUiState("PIN_INPUT");
    },
    [setPlayerNicknameInGameManagerFn]
  );

  // Effect for UI state transitions based on WebSocket status
  useEffect(() => {
    // Don't override specific errors set by submitPin or processPlayerKick immediately
    // if (wsError) setPageErrorInternal(wsError); // Moved above to be more general

    // --- START MODIFIED CODE ---
    // If already in KICKED state, or ERROR, or DISCONNECTED, prioritize that state.
    // This prevents wsConnectionStatus changes from overriding a terminal state like KICKED or ERROR.
    if (
      uiState === "KICKED" ||
      uiState === "ERROR" ||
      uiState === "DISCONNECTED"
    ) {
      return;
    }
    // --- END MODIFIED CODE ---

    switch (wsConnectionStatus) {
      case "CONNECTING":
        if (uiState !== "CONNECTING") setUiState("CONNECTING");
        break;
      case "NICKNAME_INPUT": // PIN successfully connected to WebSocket server
        if (
          uiState !== "PLAYING" &&
          !joinAttempted &&
          uiState !== "NICKNAME_INPUT"
        ) {
          setPageErrorInternal(null); // Clear PIN errors
          setUiState("NICKNAME_INPUT");
        }
        break;
      // 'CONNECTED' status is more about STOMP layer. Actual game join confirmed by joinGameFn success.
      case "DISCONNECTED":
        // At this point, uiState cannot be "KICKED", "ERROR", or "DISCONNECTED" due to the early return.
        // It also cannot be "CONNECTING" if wsConnectionStatus is "DISCONNECTED".
        // So, we only need to ensure we're not already in "PIN_INPUT" (e.g. if disconnected before any game interaction).
        if (uiState !== "PIN_INPUT") {
          // pageError might have been set by a previous non-terminal error.
          // If no pageError is set, provide a generic disconnection message.
          if (!pageError) {
            // Only set if not already set by a more specific error (like kick)
            setPageErrorInternal((prev) => prev || "Bạn đã bị ngắt kết nối.");
          }
          setUiState("DISCONNECTED");
          setJoinAttempted(false);
        }
        // If uiState is "PIN_INPUT" and ws disconnects, it probably means the initial connect attempt for PIN failed or never happened.
        // Staying in "PIN_INPUT" or moving to "ERROR" (if wsError is set) would be handled by other logic or wsError effect.
        break;
      case "ERROR": // WebSocket layer error
        // At this point, uiState cannot be "KICKED", "ERROR", or "DISCONNECTED".
        // wsError would have already setPageErrorInternal via the other useEffect.
        setUiState("ERROR");
        setJoinAttempted(false);
        break;
      case "INITIAL":
        // If reset externally or on load and not in PIN_INPUT, go to PIN_INPUT.
        // This specific `resetToPinInputState` might be too aggressive here if called without its dependencies.
        // This case needs careful handling, often managed by the caller (`PlayerPageInternal`).
        // For now, we assume if wsConnection becomes INITIAL and uiState is not PIN_INPUT, a reset is implied.
        // However, resetToPinInputState needs disconnectFn and resetCoreGameStateFn.
        // This effect is tricky. Let PlayerPageInternal handle the INITIAL->PIN_INPUT via resetToPinInputState.
        break;
      default:
        // const _exhaustiveCheck: never = wsConnectionStatus;
        console.warn(
          "Trạng thái kết nối WebSocket không được xử lý trong usePlayerPageUI:",
          wsConnectionStatus
        );
        break;
    }
  }, [wsConnectionStatus, uiState, joinAttempted, pageError]); // Removed resetToPinInputState from deps to avoid loop, wsError already handled

  const submitPin = useCallback(() => {
    const pinRegex = /^\d{6,7}$/;
    if (!pinRegex.test(gamePin)) {
      setPageErrorInternal(
        "Vui lòng nhập mã PIN trò chơi gồm 6 hoặc 7 chữ số hợp lệ."
      );
      // setUiState('PIN_INPUT'); // No need, already there or will remain
      return;
    }
    setPageErrorInternal(null);
    setJoinAttempted(false);
    connectFn(gamePin); // Call the connect function passed from props
  }, [gamePin, connectFn]);

  const submitNickname = useCallback(async () => {
    if (!nicknameInput.trim()) {
      setPageErrorInternal("Biệt danh không được để trống.");
      return false;
    }
    setPageErrorInternal(null);
    setJoinAttempted(true);

    const success = await joinGameFn(
      nicknameInput.trim(),
      gamePin,
      currentAvatarIdFromGameManager
    );

    if (success) {
      setPlayerNicknameInGameManagerFn(nicknameInput.trim());
      setUiState("PLAYING"); // Explicitly set to PLAYING on successful join
    } else {
      setJoinAttempted(false); // Reset if join failed
      // wsError from usePlayerWebSocket might set pageErrorInternal via useEffect,
      // or joinGameFn might throw an error that should be caught and set here.
      // For now, assume wsError handles specific join failure messages.
      if (!wsError) {
        // If joinGameFn fails but wsError is not set, provide a generic error.
        setPageErrorInternal(
          (prev) => prev || "Không thể tham gia trò chơi. Vui lòng thử lại."
        );
      }
    }
    return success;
  }, [
    nicknameInput,
    gamePin,
    currentAvatarIdFromGameManager,
    joinGameFn,
    setPlayerNicknameInGameManagerFn,
    wsError, // to check if an error was already set by ws communications
  ]);

  const processPlayerKick = useCallback((disconnectFn: () => void) => {
    setPageErrorInternal("Bạn đã bị chủ phòng đá ra khỏi trò chơi.");
    // --- START MODIFIED CODE ---
    setUiState("KICKED"); // Use the new KICKED state
    // --- END MODIFIED CODE ---
    disconnectFn(); // Call the disconnect function passed from props
  }, []); // Dependencies setPageErrorInternal, setUiState are stable from useState

  return {
    uiState,
    gamePin,
    nicknameInput,
    pageError, // Expose the internal error state
    isProcessingPin,
    setGamePinInput,
    setNicknameInputFieldValue,
    submitPin,
    submitNickname,
    resetToPinInputState,
    processPlayerKick,
  };
}
