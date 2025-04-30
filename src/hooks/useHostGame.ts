// src/hooks/useHostGame.ts
import { useState, useCallback, useEffect, useRef } from "react"; // Import useRef
import {
  GameBlock,
  QuestionResultPayload,
  QuizStructureHost,
  QuestionHost,
  PlayerAnswerPayload,
  LivePlayerState,
  PlayerAnswerRecord,
  LiveGameState, // Keep non-nullable for type definition
  PointsData,
  AnswerPayloadQuiz,
  AnswerPayloadJumble,
  AnswerPayloadOpenEnded,
  isQuizQuestion,
  isJumbleQuestion,
  isOpenEndedQuestion,
  isSurveyQuestion,
  isContentBlock,
  ContentBlock,
  QuestionOpenEnded,
  ResultPayloadQuiz,
  ResultPayloadJumble,
  ResultPayloadOpenEnded,
  ResultPayloadSurvey,
} from "@/src/lib/types";
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls"; // Keep if needed for DevMockControls

const initialGamePin = "PENDING";
const initialHostId = "PENDING";

// Helper to create default state
const createInitialGameState = (quizId: string | undefined): LiveGameState => ({
  gamePin: initialGamePin,
  quizId: quizId || "",
  hostUserId: initialHostId,
  status: "LOBBY",
  currentQuestionIndex: -1,
  players: {},
  currentQuestionStartTime: null,
  currentQuestionEndTime: null,
  sessionStartTime: Date.now(),
  allowLateJoin: true,
  powerUpsEnabled: false,
});

