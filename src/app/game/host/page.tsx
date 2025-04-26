// src/app/game/host/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import HostView from '@/src/components/game/views/HostView';
// Import PlayerAnswerPayload
import { GameBlock, QuestionResultPayload, QuizStructureHost, QuestionHost, PlayerAnswerPayload } from '@/src/lib/types';
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls';
import mockQuizStructureHost from '@/src/__mocks__/api/quiz_sample_all_types';

// Type for storing received answers (Player ID -> Answer Payload)
type ReceivedAnswersMap = Record<string, PlayerAnswerPayload>;

export default function HostPage() {
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answerCount, setAnswerCount] = useState(0); // Manual count
  const [totalPlayers, setTotalPlayers] = useState(50);
  const [gamePin] = useState('123456');
  const [accessUrl] = useState('bytebattle.quiz');
  // --- State for Received Answers ---
  const [receivedAnswers, setReceivedAnswers] = useState<ReceivedAnswersMap>({});
  const [timerKey, setTimerKey] = useState(0); // Keep timerKey state
  // --- END State ---

  // formatQuestionForPlayer and sendBlockToPlayers remain the same
  // ... (keep formatQuestionForPlayer and sendBlockToPlayers functions here) ...
  const formatQuestionForPlayer = (hostQuestion: QuestionHost | null): GameBlock | null => {
    if (!hostQuestion) return null;

    // Base structure common to most types sent to players
    const baseBlock: Pick<GameBlock, // Pick from the union type
      'type' | 'gameBlockIndex' | 'questionIndex' | 'totalGameBlockCount' |
      'title' | 'image' | 'video' | 'media' | 'timeAvailable' | 'timeRemaining' |
      'pointsMultiplier' | 'numberOfAnswersAllowed' |
      'getReadyTimeAvailable' | 'getReadyTimeRemaining' | 'gameBlockType'
    > = {
      type: hostQuestion.type,
      gameBlockIndex: currentQuestionIndex,
      questionIndex: currentQuestionIndex,
      totalGameBlockCount: quizData?.questions.length ?? 0,
      title: hostQuestion.title || hostQuestion.question || '', // Use title for content, question otherwise
      image: hostQuestion.image || undefined,
      video: hostQuestion.video as GameBlock['video'] || undefined, // Type assertion might be needed
      media: hostQuestion.media as GameBlock['media'] || undefined, // Type assertion might be needed
      timeAvailable: hostQuestion.time || 0,
      timeRemaining: hostQuestion.time || 0, // Initial remaining time is full time
      pointsMultiplier: hostQuestion.pointsMultiplier || 0, // Default to 0 if not present (like survey)
      numberOfAnswersAllowed: 1, // Default, adjust if multi-select is added
      // currentQuestionAnswerCount: answerCount, // Add current answer count
      getReadyTimeAvailable: 5000, // Example Get Ready time
      getReadyTimeRemaining: 5000,
      gameBlockType: hostQuestion.type, // Add gameBlockType explicitly
    };

    // Type-specific adjustments
    switch (hostQuestion.type) {
      case 'content':
        return {
          ...baseBlock,
          type: 'content',
          description: hostQuestion.description || '',
          pointsMultiplier: undefined, // Content has no points
          timeAvailable: 0, timeRemaining: 0, // Content usually not timed
          numberOfAnswersAllowed: undefined,
        } as GameBlock;
      case 'quiz':
      case 'jumble':
      case 'survey':
        // Player choices exclude the 'correct' field
        const playerChoices = hostQuestion.choices.map(({ correct, ...choiceData }) => choiceData);
        // For Jumble, the HOST should shuffle before sending, but the mock structure might already be shuffled
        // If not shuffled in mock, add shuffle logic here for Jumble
        const choicesToSend = (hostQuestion.type === 'jumble')
          ? [...playerChoices].sort(() => Math.random() - 0.5) // Example shuffle
          : playerChoices;

        return {
          ...baseBlock,
          type: hostQuestion.type, // quiz, jumble, survey
          choices: choicesToSend,
          numberOfChoices: choicesToSend.length,
          pointsMultiplier: hostQuestion.type === 'survey' ? undefined : baseBlock.pointsMultiplier, // No points for survey
        } as GameBlock;
      case 'open_ended':
        return {
          ...baseBlock,
          type: 'open_ended',
          choices: undefined, // No choices sent to player
          numberOfChoices: 0,
        } as GameBlock;
      default:
        console.warn("Unknown host question type:", hostQuestion.type);
        return null;
    }
  };

  // --- Function to Simulate Sending WebSocket Message ---
  const sendBlockToPlayers = (blockToSend: GameBlock | null) => {
    if (!blockToSend) return;

    // 1. Prepare the detailed payload (already done by formatQuestionForPlayer)
    const detailPayload = blockToSend;

    // 2. Stringify the detailed payload
    const contentString = JSON.stringify(detailPayload);

    // 3. Construct the WebSocket envelope
    const wsMessage = {
      // id: generateWsMessageId(), // Optional Bayeux ID
      channel: "/service/player",
      data: {
        gameid: gamePin,
        type: "message",
        id: 2, // Example ID for question start [cite: 1631, 1555] (Use appropriate ID based on event)
        content: contentString,
        host: "bytebattle.quiz", // Optional [cite: 1634]
      },
      // clientId: targetPlayerClientId, // Needed if sending to specific player
      // ext: { timetrack: Date.now() } // Optional extensions [cite: 1635]
    };

    console.log("DEV: Simulating WebSocket Send to Players:", JSON.stringify([wsMessage], null, 2));
    // --- In a REAL app, send via WebSocket connection ---
    // ws.send(JSON.stringify([wsMessage]));
  };


  // --- Simulate Fetching Initial Quiz Data ---
  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      console.log("Host: Fetching quiz structure...");
      try {
        // --- DEV MODE: Use Mock Data ---
        if (process.env.NODE_ENV === 'development') {
          console.log("Host (Dev Mode): Using mock quiz structure.");
          // Add delay to simulate network
          await new Promise(resolve => setTimeout(resolve, 700));
          setQuizData(mockQuizStructureHost as QuizStructureHost); // Use imported mock
          setCurrentQuestionIndex(0); // Start at the first question
        } else {
          // --- PRODUCTION: Actual REST API Call ---
          // const response = await fetch(`/api/quizzes/${quizId}`); // Replace quizId
          // if (!response.ok) throw new Error('Failed to fetch quiz');
          // const data = await response.json();
          // setQuizData(data as QuizStructureHost);
          // setCurrentQuestionIndex(0);
          console.error("Host (Prod Mode): Actual API fetch not implemented.");
          // Handle error state appropriately
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        // Handle error state (e.g., show error message)
        setQuizData(null);
      } finally {
        // Don't set loading false here, wait for the first block to be formatted
      }
    };
    fetchQuiz();
  }, []); // Run once on mount

  // useEffect for updating currentBlock - NOW clears received answers
  useEffect(() => {
    if (quizData && quizData.questions.length > currentQuestionIndex) {
      console.log(`Host: Preparing block ${currentQuestionIndex}...`);
      setIsLoading(true);
      setAnswerCount(0); // Reset answer count for the new question
      setReceivedAnswers({}); // --- CLEAR previous answers ---
      const hostQuestion = quizData.questions[currentQuestionIndex];
      const formattedBlock = formatQuestionForPlayer(hostQuestion);
      setCurrentBlock(formattedBlock);
      // Send block AFTER state is set
      sendBlockToPlayers(formattedBlock);
      setIsLoading(false);
    } else if (quizData && quizData.questions.length <= currentQuestionIndex) {
      console.log("Host: Reached end of quiz."); setCurrentBlock(null); setIsLoading(false);
    }
  }, [currentQuestionIndex, quizData]); // Rerun when index or data changes

  useEffect(() => {
    // Set timer key based *only* on the question index changing
    console.log(`Host: Setting timer key for question index ${currentQuestionIndex}`);
    setTimerKey(currentQuestionIndex);
  }, [currentQuestionIndex]); // <<< DEPENDS ONLY ON INDEX NOW


  // --- REMOVE Automatic Answer Count useEffect ---
  // No longer needed as count is updated manually in handlePlayerAnswer


  // --- *** CHANGE 1: Update Callback Signature *** ---
  const handlePlayerAnswerMessage = useCallback((message: MockWebSocketMessage) => {
    console.log(`Host received raw answer message:`, message);

    // --- *** CHANGE 2: Extract CID and Content String *** ---
    const playerId = message?.data?.cid; // Player Identifier from message
    const contentString = message?.data?.content;
    const messageTypeId = message?.data?.id;

    if (!playerId || !contentString || messageTypeId !== 6) { // Check for CID, content, and correct message ID (6)
      console.warn(`Host: Received invalid or non-answer message (ID: ${messageTypeId}, CID: ${playerId}). Ignoring.`);
      return;
    }
    // --- *** END CHANGE 2 *** ---

    // --- *** CHANGE 3: Use Extracted playerId for Duplicate Check *** ---
    if (receivedAnswers[playerId]) {
      console.log(`Host: Duplicate answer detected from ${playerId} for question ${currentQuestionIndex}. Ignoring.`);
      return;
    }
    // --- *** END CHANGE 3 *** ---

    try {
      // --- *** CHANGE 4: Parse Content String *** ---
      const payload = JSON.parse(contentString) as PlayerAnswerPayload;
      console.log(`Host parsed answer from ${playerId}:`, payload);
      // --- *** END CHANGE 4 *** ---

      // Increment answer count
      setAnswerCount(prev => {
        const newCount = prev + 1;
        console.log(`Host: Answer count incremented to ${newCount}`);
        return newCount;
      });

      // --- *** CHANGE 5: Store Parsed Payload using Extracted playerId *** ---
      setReceivedAnswers(prev => {
        const updatedAnswers = {
          ...prev,
          [playerId]: payload // Use playerId (CID) as key
        };
        console.log(`Host: Stored answer for ${playerId}.`);
        logAnswerStats(updatedAnswers);
        return updatedAnswers;
      });
      // --- *** END CHANGE 5 *** ---

    } catch (error) {
      console.error(`Host: Error parsing answer content from ${playerId}:`, error, contentString);
    }

  }, [receivedAnswers, currentQuestionIndex]); // Keep dependencies
  // --- *** END CHANGE 1 *** ---

  // --- NEW: Helper function for logging stats (Example) ---
  const logAnswerStats = (answers: ReceivedAnswersMap) => {
    if (!currentBlock || (currentBlock.type !== 'quiz' && currentBlock.type !== 'survey')) return;

    const choiceCounts: Record<number, number> = {};
    Object.values(answers).forEach(ans => {
      // Check if it's a quiz/survey answer and choice is a number
      if ((ans.type === 'quiz' || ans.type === 'survey') && typeof ans.choice === 'number') {
        choiceCounts[ans.choice] = (choiceCounts[ans.choice] || 0) + 1;
      }
    });
    console.log("Host Stats: Current Choice Counts:", choiceCounts);
    // In a real scenario, update state used for displaying charts/stats
  };
  // --- END NEW Helper ---


  // --- Dev Mock Controls Interaction ---
  const loadBlockFromDevControls = useCallback((block: GameBlock | null) => {
    // This function is primarily for the PLAYER view simulation via DevControls.
    // Host view is driven by the quizData and currentQuestionIndex.
    // However, we can allow DevControls to OVERRIDE the current block for testing display.
    console.log("DEV (Host): DevControls requested block override:", block?.type);
    setCurrentBlock(block);
    // Note: This might desync from the actual quiz flow controlled by index/quizData.
    // Decide if this override is desired or if DevControls should manipulate index instead.
  }, []);

  const setMockResultFromDevControls = useCallback((result: QuestionResultPayload | null) => {
    // Similar to loadBlockFromDevControls, this is more for player view.
    // Host typically calculates results, doesn't display received ones.
    console.log("DEV (Host): DevControls requested result display (usually for Player):", result?.type);
    setCurrentResult(result); // Store it if needed for any host-side display during dev
    setCurrentBlock(null); // Clear block when showing result (like player view)
  }, []);
  // --- End Dev Mock Controls Interaction ---

  // handleTimeUp, handleSkip, handleNext (remain the same)
  const handleNext = useCallback(() => {
    console.log('Host clicked next');
    // Dependencies: quizData, currentQuestionIndex
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      console.log("Host: Next at end of quiz or no quiz data.");
      // Handle end of quiz
    }
  }, [quizData, currentQuestionIndex]); // Add dependencies

  const handleTimeUp = useCallback(() => {
    console.log('Host detected time up!');
    // TODO: Implement result calculation and move to result display phase
    // Now handleNext reference is stable
    setTimeout(handleNext, 2000);
  }, [handleNext]); // Depend on the stable handleNext

  const handleSkip = useCallback(() => {
    console.log('Host skipped question');
    // Dependencies: quizData, currentQuestionIndex
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      console.log("Host: Skip at end of quiz or no quiz data.");
      // Handle end of quiz
    }
  }, [quizData, currentQuestionIndex]); // Add dependencies
  // --- *** End useCallback Wrappers *** ---


  return (
    <>
      <HostView
        // Pass timerKey down to HostView
        timerKey={timerKey} // Pass the timerKey based on index
        questionData={currentBlock}
        currentAnswerCount={answerCount} // Pass the manually updated count
        totalPlayers={totalPlayers}
        gamePin={gamePin}
        accessUrl={accessUrl}
        onTimeUp={handleTimeUp}
        onSkip={handleSkip}
        onNext={handleNext}
        isLoading={isLoading || !quizData}
      />

      <DevMockControls
        // --- Pass the new handler ---
        simulatePlayerAnswer={handlePlayerAnswerMessage}
        // --- Pass existing handlers ---
        loadMockBlock={loadBlockFromDevControls}
        setMockResult={setMockResultFromDevControls}
      // simulateReceiveMessage prop is not needed/provided by HostPage
      />
    </>
  );
}