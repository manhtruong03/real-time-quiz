// src/hooks/useHostGame.ts
import { useState, useCallback, useEffect } from "react";
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
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls";

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
  ); // Correctly typed as potentially null
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [timerKey, setTimerKey] = useState<string | number>("initial");
  const [totalPlayers, setTotalPlayers] = useState(0);

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
    // If initialQuizData becomes null (e.g., error loading), maybe reset liveGameState?
    // else if (!initialQuizData && liveGameState) {
    //     setLiveGameState(null);
    // }
  }, [initialQuizData]); // Removed liveGameState dependency to prevent potential loops

  // Function for Page component to initialize session details
  const initializeSession = useCallback(
    (pin: string, hostId: string) => {
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

  // Helper to get current host question
  const getCurrentHostQuestion = useCallback((): QuestionHost | null => {
    if (
      !quizData ||
      !liveGameState ||
      liveGameState.currentQuestionIndex < 0 ||
      liveGameState.currentQuestionIndex >= quizData.questions.length
    ) {
      return null;
    }
    return quizData.questions[liveGameState.currentQuestionIndex];
  }, [quizData, liveGameState]);

  // Format question for player
  const formatQuestionForPlayer = useCallback(
    /* ... same ... */
    (
      hostQuestion: QuestionHost | null,
      questionIdx: number
    ): GameBlock | null => {
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

  // Placeholder for actual sending
  const sendBlockToPlayers = useCallback(
    (blockToSend: GameBlock | null) => {
      if (!blockToSend || !liveGameState) return;
      console.log("(Hook Placeholder) Would send block:", blockToSend);
    },
    [liveGameState]
  );

  // Update currentBlock based on index
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
    if (quizData && idx >= 0 && idx < quizData.questions.length) {
      const hostQuestion = quizData.questions[idx];
      const formattedBlock = formatQuestionForPlayer(hostQuestion, idx);
      setCurrentBlock(formattedBlock);
      setLiveGameState((prev) =>
        prev
          ? {
              ...prev,
              currentQuestionStartTime: Date.now(),
              currentQuestionEndTime:
                Date.now() +
                (formattedBlock?.timeAvailable ?? 0) +
                (formattedBlock?.getReadyTimeAvailable ?? 5000),
            }
          : null
      );
    } else if (quizData && idx >= quizData.questions.length) {
      setLiveGameState((prev) => (prev ? { ...prev, status: "PODIUM" } : null));
      setCurrentBlock(null);
    }
  }, [
    liveGameState?.currentQuestionIndex,
    liveGameState?.status,
    quizData,
    formatQuestionForPlayer,
  ]);

  // Update timerKey
  useEffect(() => {
    setTimerKey(
      liveGameState
        ? liveGameState.currentQuestionIndex >= 0
          ? liveGameState.currentQuestionIndex
          : liveGameState.status
        : "initial"
    );
  }, [liveGameState?.currentQuestionIndex, liveGameState?.status]);

  // Player join/update logic
  const addOrUpdatePlayer = useCallback(
    (cid: string, nickname: string, joinTimestamp: number) => {
      console.log(
        `(Hook) Host: Adding/Updating player - CID: ${cid}, Nickname: ${nickname}`
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

  // Log answer stats
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
      `(Hook) Host Stats (Q${currentIdx}): Current Choice Counts:`,
      choiceCounts
    );
  }, [liveGameState, getCurrentHostQuestion]);

  // Handle player answer message
  const handlePlayerAnswer = useCallback(
    (
      playerId: string,
      submittedPayload: PlayerAnswerPayload,
      answerTimestamp: number | undefined
    ) => {
      if (!quizData || !liveGameState) return; // Check liveGameState
      const hostQuestion = getCurrentHostQuestion();
      const timestamp = answerTimestamp || Date.now();
      if (
        liveGameState.status !== "QUESTION_SHOW" ||
        !hostQuestion ||
        hostQuestion.type === "content" ||
        submittedPayload.questionIndex !== liveGameState.currentQuestionIndex
      ) {
        /* ... */ return;
      }
      setLiveGameState((prev) => {
        if (!prev) return null; // Handle null state
        const currentPlayerState = prev.players[playerId];
        if (
          !currentPlayerState ||
          currentPlayerState.answers.some(
            (a) => a.questionIndex === prev.currentQuestionIndex
          )
        ) {
          /* ... */ return prev;
        }
        // ... scoring logic ...
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
              JSON.stringify(playerChoice) ===
              JSON.stringify(correctJumbleOrder);
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

        // FIX: Explicitly type updatedPlayer
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
          playerStatus: "PLAYING", // Ensure valid literal type
        };
        updatedPlayer.maxStreak = Math.max(
          updatedPlayer.maxStreak,
          updatedPlayer.currentStreak
        );
        // Return the updated state object
        return {
          ...prev,
          players: { ...prev.players, [playerId]: updatedPlayer },
        };
      });
    },
    [liveGameState, quizData, getCurrentHostQuestion]
  );

  // Handle avatar change message
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

  // Unified message handler
  const handleWebSocketMessage = useCallback(
    (message: MockWebSocketMessage | string) => {
      /* ... same logic ... */
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
        if (!Array.isArray(messageList) || messageList.length === 0) {
          console.warn("(Hook) Received empty or non-array message list.");
          return;
        }
        parsedMessage = messageList[0];
      } catch (e) {
        console.error("(Hook) Error parsing message body:", e, message);
        return;
      }
      const data = parsedMessage?.data;
      const type = data?.type;
      const id = data?.id;
      const cid = data?.cid;
      if (
        type === "__INIT__" &&
        data?.gamePin &&
        data?.hostUserId &&
        data?.quizId
      ) {
        console.log("(Hook) Initializing game state from Page component");
        setLiveGameState((prev) => ({
          ...(prev ?? createInitialGameState(data.quizId)),
          gamePin: data.gamePin,
          hostUserId: data.hostUserId,
          quizId: data.quizId,
          status: "LOBBY",
        }));
        return;
      }
      if (type === "PARTICIPANT_JOINED" || type === "PARTICIPANT_LEFT") {
        console.log(
          `(Hook) Participant update - Type: ${type}, Affected ID: ${data.affectedId}, Count: ${data.playerCount}`
        );
        setLiveGameState((prev) => {
          if (!prev) return null;
          setTotalPlayers(data.playerCount ?? 0);
          return prev;
        });
        return;
      }
      if (type === "login" || type === "IDENTIFY") {
        const nickname = data.name;
        if (cid && nickname) {
          addOrUpdatePlayer(
            cid,
            nickname,
            parsedMessage.ext?.timetrack ?? Date.now()
          );
        } else {
          console.warn(
            "(Hook) Received identify/login message with missing CID or name:",
            data
          );
        }
        return;
      }
      if (
        (id === 6 || id === 45 || type === "message") &&
        cid &&
        data.content &&
        cid !== liveGameState?.hostUserId
      ) {
        try {
          const payload = JSON.parse(data.content) as PlayerAnswerPayload;
          if (payload.type && payload.questionIndex !== undefined) {
            handlePlayerAnswer(cid, payload, parsedMessage.ext?.timetrack);
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
      if (id === 46 && cid) {
        handleAvatarChangeMessage(parsedMessage);
        return;
      }
      console.log("(Hook) Unhandled message type/id:", type ?? id, data);
    },
    [
      addOrUpdatePlayer,
      handlePlayerAnswer,
      handleAvatarChangeMessage,
      liveGameState?.hostUserId,
    ]
  );

  // Show results
  const showResults = useCallback(() => {
    /* ... same, ensures return prev if needed ... */
    if (!liveGameState || !quizData) return;
    const currentIdx = liveGameState.currentQuestionIndex;
    console.log(
      "(Hook Placeholder) Would calculate and send results for question",
      currentIdx
    );
    let rankedPlayersMap = { ...liveGameState.players };
    const rankedPlayerList = Object.values(rankedPlayersMap).sort(
      (a, b) => b.totalScore - a.totalScore
    );
    rankedPlayerList.forEach((player, index) => {
      if (rankedPlayersMap[player.cid]) {
        rankedPlayersMap[player.cid].rank = index + 1;
      }
    });
    setLiveGameState((prev) =>
      prev
        ? { ...prev, status: "QUESTION_RESULT", players: rankedPlayersMap }
        : null
    );
    logAnswerStats();
    setTimerKey(`result-${currentIdx}`);
  }, [liveGameState, quizData, logAnswerStats]);

  // Advance question logic
  const advanceToQuestion = (index: number) => {
    /* ... same, ensures return prev if needed ... */
    console.log(`(Hook) Host: Advancing to question ${index}`);
    setLiveGameState((prev) =>
      prev
        ? {
            ...prev,
            status: "QUESTION_SHOW",
            currentQuestionIndex: index,
            currentQuestionStartTime: null,
            currentQuestionEndTime: null,
          }
        : null
    );
  };

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
    setTimeout(() => showResults(), 0);
  }, [liveGameState, quizData, getCurrentHostQuestion, showResults]);

  // Handle Next depends on handleTimeUp
  const handleNext = useCallback(() => {
    /* ... same ... */
    if (!liveGameState || !quizData) return;
    console.log("(Hook) Host clicked next");
    if (liveGameState.status === "LOBBY") {
      advanceToQuestion(0);
    } else if (liveGameState.status === "QUESTION_SHOW") {
      handleTimeUp();
    } else if (liveGameState.status === "QUESTION_RESULT") {
      const nextIndex = liveGameState.currentQuestionIndex + 1;
      if (nextIndex < quizData.questions.length) {
        advanceToQuestion(nextIndex);
      } else {
        console.log("(Hook) Host: Reached end of quiz.");
        setLiveGameState((prev) =>
          prev ? { ...prev, status: "PODIUM" } : null
        );
        setCurrentBlock(null);
      }
    } else {
      console.log(
        `(Hook) Host: Next clicked in unhandled state: ${liveGameState.status}`
      );
    }
  }, [liveGameState, quizData, advanceToQuestion, handleTimeUp]);

  // Handle Skip
  const handleSkip = useCallback(() => {
    /* ... same ... */
    if (!liveGameState || !quizData) return;
    console.log(
      "(Hook) Host skipped question",
      liveGameState.currentQuestionIndex
    );
    const nextIndex = liveGameState.currentQuestionIndex + 1;
    if (nextIndex < quizData.questions.length) {
      advanceToQuestion(nextIndex);
    } else {
      console.log("(Hook) Host: Skip at end of quiz.");
      setLiveGameState((prev) => (prev ? { ...prev, status: "PODIUM" } : null));
      setCurrentBlock(null);
    }
  }, [liveGameState, quizData, advanceToQuestion]);

  // Derived values
  const currentQuestionAnswerCount = liveGameState
    ? Object.values(liveGameState.players).filter((p) =>
        p.answers.some(
          (a) => a.questionIndex === liveGameState.currentQuestionIndex
        )
      ).length
    : 0;

  // FIX 2: Remove isLoading from the return statement
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
  };
}