export function useHostGame(initialQuizData: QuizStructureHost | null) {
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(
    initialQuizData
  );
  const [liveGameState, setLiveGameState] = useState<LiveGameState | null>(
    null
  );
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [timerKey, setTimerKey] = useState<string | number>("initial");
  const [totalPlayers, setTotalPlayers] = useState(0);

  // --- Ref to hold the latest game state ---
  const liveGameStateRef = useRef<LiveGameState | null>(liveGameState);

  // --- Update Ref whenever state changes ---
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
    console.log(
      "[STATE DEBUG] liveGameStateRef updated:",
      liveGameStateRef.current?.status,
      liveGameStateRef.current?.currentQuestionIndex
    );
  }, [liveGameState]);

  // Debug logs (keep)
  useEffect(() => {
    console.log(
      "[STATE DEBUG] liveGameState updated in useEffect:",
      liveGameState
    );
  }, [liveGameState]);
  console.log(
    "[STATE DEBUG] Rendering useHostGame. liveGameState is:",
    liveGameState
  );

  // Initialize or update base game state
  useEffect(() => {
    setQuizData(initialQuizData);
    if (initialQuizData && !liveGameState) {
      setLiveGameState(createInitialGameState(initialQuizData.uuid));
    } else if (
      initialQuizData &&
      liveGameState &&
      liveGameState.quizId !== initialQuizData.uuid
    ) {
      setLiveGameState((prev) =>
        prev ? { ...prev, quizId: initialQuizData.uuid } : null
      );
    }
  }, [initialQuizData]);

  // Function for Page component to initialize session details
  const initializeSession = useCallback(
    (pin: string, hostId: string) => {
      console.log(
        `[DEBUG] InitializeSession called with pin: ${pin}, hostId: ${hostId}`
      );
      if (pin === "RESET" && hostId === "RESET") {
        setLiveGameState(null);
        setCurrentBlock(null);
        setTotalPlayers(0);
        console.log("[DEBUG] Session reset");
        return;
      }
      setLiveGameState((prev) => {
        const baseState = prev ?? createInitialGameState(quizData?.uuid);
        return {
          ...baseState,
          gamePin: pin,
          hostUserId: hostId,
          status: "LOBBY",
        };
      });
    },
    [quizData]
  );

  // --- Update getCurrentHostQuestion to use the Ref ---
  const getCurrentHostQuestion = useCallback((): QuestionHost | null => {
    const currentState = liveGameStateRef.current; // <<< READ FROM REF
    if (
      !quizData ||
      !currentState ||
      currentState.currentQuestionIndex < 0 ||
      currentState.currentQuestionIndex >= quizData.questions.length
    ) {
      return null;
    }
    return quizData.questions[currentState.currentQuestionIndex];
  }, [quizData]); // Dependency is only quizData now

  // Format question for player (keep useCallback)
  const formatQuestionForPlayer = useCallback(
    (
      hostQuestion: QuestionHost | null,
      questionIdx: number
    ): GameBlock | null => {
      // ... (implementation remains the same) ...
      if (!hostQuestion || !quizData) return null;
      const baseBlock: Pick<GameBlock, any> = {
        type: hostQuestion.type,
        gameBlockIndex: questionIdx,
        questionIndex: questionIdx,
        totalGameBlockCount: quizData.questions.length,
        title: hostQuestion.title || hostQuestion.question || "",
        image: hostQuestion.image || undefined,
        video: (hostQuestion.video as GameBlock["video"]) || undefined,
        media: (hostQuestion.media as GameBlock["media"]) || undefined,
        timeAvailable: hostQuestion.time || 0,
        timeRemaining: hostQuestion.time || 0,
        pointsMultiplier:
          hostQuestion.pointsMultiplier === 0
            ? 0
            : hostQuestion.pointsMultiplier || 1,
        numberOfAnswersAllowed: 1,
        getReadyTimeAvailable: 5000,
        getReadyTimeRemaining: 5000,
        gameBlockType: hostQuestion.type,
      };
      switch (hostQuestion.type) {
        case "content":
          return {
            ...baseBlock,
            type: "content",
            description: hostQuestion.description || "",
            pointsMultiplier: undefined,
            timeAvailable: 0,
            timeRemaining: 0,
            numberOfAnswersAllowed: undefined,
          } as ContentBlock;
        case "quiz":
        case "jumble":
        case "survey":
          const playerChoices = hostQuestion.choices.map(
            ({ correct, ...choiceData }) => choiceData
          );
          const choicesToSend =
            hostQuestion.type === "jumble"
              ? [...playerChoices].sort(() => Math.random() - 0.5)
              : playerChoices;
          return {
            ...baseBlock,
            type: hostQuestion.type,
            choices: choicesToSend,
            numberOfChoices: choicesToSend.length,
            pointsMultiplier:
              hostQuestion.type === "survey"
                ? undefined
                : baseBlock.pointsMultiplier,
          } as GameBlock;
        case "open_ended":
          return {
            ...baseBlock,
            type: "open_ended",
            choices: undefined,
            numberOfChoices: 0,
          } as QuestionOpenEnded;
        default:
          console.warn("Unknown host question type:", hostQuestion.type);
          return null;
      }
    },
    [quizData]
  );

  // Prepare WS message for sending block (keep useCallback)
  const sendBlockToPlayers = useCallback(
    (blockToSend: GameBlock | null) => {
      // ... (implementation remains the same) ...
      if (!blockToSend || !liveGameStateRef.current) return null; // Check ref
      console.log(
        "[DEBUG] Preparing block to send to players:",
        blockToSend.type
      );
      const contentString = JSON.stringify(blockToSend);
      const wsMessage = {
        channel: "/service/player", // Target channel for broadcast
        data: {
          gameid: liveGameStateRef.current.gamePin, // Use gamePin from ref
          type: "message",
          id: isContentBlock(blockToSend) ? 1 : 2, // Type ID (1=GetReady/Content, 2=Question)
          content: contentString,
          host: "VuiQuiz.com", // Optional host identifier
        },
      };
      // Return the structure that HostPage expects to send
      // HostPage needs to handle the actual sending via stompClient.publish
      return JSON.stringify([wsMessage]); // Wrap in array
    },
    [] // Depends only on ref, which doesn't need to be listed
  );

  // Effect to update current block (keep as is)
  useEffect(() => {
    if (
      !liveGameState ||
      liveGameState.status === "LOBBY" ||
      liveGameState.status === "ENDED" ||
      !quizData
    ) {
      setCurrentBlock(null);
      return;
    }
    const idx = liveGameState.currentQuestionIndex;
    console.log(`[DEBUG] Processing question index update: ${idx}`);
    if (quizData && idx >= 0 && idx < quizData.questions.length) {
      const hostQuestion = quizData.questions[idx];
      const formattedBlock = formatQuestionForPlayer(hostQuestion, idx);
      setCurrentBlock(formattedBlock);
      setLiveGameState((prev) => {
        if (!prev) return null;
        console.log(
          `[DEBUG] Updating question timing information for index: ${idx}`
        );
        return {
          ...prev,
          currentQuestionStartTime: Date.now(),
          currentQuestionEndTime:
            Date.now() +
            (formattedBlock?.timeAvailable ?? 0) +
            (formattedBlock?.getReadyTimeAvailable ?? 5000),
        };
      });
    } else if (quizData && idx >= quizData.questions.length) {
      console.log("[DEBUG] Reached end of questions, moving to PODIUM");
      setLiveGameState((prev) =>
        prev ? { ...prev, status: "PODIUM" as const } : null
      );
      setCurrentBlock(null);
    }
  }, [
    liveGameState?.currentQuestionIndex, // Use optional chaining for safety
    liveGameState?.status,
    quizData,
    formatQuestionForPlayer,
  ]);

  // Effect to update timerKey (keep as is)
  useEffect(() => {
    setTimerKey(
      liveGameState
        ? liveGameState.currentQuestionIndex >= 0
          ? liveGameState.currentQuestionIndex
          : liveGameState.status
        : "initial"
    );
  }, [liveGameState?.currentQuestionIndex, liveGameState?.status]);

  // Player join/update logic (keep useCallback)
  const addOrUpdatePlayer = useCallback(
    (cid: string, nickname: string, joinTimestamp: number) => {
      console.log(
        `[DEBUG] Host: Adding/Updating player - CID: ${cid}, Nickname: ${nickname}`
      );
      setLiveGameState((prev) => {
        if (!prev) return null; // Handle null state
        const existingPlayer = prev.players[cid];
        // FIX: Explicitly type the new/updated player object
        let updatedPlayer: LivePlayerState;

        if (existingPlayer) {
          updatedPlayer = {
            ...existingPlayer,
            nickname: nickname,
            isConnected: true,
            playerStatus: "PLAYING",
            lastActivityAt: joinTimestamp,
          };
        } else {
          updatedPlayer = {
            cid: cid,
            nickname: nickname,
            avatar: { type: 1800, item: 3100 },
            isConnected: true,
            joinedAt: Date.now(),
            userId: undefined,
            lastActivityAt: Date.now(),
            playerStatus: "PLAYING",
            joinSlideIndex: prev.currentQuestionIndex,
            waitingSince: null,
            deviceInfoJson: null,
            totalScore: 0,
            rank: 0,
            currentStreak: 0,
            maxStreak: 0,
            lastAnswerTimestamp: null,
            answers: [],
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0,
            answersCount: 0,
            totalReactionTimeMs: 0,
          };
        }
        const updatedPlayers = { ...prev.players, [cid]: updatedPlayer };
        // Ensure hostUserId is valid before filtering
        const hostId = prev.hostUserId ?? "";
        setTotalPlayers(
          Object.keys(updatedPlayers).filter((id) => id !== hostId).length
        );
        return { ...prev, players: updatedPlayers }; // Return valid LiveGameState
      });
    },
    []
  );

  // Log answer stats (keep useCallback)
  const logAnswerStats = useCallback(() => {
    /* ... same ... */
    if (!liveGameState) return;
    const hostQuestion = getCurrentHostQuestion();
    if (
      !hostQuestion ||
      (hostQuestion.type !== "quiz" && hostQuestion.type !== "survey")
    )
      return;
    const choiceCounts: Record<number | string, number> = {};
    const currentIdx = liveGameState.currentQuestionIndex;
    Object.values(liveGameState.players).forEach((player) => {
      const answer = player.answers.find((a) => a.questionIndex === currentIdx);
      if (answer) {
        const choiceKey =
          typeof answer.choice === "object" && answer.choice !== null
            ? JSON.stringify(answer.choice)
            : String(answer.choice ?? answer.text ?? "N/A");
        choiceCounts[choiceKey] = (choiceCounts[choiceKey] || 0) + 1;
      }
    });
    console.log(
      `[DEBUG] Host Stats (Q${currentIdx}): Current Choice Counts:`,
      choiceCounts
    );
  }, [liveGameState, getCurrentHostQuestion]);

  // --- Define the core answer logic function (NO useCallback) ---
  const playerAnswerLogic = (
    playerId: string,
    submittedPayload: PlayerAnswerPayload,
    answerTimestamp: number | undefined
  ) => {
    console.log(
      `[DEBUG] Answer attempt - Player: ${playerId}, Question: ${submittedPayload.questionIndex}, Type: ${submittedPayload.type}`
    );

    // *** READ FROM REF for checks ***
    const currentState = liveGameStateRef.current;
    const hostQuestion = getCurrentHostQuestion(); // Uses ref implicitly now
    const timestamp = answerTimestamp || Date.now();

    if (!quizData || !currentState) {
      console.log(
        `[DEBUG] Answer rejected - No quizData or currentState in ref`
      );
      return;
    }

    // *** Use currentState from REF for checks ***
    if (
      currentState.status !== "QUESTION_SHOW" ||
      !hostQuestion ||
      hostQuestion.type === "content" ||
      submittedPayload.questionIndex !== currentState.currentQuestionIndex
    ) {
      console.log(
        `[DEBUG] Answer rejected - Ref_Status: ${currentState.status}, HostQ: ${hostQuestion?.type}, Ref_Index: ${currentState.currentQuestionIndex}, Got: ${submittedPayload.questionIndex}, currentState: ${currentState}`
      );
      return;
    }

    // *** State update logic remains the same, using the functional form ***
    setLiveGameState((prev) => {
      if (!prev) {
        return null;
      }
      const currentPlayerState = prev.players[playerId];
      if (
        !currentPlayerState ||
        currentPlayerState.answers.some(
          (a) => a.questionIndex === prev.currentQuestionIndex
        )
      ) {
        return prev; // Duplicate or invalid player
      }
      console.log(
        `[DEBUG] Processing valid answer - Player: ${currentPlayerState.nickname}`
      );
      // ... (rest of scoring logic using 'hostQuestion' and 'timestamp') ...
      let isCorrect = false;
      let basePoints = 0;
      let finalPointsEarned = 0;
      let currentStatus: PlayerAnswerRecord["status"] = "SUBMITTED";
      let pointsDataResult: PointsData | null = null;
      let playerChoice: PlayerAnswerRecord["choice"] = null;
      let playerText: PlayerAnswerRecord["text"] = null;
      const reactionTimeMs = prev.currentQuestionStartTime
        ? timestamp - prev.currentQuestionStartTime
        : hostQuestion.time ?? 0;
      switch (submittedPayload.type) {
        case "quiz":
        case "survey":
          playerChoice = (submittedPayload as AnswerPayloadQuiz).choice;
          if (
            hostQuestion.type === "quiz" &&
            hostQuestion.choices[playerChoice]?.correct
          ) {
            isCorrect = true;
          }
          break;
        case "jumble":
          playerChoice = (submittedPayload as AnswerPayloadJumble).choice;
          const correctJumbleOrder = hostQuestion.choices.map((_, i) => i);
          isCorrect =
            JSON.stringify(playerChoice) === JSON.stringify(correctJumbleOrder);
          break;
        case "open_ended":
          playerChoice = (submittedPayload as AnswerPayloadOpenEnded).text;
          playerText = (submittedPayload as AnswerPayloadOpenEnded).text;
          const correctTexts = hostQuestion.choices.map((c) =>
            c.answer?.toLowerCase()
          );
          isCorrect = correctTexts.includes(playerText?.toLowerCase());
          break;
      }
      if (hostQuestion.type !== "survey" && isCorrect) {
        currentStatus = "CORRECT";
        const timeFactor = Math.max(
          0,
          1 - reactionTimeMs / (hostQuestion.time ?? 20000) / 2
        );
        basePoints = 1000;
        finalPointsEarned = Math.round(
          basePoints * (hostQuestion.pointsMultiplier ?? 1) * timeFactor
        );
      } else if (hostQuestion.type !== "survey" && !isCorrect) {
        currentStatus = "WRONG";
        finalPointsEarned = 0;
      } else {
        currentStatus = "SUBMITTED";
        finalPointsEarned = 0;
      }
      pointsDataResult = {
        totalPointsWithBonuses: finalPointsEarned,
        questionPoints: finalPointsEarned,
        answerStreakPoints: {
          streakLevel: isCorrect ? currentPlayerState.currentStreak + 1 : 0,
          previousStreakLevel: currentPlayerState.currentStreak,
        },
        lastGameBlockIndex: prev.currentQuestionIndex,
      };
      const newAnswerRecord: PlayerAnswerRecord = {
        questionIndex: prev.currentQuestionIndex,
        blockType: submittedPayload.type,
        choice: playerChoice,
        text: playerText,
        reactionTimeMs: reactionTimeMs,
        answerTimestamp: timestamp,
        isCorrect: isCorrect,
        status: currentStatus,
        basePoints: basePoints,
        finalPointsEarned: finalPointsEarned,
        pointsData: pointsDataResult,
      };
      const updatedPlayer: LivePlayerState = {
        ...currentPlayerState,
        totalScore: currentPlayerState.totalScore + finalPointsEarned,
        lastActivityAt: timestamp,
        currentStreak: isCorrect ? currentPlayerState.currentStreak + 1 : 0,
        answers: [...currentPlayerState.answers, newAnswerRecord],
        correctCount: currentPlayerState.correctCount + (isCorrect ? 1 : 0),
        incorrectCount:
          currentPlayerState.incorrectCount +
          (!isCorrect && hostQuestion.type !== "survey" ? 1 : 0),
        answersCount: currentPlayerState.answersCount + 1,
        totalReactionTimeMs:
          currentPlayerState.totalReactionTimeMs + reactionTimeMs,
        playerStatus: "PLAYING",
      };
      updatedPlayer.maxStreak = Math.max(
        updatedPlayer.maxStreak,
        updatedPlayer.currentStreak
      );
      return {
        ...prev,
        players: { ...prev.players, [playerId]: updatedPlayer },
      };
    });
  };

  // --- Ref to hold the latest version of the answer logic function ---
  const latestPlayerAnswerLogicRef = useRef(playerAnswerLogic);
  useEffect(() => {
    latestPlayerAnswerLogicRef.current = playerAnswerLogic;
  }, [playerAnswerLogic]); // Update ref when the logic function changes

  // Handle avatar change message (keep useCallback)
  const handleAvatarChangeMessage = useCallback(
    /* ... same, ensure return prev on error/null ... */
    (message: MockWebSocketMessage) => {
      setLiveGameState((prev) => {
        if (!prev) return null;
        const playerId = message?.data?.cid;
        const contentString = message?.data?.content;
        if (!playerId || !contentString) {
          console.warn("(Hook) Invalid avatar change message:", message);
          return prev;
        }
        try {
          const parsedContent = JSON.parse(contentString);
          const avatarId = parsedContent?.avatar?.id;
          if (typeof avatarId !== "number") {
            console.warn("(Hook) Avatar ID missing or invalid:", parsedContent);
            return prev;
          }
          const playerToUpdate = prev.players[playerId];
          if (!playerToUpdate) {
            console.warn(
              `(Hook) Avatar change for unknown player CID: ${playerId}`
            );
            return prev;
          }
          const avatarType = Math.floor(avatarId / 1000) * 1000;
          const avatarItem = avatarId;
          const updatedPlayer: LivePlayerState = {
            ...playerToUpdate,
            avatar: { type: avatarType, item: avatarItem },
            lastActivityAt: message?.ext?.timetrack ?? Date.now(),
          };
          return {
            ...prev,
            players: { ...prev.players, [playerId]: updatedPlayer },
          };
        } catch (error) {
          console.error(
            "(Hook) Error parsing avatar change content:",
            error,
            contentString
          );
          return prev;
        }
      });
    },
    []
  );

  // --- State changing actions ---
  // advanceToQuestion (NO useCallback)
  const advanceToQuestion = (index: number) => {
    console.log(`[ADVANCE_DEBUG] Host: Advancing to question ${index}`);
    setLiveGameState((prev) => {
      if (!prev) {
        console.error("[ADVANCE_DEBUG] Cannot advance, previous state is null");
        return null;
      }
      console.log(
        `[ADVANCE_DEBUG] Setting state from index ${prev.currentQuestionIndex} to ${index}`
      );
      const newState = {
        ...prev,
        status: "QUESTION_SHOW" as const,
        currentQuestionIndex: index,
        currentQuestionStartTime: null,
        currentQuestionEndTime: null,
      };
      console.log("[ADVANCE_DEBUG] New state calculated:", newState);
      return newState;
    });
  };

  // showResults (useCallback is fine, uses state setter)
  const showResults = useCallback((questionIndex: number, resultsData: any) => {
    console.log(`[DEBUG] Showing results for question ${questionIndex}`);
    // Add logic to handle showing results, e.g., updating state or sending data
    setLiveGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "QUESTION_RESULT",
        currentQuestionIndex: questionIndex,
      };
    });
  }, []);

  // handleTimeUp (useCallback is fine, uses state setter and calls showResults)
  // Define handleTimeUp before handleNext
  const handleTimeUp = useCallback(() => {
    /* ... same, ensures return prev if needed ... */
    if (!liveGameState || liveGameState.status !== "QUESTION_SHOW" || !quizData)
      return;
    const currentIdx = liveGameState.currentQuestionIndex;
    console.log("(Hook) Host detected time up for question:", currentIdx);
    const hostQuestion = getCurrentHostQuestion();
    if (!hostQuestion) return;
    const questionTime = hostQuestion.time ?? 0;
    setLiveGameState((prev) => {
      if (!prev || prev.status !== "QUESTION_SHOW") return prev;
      const updatedPlayers = { ...prev.players };
      let changesMade = false;
      Object.keys(updatedPlayers).forEach((cid) => {
        const player = updatedPlayers[cid];
        const hasAnswered = player.answers.some(
          (a) => a.questionIndex === currentIdx
        );
        if (!hasAnswered && player.isConnected) {
          const timeoutAnswer: PlayerAnswerRecord = {
            questionIndex: currentIdx,
            blockType: hostQuestion.type,
            choice: null,
            text: null,
            reactionTimeMs: questionTime,
            answerTimestamp: Date.now(),
            isCorrect: false,
            status: "TIMEOUT",
            basePoints: 0,
            finalPointsEarned: 0,
            pointsData: {
              totalPointsWithBonuses: 0,
              questionPoints: 0,
              answerStreakPoints: {
                streakLevel: 0,
                previousStreakLevel: player.currentStreak,
              },
              lastGameBlockIndex: currentIdx,
            },
          };
          updatedPlayers[cid] = {
            ...player,
            answers: [...player.answers, timeoutAnswer],
            currentStreak: 0,
            unansweredCount: player.unansweredCount + 1,
            lastActivityAt: Date.now(),
          };
          changesMade = true;
        }
      });
      return { ...prev, players: updatedPlayers };
    });
    setTimeout(() => {
      console.log(
        "[TIMEUP_DEBUG] Calling showResults after timeout processing"
      );
      showResults(currentIdx, {}); // Pass currentIdx as questionIndex and an empty object as resultsData
    }, 0);
  }, [liveGameState, quizData, getCurrentHostQuestion, showResults]);

  // Handle Next depends on handleTimeUp
  const handleNext = useCallback(() => {
    console.log(
      "[NEXT_DEBUG] handleNext called. Current state:",
      liveGameState?.status,
      "Index:",
      liveGameState?.currentQuestionIndex
    );
    if (!liveGameState || !quizData) {
      console.log("[NEXT_DEBUG] Aborted: missing liveGameState or quizData");
      return;
    }

    // --- Use local variable for status check ---
    const currentStatus = liveGameState.status;

    if (currentStatus === "LOBBY") {
      console.log("[NEXT_DEBUG] Action: Advancing from LOBBY to Q0");
      advanceToQuestion(0);
    } else if (currentStatus === "QUESTION_SHOW") {
      console.log(
        "[NEXT_DEBUG] Action: Ending current question via handleTimeUp"
      );
      handleTimeUp(); // This should eventually call showResults
    } else if (currentStatus === "QUESTION_RESULT") {
      const nextIndex = liveGameState.currentQuestionIndex + 1;
      if (nextIndex < quizData.questions.length) {
        console.log(
          `[NEXT_DEBUG] Action: Advancing from RESULT to Q${nextIndex}`
        );
        advanceToQuestion(nextIndex);
      } else {
        console.log("[NEXT_DEBUG] Action: Reached end of quiz, setting PODIUM");
        setLiveGameState((prev) => {
          if (!prev) return null;
          console.log("[NEXT_DEBUG] Setting state to PODIUM");
          const newState = { ...prev, status: "PODIUM" as const };
          console.log("[NEXT_DEBUG] New state calculated (PODIUM):", newState);
          return newState;
        });
        setCurrentBlock(null);
      }
    } else {
      console.log(
        `[NEXT_DEBUG] Action: No specific action for state: ${currentStatus}`
      );
    }
  }, [
    liveGameState,
    quizData,
    advanceToQuestion,
    handleTimeUp,
    setLiveGameState,
    setCurrentBlock,
  ]); // Add setLiveGameState and setCurrentBlock if needed

  const handleSkip = useCallback(() => {
    console.log(
      "[SKIP_DEBUG] handleSkip called. Current state:",
      liveGameState?.status,
      "Index:",
      liveGameState?.currentQuestionIndex
    );
    if (!liveGameState || !quizData) {
      console.log("[SKIP_DEBUG] Aborted: missing liveGameState or quizData");
      return;
    }

    const nextIndex = liveGameState.currentQuestionIndex + 1;

    if (nextIndex < quizData.questions.length) {
      console.log(`[SKIP_DEBUG] Action: Skipping to question ${nextIndex}`);
      advanceToQuestion(nextIndex);
    } else {
      console.log("[SKIP_DEBUG] Action: Skip at end of quiz, setting PODIUM");
      setLiveGameState((prev) => {
        if (!prev) return null;
        console.log("[SKIP_DEBUG] Setting state to PODIUM");
        const newState = { ...prev, status: "PODIUM" as const };
        console.log("[SKIP_DEBUG] New state calculated (PODIUM):", newState);
        return newState;
      });
      setCurrentBlock(null);
    }
  }, [
    liveGameState,
    quizData,
    advanceToQuestion,
    setLiveGameState,
    setCurrentBlock,
  ]); // Add dependencies

  // Unified message handler - *Keep* useCallback for stability when passed down
  // It now calls the ref to the up-to-date logic function
  const handleWebSocketMessage = useCallback(
    (message: MockWebSocketMessage | string) => {
      console.log("(Hook) Processing message:", message);
      let parsedMessage: any = null;
      let messageList: any[] = [];
      try {
        if (typeof message === "string") {
          messageList = JSON.parse(message);
        } else if (typeof message === "object" && message !== null) {
          messageList = [message];
        } else {
          console.warn("(Hook) Received invalid message type:", typeof message);
          return;
        }
        parsedMessage =
          Array.isArray(messageList) && messageList.length > 0
            ? messageList[0]
            : messageList;
      } catch (e) {
        console.error("(Hook) Error parsing message body:", e, message);
        return;
      }

      const data = parsedMessage?.data;
      const type = data?.type;
      const id = data?.id;
      const cid = data?.cid;
      console.log(
        `[DEBUG] Parsed message - Type: ${type}, ID: ${id}, CID: ${cid}`
      );

      // Handle Init/Participant/Login (using addOrUpdatePlayer)
      if (
        type === "__INIT__" &&
        data?.gamePin &&
        data?.hostUserId &&
        data?.quizId
      ) {
        console.log("[DEBUG] Initializing game state from Page component");
        setLiveGameState((prev) => {
          const newState = {
            ...(prev ?? createInitialGameState(data.quizId)),
            gamePin: data.gamePin,
            hostUserId: data.hostUserId,
            quizId: data.quizId,
            status: "LOBBY" as const,
          };
          console.log("[DEBUG] New state after INIT:", newState);
          return newState;
        });
      }
      if (type === "PARTICIPANT_JOINED" || type === "PARTICIPANT_LEFT") {
        /* ... update count ... */ return;
      }
      if (type === "login" || type === "joined" || type === "IDENTIFY") {
        const nickname = data.name;
        if (cid && nickname) {
          addOrUpdatePlayer(
            cid,
            nickname,
            parsedMessage.ext?.timetrack ?? Date.now()
          );
        } else {
          /* warn */
        }
        return;
      }

      // --- Check if it's an answer message ---
      // Use ref to check hostUserId to ensure latest value is used
      if (
        (id === 6 || id === 45 || type === "message") &&
        cid &&
        data.content &&
        cid !== liveGameStateRef.current?.hostUserId
      ) {
        try {
          const payload = JSON.parse(data.content) as PlayerAnswerPayload;
          if (payload.type && payload.questionIndex !== undefined) {
            console.log(
              `[DEBUG] Processing player answer via WebSocket - Player: ${cid}, Type: ${payload.type}`
            );
            // *** CALL THE LATEST LOGIC FROM THE REF ***
            latestPlayerAnswerLogicRef.current(
              cid,
              payload,
              parsedMessage.ext?.timetrack
            );
          } else {
            console.log(
              "(Hook) Received player message, but not identified as answer:",
              payload
            );
          }
        } catch (e) {
          console.error(
            "(Hook) Error parsing player message content:",
            e,
            data.content
          );
        }
        return;
      }

      // Handle avatar change
      if (id === 46 && cid) {
        console.log(`[DEBUG] Processing avatar change - Player: ${cid}`);
        handleAvatarChangeMessage(parsedMessage);
        return;
      }

      // Handle game control (ensure handleNext/handleSkip refs are stable or use refs too if needed)
      if (type === "GAME_CONTROL") {
        console.log(`[DEBUG] Game control message received: ${data.action}`);
        if (data.action === "NEXT") {
          console.log("[DEBUG] Processing NEXT action from websocket");
          handleNext();
          return;
        }
        if (data.action === "SKIP") {
          console.log("[DEBUG] Processing SKIP action from websocket");
          handleSkip();
          return;
        }
      }

      console.log("[DEBUG] Unhandled message type/id:", type ?? id, data);
    },
    [addOrUpdatePlayer, handleAvatarChangeMessage, handleNext, handleSkip]
  ); // Dependencies for handleWebSocketMessage itself

  // Prepare Results Message (useCallback is likely fine, reads state via ref)
  const prepareResultsMessage = useCallback(
    (playerId: string) => {
      const currentState = liveGameStateRef.current; // Read latest state from ref
      if (!currentState || !quizData) return null;
      // ... (rest of the logic using currentState) ...
      const currentIdx = currentState.currentQuestionIndex;
      const player = currentState.players[playerId];
      if (!player) return null;
      const playerAnswer = player.answers.find(
        (a) => a.questionIndex === currentIdx
      );
      if (!playerAnswer) return null;
      const hostQuestion = getCurrentHostQuestion();
      if (!hostQuestion) return null;
      const basePayload = {
        rank: player.rank,
        totalScore: player.totalScore,
        pointsData: playerAnswer.pointsData,
        hasAnswer: playerAnswer.status !== "TIMEOUT",
        type: playerAnswer.blockType,
        choice: playerAnswer.choice,
        points: playerAnswer.finalPointsEarned,
        isCorrect: playerAnswer.isCorrect,
        text: playerAnswer.text || "",
      };
      let finalPayload: QuestionResultPayload;
      const correctChoicesIndices = hostQuestion.choices
        .map((choice, index) => (choice.correct ? index : -1))
        .filter((index) => index !== -1);
      const correctTexts = hostQuestion.choices
        .map((choice) => choice.answer)
        .filter(Boolean);
      switch (playerAnswer.blockType) {
        case "quiz":
          finalPayload = {
            ...basePayload,
            type: "quiz",
            choice: basePayload.choice as number,
            correctChoices: correctChoicesIndices,
            pointsData: basePayload.pointsData ?? {
              totalPointsWithBonuses: 0,
              questionPoints: 0,
              answerStreakPoints: {
                streakLevel: 0,
                previousStreakLevel: 0,
              },
              lastGameBlockIndex: -1,
            },
          };
          break;
        case "jumble":
          finalPayload = {
            ...basePayload,
            type: "jumble",
            choice: basePayload.choice as number[],
            correctChoices: correctChoicesIndices,
            pointsData: basePayload.pointsData ?? {
              totalPointsWithBonuses: 0,
              questionPoints: 0,
              answerStreakPoints: {
                streakLevel: 0,
                previousStreakLevel: 0,
              },
              lastGameBlockIndex: -1,
            },
          };
          break;
        case "open_ended":
          finalPayload = {
            ...basePayload,
            type: "open_ended",
            text: basePayload.text,
            correctTexts: correctTexts as string[],
            choice:
              typeof basePayload.choice === "string" ||
              typeof basePayload.choice === "number"
                ? basePayload.choice
                : null,
            pointsData: basePayload.pointsData ?? {
              totalPointsWithBonuses: 0,
              questionPoints: 0,
              answerStreakPoints: {
                streakLevel: 0,
                previousStreakLevel: 0,
              },
              lastGameBlockIndex: -1,
            },
          };
          break;
        case "survey":
          finalPayload = {
            ...basePayload,
            type: "survey",
            choice:
              typeof basePayload.choice === "number" ? basePayload.choice : 0,
            points: undefined, // Ensure points is undefined for surveys
            isCorrect: undefined, // Ensure isCorrect is undefined for surveys
            pointsData: {
              totalPointsWithBonuses: 0,
              questionPoints: 0,
              answerStreakPoints: {
                streakLevel: 0,
                previousStreakLevel: 0,
              },
              lastGameBlockIndex: -1,
            }, // Provide a default PointsData object
          };
          break;
        default:
          return null;
      }
      const contentString = JSON.stringify(finalPayload);
      const wsMessage = {
        channel: "/service/player",
        data: {
          gameid: currentState.gamePin,
          type: "message",
          id: 8,
          content: contentString,
          cid: playerId,
        },
        ext: { timetrack: Date.now() },
      };
      return JSON.stringify([wsMessage]);
    },
    [quizData, getCurrentHostQuestion] // Dependencies don't include liveGameState directly
  );

  // Derived values
  const currentQuestionAnswerCount = liveGameState
    ? Object.values(liveGameState.players).filter((p) =>
        p.answers.some(
          (a) => a.questionIndex === liveGameState.currentQuestionIndex
        )
      ).length
    : 0;

  // Return statement
  return {
    liveGameState,
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers: totalPlayers,
    quizData,
    handleNext,
    handleSkip,
    handleTimeUp,
    handleWebSocketMessage,
    initializeSession,
    sendBlockToPlayers,
    prepareResultsMessage,
  };
}
