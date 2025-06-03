// src/components/game/DevMockControls.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
// --- Mock detail imports ---
import mockContentDetail from '@/src/__mocks__/websockets/question_0_content';
import mockQuizTFDetail from '@/src/__mocks__/websockets/question_1_quiz_2choice';
import mockQuiz4ChoiceDetail from '@/src/__mocks__/websockets/question_2_quiz_4choice';
import mockQuizImageDetail from '@/src/__mocks__/websockets/question_3_quiz_image';
import mockJumbleDetail from '@/src/__mocks__/websockets/question_4_jumble';
import mockSurveyDetail from '@/src/__mocks__/websockets/question_5_survey';
import mockOpenEndedDetail from '@/src/__mocks__/websockets/question_6_open_ended';
import mockResultCorrectDetail from '@/src/__mocks__/websockets/result_1_quiz_correct';
import mockResultIncorrectDetail from '@/src/__mocks__/websockets/result_2_quiz_incorrect';
// --- ADD Mock Answer Detail Imports ---
import mockAnswerQuizCorrect from '@/src/__mocks__/websockets/answer_1_quiz';
import mockAnswerQuizIncorrect from '@/src/__mocks__/websockets/answer_2_quiz';
import mockAnswerQuizImage from '@/src/__mocks__/websockets/answer_3_quiz_image';
import mockAnswerJumble from '@/src/__mocks__/websockets/answer_4_jumble';
import mockAnswerSurvey from '@/src/__mocks__/websockets/answer_5_survey';
import mockAnswerOpenEnded from '@/src/__mocks__/websockets/answer_6_open_ended';
// --- END ---
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, ResultPayloadQuiz } from '@/src/lib/types';
import { Settings, EyeOff, Send } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// MockWebSocketMessage interface (keep or move to types.ts)
export interface MockWebSocketMessage { // Ensure this is exported
  id?: string;
  channel: string;
  clientId?: string;
  data: {
    gameid?: string;
    type: string;
    id?: number;
    content: string;
    host?: string;
    cid?: string;
    name?: string;
    status?: string;
  };
  ext?: {
    timetrack?: number;
  };
  successful?: boolean;
}

// --- UPDATED Props Interface ---
interface DevMockControlsProps {
  simulateReceiveMessage?: (message: MockWebSocketMessage) => void; // For Player view (optional)
  simulatePlayerAnswer?: (message: MockWebSocketMessage) => void; // For Host to receive player answer (optional)
  // NEW PROP: Simulate the host receiving a join message (optional)
  simulateHostReceiveJoin?: (message: MockWebSocketMessage) => void;
  // --- END NEW PROP ---
  loadMockBlock: (block: GameBlock | null) => void; // For Host override/start
  setMockResult: (result: QuestionResultPayload | null) => void; // For Host override (less common)
}
// --- END UPDATE ---

// createMockMessage helper (for simulating messages TO player)
const createMockMessage = (
  detailPayload: GameBlock | QuestionResultPayload | { type: string }, // Allow simple type object for signals
  dataTypeId: number
): MockWebSocketMessage => {
  const contentString = JSON.stringify(detailPayload);
  return {
    channel: "/service/player",
    data: {
      gameid: "DEV123",
      type: "message",
      id: dataTypeId,
      content: contentString,
      host: "dev.mock.it",
      cid: "DEV_PLAYER_CID",
    },
    ext: {
      timetrack: Date.now(),
    },
  };
};

const DevMockControls: React.FC<DevMockControlsProps> = ({
  simulateReceiveMessage,
  simulatePlayerAnswer, // Destructure the new optional prop
  simulateHostReceiveJoin, // Destructure the simulateHostReceiveJoin prop
  loadMockBlock,
  setMockResult,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [mockPlayerId, setMockPlayerId] = useState<string>('player_1');
  const [mockPlayerName, setMockPlayerName] = useState<string>('MockPlayer');
  // --- ADDED: Check if the necessary prop is available ---
  const canSimulateJoin = !!simulateHostReceiveJoin;
  // --- END ADDED ---

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // --- NEW Function: Simulate Player Join ---
  const sendPlayerJoin = () => {
    const uniquePlayerId = `${mockPlayerId}_${Math.random().toString(36).substring(7)}`;
    console.log(`DEV: Simulating join from ${uniquePlayerId} (${mockPlayerName})`);

    // Construct a plausible join message payload (adjust based on actual needs)
    // Assuming data.id 9 is for player updates/joins based on Kahoot structure
    const joinPayload = {
      type: "player_update", // Use player_update for join/update events
      player: {
        cid: uniquePlayerId,
        name: mockPlayerName,
        totalScore: 0,
        streak: 0,
        rank: 0, // Initial rank might be 0 or unset
      }
    };
    const contentString = JSON.stringify(joinPayload);

    const messageToSend: MockWebSocketMessage = {
      channel: `/controller/DEV123`, // Channel host listens on for player actions
      data: {
        name: mockPlayerName,
        type: "joined",
        content: "{}",
        cid: uniquePlayerId // The joining player's ID
      },
      ext: { timetrack: Date.now() }
    };

    if (simulateHostReceiveJoin) {
      console.log("DEV: Sending simulated join message to Host:", messageToSend);
      simulateHostReceiveJoin(messageToSend);
    } else {
      // This warning will still appear if the button wasn't disabled (e.g., due to logic error),
      // but the primary feedback is now the disabled button itself.
      console.warn("DEV: simulateHostReceiveJoin prop not provided.");
    }
  };
  // --- END NEW Function ---

  // --- *** CHANGE 2: Modify sendAnswer function *** ---
  const sendAnswer = (answerDetailPayload: PlayerAnswerPayload) => {
    const uniquePlayerId = `${mockPlayerId}_${Math.random().toString(36).substring(7)}`;
    console.log(`DEV: Simulating answer from ${uniquePlayerId}:`, answerDetailPayload);

    // 1. Stringify the answer detail payload
    const contentString = JSON.stringify(answerDetailPayload);

    // 2. Construct the full WebSocket message envelope for an answer
    const messageToSend: MockWebSocketMessage = {
      channel: `/controller/DEV123`, // Example channel Player -> Host
      data: {
        gameid: "DEV123", // Use a consistent mock gameId
        id: 6, // Use ID 6 for answer submission (based on docs/phase3_ws_answer_message.txt 
        type: "message",
        content: contentString, // Stringified detail payload
        cid: uniquePlayerId // Player's unique identifier
      },
      ext: { timetrack: Date.now() }
    };

    // 3. Call the simulatePlayerAnswer prop with the FULL message object
    if (simulatePlayerAnswer) {
      console.log("DEV: Sending simulated answer message to Host:", messageToSend);
      simulatePlayerAnswer(messageToSend);
    } else {
      console.warn("DEV: simulatePlayerAnswer prop not provided.");
    }
  };
  // --- *** END CHANGE 2 *** ---
  // --- END NEW Function ---

  // Existing helper functions (load, showResult, etc.) - include checks for simulateReceiveMessage
  const load = (blockDetail: any, dataTypeId: number = 2) => {
    const message = createMockMessage(blockDetail as GameBlock, dataTypeId);
    if (simulateReceiveMessage) simulateReceiveMessage(message);
    else console.warn("DEV: simulateReceiveMessage prop not provided for load.");
  };
  const showResult = (resultType: 'correct' | 'incorrect' | 'timeup' | 'survey') => {
    let resultDetailPayload: QuestionResultPayload | null = null;
    // ... (switch statement remains the same as previous correction)
    switch (resultType) {
      case 'correct':
        resultDetailPayload = mockResultCorrectDetail as QuestionResultPayload;
        break;
      case 'incorrect':
        resultDetailPayload = mockResultIncorrectDetail as QuestionResultPayload;
        break;
      case 'timeup':
        resultDetailPayload = {
          ...(mockResultIncorrectDetail as QuestionResultPayload),
          hasAnswer: false, text: "Time's Up!", choice: -1, points: 0, isCorrect: false,
          pointsData: {
            ...mockResultIncorrectDetail.pointsData, questionPoints: 0,
            answerStreakPoints: { streakLevel: 0, previousStreakLevel: mockResultIncorrectDetail.pointsData.answerStreakPoints.previousStreakLevel },
          }
        } as ResultPayloadQuiz;
        break;
      case 'survey':
        const surveyResultMock = {
          ...(mockResultIncorrectDetail as QuestionResultPayload), type: 'survey', choice: 1, text: "Bootstrap",
          points: undefined, isCorrect: undefined, correctChoices: undefined,
          pointsData: { ...mockResultIncorrectDetail.pointsData, questionPoints: 0 }
        };
        resultDetailPayload = surveyResultMock as QuestionResultPayload;
        break;
    }

    if (resultDetailPayload) {
      const message = createMockMessage(resultDetailPayload, 8); // Use data.id 8 for results
      console.log("DEV: Simulating receive Result Message (type 8):", message);
      // --- ADD CHECK ---
      if (simulateReceiveMessage) {
        simulateReceiveMessage(message);
      } else {
        console.warn("DEV: simulateReceiveMessage prop not provided.");
      }
      // --- END CHECK ---
    }
  };
  // Simulate Host loading
  const simulateHostLoad = () => {
    console.log("DEV: Simulating Host loading initial quiz data...");
    // Use the override prop for Host view as before
    loadMockBlock(mockContentDetail as GameBlock);
  };

  // Simulate Player waiting state
  const showWaitingState = () => {
    console.log("DEV: Simulating Player waiting state...");
    const message = createMockMessage({ type: 'waiting_signal' }, 99); // Custom ID 99
    // --- ADD CHECK ---
    if (simulateReceiveMessage) {
      simulateReceiveMessage(message);
    } else {
      console.warn("DEV: simulateReceiveMessage prop not provided.");
    }
    // --- END CHECK ---
  }

  // Simulate Player submitting state (visual only)
  const showSubmittingState = () => {
    console.log("DEV: Simulating Player submitting state (visual)...");
    const message = createMockMessage({ type: 'submitting_signal' }, 98); // Custom ID 98
    // --- ADD CHECK ---
    if (simulateReceiveMessage) {
      simulateReceiveMessage(message);
    } else {
      console.warn("DEV: simulateReceiveMessage prop not provided.");
    }
    // --- END CHECK ---
  }

  // Function to clear player view
  const clearPlayerView = () => {
    console.log("DEV: Clearing Player view...");
    const message = createMockMessage({ type: 'clear' }, 0); // Custom ID 0
    // --- ADD CHECK ---
    if (simulateReceiveMessage) {
      simulateReceiveMessage(message);
    } else {
      console.warn("DEV: simulateReceiveMessage prop not provided.");
    }
    // --- END CHECK ---
  };


  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Toggle Button */}
      {!isOpen && ( // Show Settings button only when panel is closed
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={cn(
            "shadow-lg absolute -top-12 right-0" // Adjust positioning as needed
          )}
          aria-label="Show Dev Controls"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}

      {/* Panel Content */}
      {isOpen && (
        <Card className={cn("w-64 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300")}>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium">Dev Controls</CardTitle>
            {/* --- Hide Button --- */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute top-1 right-1 h-6 w-6" // Position inside header
              aria-label="Hide Dev Controls"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
            {/* --- End Hide Button --- */}
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2 max-h-[70vh] overflow-y-auto">
            {/* Host Simulation Button */}
            <Button size="sm" variant="outline" onClick={simulateHostLoad} className="bg-blue-100 dark:bg-blue-900">
              Simulate Host Load
            </Button>
            <hr className="my-1" />

            <h4 className="text-xs font-semibold mt-1 mb-1">Load Player Block (Msg):</h4>
            <Button size="sm" variant="outline" onClick={() => load(mockContentDetail, 2)}>Load Content</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockQuizTFDetail, 2)}>Load Quiz T/F</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockQuiz4ChoiceDetail, 2)}>Load Quiz 4Choice</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockQuizImageDetail, 2)}>Load Quiz Image</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockJumbleDetail, 2)}>Load Jumble</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockSurveyDetail, 2)}>Load Survey</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockOpenEndedDetail, 2)}>Load Open Ended</Button>

            {/* --- NEW: Simulate Player Join Section --- */}
            <h4 className="text-xs font-semibold mt-1 mb-1">Simulate Player Join (Msg):</h4>
            <div className="flex items-center gap-2">
              <label htmlFor="mockPlayerName" className="text-xs flex-shrink-0">Name:</label>
              <input
                id="mockPlayerName" type="text" value={mockPlayerName} onChange={(e) => setMockPlayerName(e.target.value)}
                className="flex-grow h-8 px-2 py-1 text-xs border rounded bg-input text-foreground"
              />
            </div>
            {/* --- MODIFIED: Disable button and add title if prop is missing --- */}
            <Button
              size="sm"
              variant="outline"
              onClick={sendPlayerJoin}
              className="gap-1 bg-green-100 dark:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSimulateJoin}
              title={!canSimulateJoin ? "Host component did not provide simulateHostReceiveJoin prop" : "Simulate a player joining"}
            >
              <Send className="h-3 w-3" /> Player Join
            </Button>
            {/* --- END MODIFIED --- */}
            <hr className="my-2" />
            {/* --- END NEW Section --- */}

            <h4 className="text-xs font-semibold mt-2 mb-1">Show Player Result (Msg):</h4>
            <Button size="sm" variant="outline" onClick={() => showResult('correct')}>Show Correct</Button>
            <Button size="sm" variant="outline" onClick={() => showResult('incorrect')}>Show Incorrect</Button>
            <Button size="sm" variant="outline" onClick={() => showResult('timeup')}>Show Time Up</Button>
            <Button size="sm" variant="outline" onClick={() => showResult('survey')}>Show Survey Result</Button>

            <h4 className="text-xs font-semibold mt-2 mb-1">Show Player State:</h4>
            <Button size="sm" variant="outline" onClick={showWaitingState}>Show Waiting</Button>
            <Button size="sm" variant="outline" onClick={showSubmittingState}>Show Submitting</Button>
            <Button size="sm" variant="destructive" className="mt-1" onClick={clearPlayerView}>Clear Player View</Button>
            <hr className="my-2" />

            {/* --- Simulate Player Answers Section --- */}
            {/* This section already simulates sending an answer *from* the player */}
            {/* The host component needs to use the simulatePlayerAnswer prop to handle receiving it */}
            <h4 className="text-xs font-semibold mt-1 mb-1">Simulate Player Answer (Msg):</h4>
            <div className="flex items-center gap-2">
              <label htmlFor="mockPlayerIdInput" className="text-xs flex-shrink-0">Player ID:</label>
              <input
                id="mockPlayerIdInput" // Changed ID to avoid conflict
                type="text"
                value={mockPlayerId}
                onChange={(e) => setMockPlayerId(e.target.value)}
                className="flex-grow h-8 px-2 py-1 text-xs border rounded bg-input text-foreground"
              />
            </div>
            {/* Use the sendAnswer helper */}
            <Button size="sm" variant="outline" onClick={() => sendAnswer(mockAnswerQuizCorrect as PlayerAnswerPayload)} className="gap-1"> <Send className="h-3 w-3" />Quiz (Correct)</Button>
            <Button size="sm" variant="outline" onClick={() => sendAnswer(mockAnswerQuizIncorrect as PlayerAnswerPayload)} className="gap-1"> <Send className="h-3 w-3" />Quiz (Incorrect)</Button>
            <Button size="sm" variant="outline" onClick={() => sendAnswer(mockAnswerQuizImage as PlayerAnswerPayload)} className="gap-1"> <Send className="h-3 w-3" />Quiz (Image)</Button>
            <Button size="sm" variant="outline" onClick={() => sendAnswer(mockAnswerJumble as PlayerAnswerPayload)} className="gap-1"> <Send className="h-3 w-3" />Jumble</Button>
            <Button size="sm" variant="outline" onClick={() => sendAnswer(mockAnswerSurvey as PlayerAnswerPayload)} className="gap-1"> <Send className="h-3 w-3" />Survey</Button>
            <Button size="sm" variant="outline" onClick={() => sendAnswer(mockAnswerOpenEnded as PlayerAnswerPayload)} className="gap-1"> <Send className="h-3 w-3" />Open Ended</Button>
            {/* --- END Simulate Player Answers --- */}

          </CardContent>
          {/* --- End Scrollable Content --- */}
        </Card>
      )}
    </div>
  );
};

export default DevMockControls;