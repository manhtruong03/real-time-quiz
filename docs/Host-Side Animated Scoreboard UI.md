# Development Document: Host-Side Animated Scoreboard UI

**Version:** 1.1
**Date:** May 9, 2025

## 1. Introduction & Goal

This document outlines the technical specifications and implementation plan for developing an engaging, animated host-side scoreboard UI for the real-time quiz application. The scoreboard will display player rankings, scores, and dynamically indicate changes after each question.

The primary goal is to create a visually appealing and informative scoreboard that leverages the existing project architecture, state management, and UI components, providing a clear transition between question stats and overall player standing.

## 2. Context & Requirements

### 2.1. Technology Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **UI Library:** React
- **UI Components:** shadcn/ui (on Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`), Custom Hooks (`useHostGameCoordinator`, `useGameStateManagement`, etc.)
- **Animation (Recommended):** `framer-motion`
- **Context:** `GameAssetsContext` (for avatars)

### 2.2. Integration Point & Game Flow Adjustment

The scoreboard UI will be displayed in a new dedicated game state, `SHOWING_SCOREBOARD`. This state will occur _after_ `SHOWING_STATS` and _before_ advancing to the next question or the `PODIUM`.

The adjusted game flow will be:

1.  **`LOBBY`**: Players join.
2.  **`QUESTION_GET_READY`**: Brief "get ready" screen.
3.  **`QUESTION_SHOW`**:
    - Question is displayed, timer runs.
    - Players submit answers to the Host.
    - The Host (via `useAnswerProcessing`) calculates scores for individual answers and updates each player's `totalScore` and `rank` in `LiveGameState` in real-time or as answers come in.
    - `useGameStateManagement` captures the state of player scores and ranks into `previousPlayerStateForScoreboard` _before_ transitioning away from `QUESTION_SHOW` (typically within the `handleTimeUp` or equivalent logic that finalizes the question).
4.  **`SHOWING_STATS`**:
    - Host displays answer statistics for the question (e.g., using `HostAnswerStatsView`).
    - When this phase ends (e.g., host clicks "Next"), the game transitions to `SHOWING_SCOREBOARD`.
5.  **`SHOWING_SCOREBOARD` (New State)**:
    - The animated scoreboard UI is displayed.
    - When this phase ends (e.g., host clicks "Next"), the game transitions to the next question's `QUESTION_GET_READY` state or to `PODIUM` if it's the last question.
6.  **`PODIUM`**: Final results and winners are displayed.
7.  **`ENDED`**: Game session concludes.

This requires:

- Adding a new `SHOWING_SCOREBOARD` state to the `LiveGameState['status']` union type.
- Updating `useGameStateManagement` to include transition logic to and from `SHOWING_SCOREBOARD`.
- Updating `useHostGameCoordinator`'s `handleNext` function to manage this new state transition.

### 2.3. Data Source

- `liveGameState.players`: (`Record<string, LivePlayerState>`) Provides the most current data for all players including `cid`, `nickname`, `avatarId`, `totalScore`, `rank`, `currentStreak`.
- `liveGameState.previousPlayerStateForScoreboard`: (`Record<string, PlayerScoreRankSnapshot> | null`) Snapshot of scores and ranks _before_ the last question's results were finalized and ranks recalculated. This is crucial for animating changes.
- `GameAssetsContext`: For mapping `avatarId` to avatar image URLs.

### 2.4. Key Information & Features

The scoreboard must display the following for each ranked player:

- **Rank:** Current position.
- **Avatar:** Player's chosen avatar.
- **Nickname:** Player's nickname.
- **Streak Indicator:** 🔥 icon next to the nickname if `player.currentStreak >= 2` (configurable).
- **Score:** Current total score, animated from the previous score.
- **Score Change:** Points gained in the last question (calculated as `player.totalScore - (previousState?.score ?? player.totalScore)` – if `previousState` is null, means it's the first question or player just joined, so score change is just the current score).
- **Rank Change:** Visual indicator (▲/▼ icons) and numerical change.
- **Highlight Banner:** A separate section highlighting achievements (e.g., highest answer streak).
- **Scrollable List:** The list accommodates all players and is scrollable.
- **Conditional Styling:** Row backgrounds change based on rank movement.

### 2.5. Animation & Effects Requirements

- **Score Animation:** Animate the score from `previousState.score` to `player.totalScore`.
- **Rank Change Indicator:** `ArrowUp` / `ArrowDown` icons based on `previousState.rank` vs `player.rank`.
- **Row Background:**
  - Green tint: Rank improved.
  - Red tint: Rank decreased.
  - Neutral: Rank unchanged.
  - Distinct style for Rank 1.
- **Row Reordering Animation:** Smoothly animate rows changing positions.
- **Scrollability:** Implemented using `ScrollArea`.

## 3. Component Design & Breakdown

Components will reside in `src/components/game/host/scoreboard/`.

### 3.1. `ScoreboardView.tsx` (Container)

- **Purpose:** Main view for the `SHOWING_SCOREBOARD` game state.
- **Props:**
  - `players: Record<string, LivePlayerState>`
  - `previousPlayerStates: Record<string, PlayerScoreRankSnapshot> | null`
  - `quizTitle: string` (for the header, if needed, or general game context)
- **Responsibilities:**
  - Converts `players` into a sorted array by `rank`.
  - Identifies player for `HighlightBanner`.
  - Renders `ScoreboardHeader` (simple title "Scoreboard"), `ScoreboardList`, `HighlightBanner`.
  - Overall layout, potentially a full-screen view with custom background.

### 3.2. `ScoreboardList.tsx`

- **Purpose:** Renders the scrollable, animated list of player rows.
- **Props:**
  - `rankedPlayers: LivePlayerState[]`
  - `previousPlayerStates: Record<string, PlayerScoreRankSnapshot> | null`
- **UI:**
  - Outer container: `ScrollArea` from `@/src/components/ui/scroll-area`.
  - Inner list container: `motion.ul` from `framer-motion` with `layout` prop for row reordering animations.
- **Responsibilities:** Maps `rankedPlayers` to `ScoreboardItem` components.

### 3.3. `ScoreboardItem.tsx`

- **Purpose:** Displays a single player's row with all required information and animations.
- **Props:**
  - `player: LivePlayerState`
  - `previousState: PlayerScoreRankSnapshot | null | undefined`
- **UI:**
  - Root: `motion.li` with `layout="position"` and `key={player.cid}`.
  - Layout: Flexbox or CSS Grid to arrange elements within the row.
  - **Elements:**
    - Rank number.
    - `Avatar` component (fetches URL via `useGameAssets()` and `player.avatarId`).
    - Nickname text.
    - `Flame` icon (Lucide) if `player.currentStreak >= 3`.
    - `AnimatedScore` component for the total score.
    - Score points gained: `(player.totalScore - (previousState?.score ?? player.totalScore))`. Display with a "+" prefix if positive.
    - Rank change icon and number: Based on `player.rank` vs `previousState?.rank`.
- **Styling:**
  - Dynamic background color based on rank change.
  - Special styling for the Rank 1 player.

### 3.4. `HighlightBanner.tsx`

- **Purpose:** Displays a special highlight (e.g., player with the highest current streak).
- **Props:**
  - `highlightedPlayer: LivePlayerState | null`
  - `statName: string` (e.g., "Highest Streak")
  - `statValue: string | number`
- **UI:** Similar to the Kahoot example. Avatar, name, and stat description.

### 3.5. `AnimatedScore.tsx` (or custom hook `useAnimatedScore`)

- **Purpose:** Animates a numerical value from a start to an end point.
- **Props:** `fromValue: number`, `toValue: number`, `duration?: number`.
- **Implementation:** Uses `framer-motion`'s `animate` function or a spring for a smooth count-up effect.

## 4. Data Flow & State Management Modifications

1.  **Add `SHOWING_SCOREBOARD` State:**
    - Modify `LiveGameState['status']` in `src/lib/types/game-state.ts` to include `'SHOWING_SCOREBOARD'`.
    - In `useGameStateManagement` (`src/hooks/game/useGameStateManagement.ts`):
      - Add a new state transition function: `transitionToShowingScoreboard()`.
      - This function will set `liveGameState.status` to `SHOWING_SCOREBOARD`.
      - It should be called from `useHostGameCoordinator` after `SHOWING_STATS` ends.
      - Crucially, `previousPlayerStateForScoreboard` should have already been captured when transitioning _from_ `QUESTION_SHOW` (or upon final answer processing). This snapshot is used by _both_ `SHOWING_STATS` (for answer distribution relative to initial state of question) and `SHOWING_SCOREBOARD` (for score/rank change animations).
2.  **Update `useHostGameCoordinator` (`src/hooks/useHostGameCoordinator.ts`):**
    - Modify the `handleNext` function:
      - When `currentState.status === 'SHOWING_STATS'`:
        - Instead of directly going to the next question or podium, call `transitionToShowingScoreboard()`.
      - Add a new `else if (currentState.status === 'SHOWING_SCOREBOARD')`:
        - If `nextIndex < totalQuestions`, call `advanceToQuestion(nextIndex)`.
        - Else, call `showPodium()`.
3.  **Data for Scoreboard:**
    - When `HostView` renders due to `liveGameState.status === 'SHOWING_SCOREBOARD'`, it will pass `liveGameState.players` and `liveGameState.previousPlayerStateForScoreboard` to `ScoreboardView`.

## 5. UI Implementation Details

- **Layout:**
  - `ScoreboardList`: Will use `ScrollArea`. The inner `motion.ul` will be a flex column.
  - `ScoreboardItem`: Each item will be a flex row with distinct sections for Rank, Player Info (Avatar, Nickname, Streak), and Score Info (Animated Total Score, Points Gained, Rank Change Icon).
- **Styling (Tailwind CSS):**
  - **Overall Theme:** Dark purple background for `ScoreboardView`, white/light text.
  - **Rows:**
    - Default: `bg-purple-700/80 hover:bg-purple-600/80`
    - Rank 1: `bg-yellow-500/30 border-2 border-yellow-400 text-yellow-100`
    - Rank Improved: `bg-blue-700/50` (subtle blue tint)
    - Rank Decreased: `bg-red-700/50` (subtle red tint)
  - **Text:**
    - Nickname: `font-semibold text-lg`
    - Score: `font-bold text-xl text-white`
    - Points Gained: `text-sm text-green-300` (e.g., `+500`)
    - Rank Change Icons: `ArrowUp` (`text-green-400`), `ArrowDown` (`text-red-400`).
  - **Streak Icon (`Flame`):** `text-orange-400`.
- **Avatars:** `ScoreboardItem` will use `useGameAssets()` to fetch avatar URLs and display them using `shadcn/ui` `Avatar` component.
- **Scrolling:** `ScrollArea` component will manage scrollbar visibility.

## 6. Animation & Effects Implementation

- **Row Reordering (`framer-motion`):**
  - In `ScoreboardList.tsx`, wrap the mapping of `rankedPlayers` with `<motion.ul layout>`.
  - Each `ScoreboardItem` will be a `<motion.li layout="position" key={player.cid} ...>`. This will handle the reordering animation automatically when the `rankedPlayers` array (sorted by new rank) is re-rendered.
- **Score Animation (`AnimatedScore`):**

  - Props: `targetScore: number`, `previousScore: number`, `pointsGained: number`.
  - The component can first display `previousScore`, then animate adding `pointsGained` to reach `targetScore`. Or, animate directly from `previousScore` to `targetScore`. The latter is simpler with `framer-motion`'s `animate`.
  - Example `AnimatedScore` using `framer-motion`'s `animate` utility:

    ```typescript
    // src/components/game/host/scoreboard/AnimatedScore.tsx
    import React, { useEffect, useRef } from "react";
    import { animate } from "framer-motion";
    import { cn } from "@/src/lib/utils";

    interface AnimatedScoreProps {
      fromValue: number;
      toValue: number;
      duration?: number;
      className?: string;
      prefix?: string; // e.g., "+" for points gained
    }

    export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
      fromValue,
      toValue,
      duration = 0.8,
      className,
      prefix = "",
    }) => {
      const nodeRef = useRef<HTMLSpanElement>(null);
      const isInViewRef = useRef(false); // To trigger animation once when it becomes visible

      useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        // Basic in-view check (can be replaced with IntersectionObserver for more robustness)
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !isInViewRef.current) {
              isInViewRef.current = true;
              const controls = animate(fromValue, toValue, {
                duration,
                ease: "easeOut",
                onUpdate(value) {
                  node.textContent =
                    prefix + Math.round(value).toLocaleString();
                },
              });
              observer.unobserve(node); // Stop observing after animation starts
              return () => controls.stop();
            }
          },
          { threshold: 0.1 } // Trigger when 10% is visible
        );

        observer.observe(node);

        return () => {
          observer.unobserve(node);
          isInViewRef.current = false; // Reset if component re-mounts
        };
      }, [fromValue, toValue, duration, prefix]);

      return (
        <span ref={nodeRef} className={className}>
          {prefix}
          {fromValue.toLocaleString()}
        </span>
      );
    };
    ```

  - In `ScoreboardItem.tsx`:
    - For total score: `<AnimatedScore fromValue={previousState?.score ?? 0} toValue={player.totalScore} className="font-bold text-xl" />`
    - For points gained:
      ```tsx
      const pointsGained =
        player.totalScore - (previousState?.score ?? player.totalScore);
      {
        pointsGained > 0 && (
          <AnimatedScore
            fromValue={0}
            toValue={pointsGained}
            prefix="+"
            className="text-sm text-green-300 ml-2"
            duration={0.5} // Faster animation for points gained
          />
        );
      }
      ```

- **Conditional Styling:** Implemented directly in `ScoreboardItem.tsx` using `cn` and Tailwind classes based on rank change.

## 7. Integration Steps

1.  **Update `LiveGameState` type:** Add `'SHOWING_SCOREBOARD'` to the `status` union in `src/lib/types/game-state.ts`.
2.  **Modify `useGameStateManagement`:**
    - Add `transitionToShowingScoreboard` function.
    - Update `handleTimeUp` (or equivalent) to ensure `previousPlayerStateForScoreboard` is correctly captured before any transition to results/stats.
3.  **Modify `useHostGameCoordinator`:**
    - Update `handleNext` to include the new flow: `SHOWING_STATS` -> `SHOWING_SCOREBOARD` -> (next question or `PODIUM`).
4.  **Create Scoreboard Components:** Implement `ScoreboardView.tsx`, `ScoreboardList.tsx`, `ScoreboardItem.tsx`, `HighlightBanner.tsx`, and `AnimatedScore.tsx` in `src/components/game/host/scoreboard/`.
5.  **Modify `HostView.tsx` (`src/components/game/views/HostView.tsx`):**
    - Add a new case for `status === 'SHOWING_SCOREBOARD'` in its rendering logic (e.g., `mainContent` memo).
    - Inside this case, render `<ScoreboardView players={liveGameState.players} previousPlayerStates={liveGameState.previousPlayerStateForScoreboard} />`.
    - Ensure `FooterBar` in `HostView` has its `onNext` prop correctly wired to the `handleNext` from `useHostGameCoordinator` to trigger transitions from `SHOWING_SCOREBOARD`.

## 8. Accessibility & Responsiveness

- **Accessibility (A11y):**
  - Use semantic HTML (`ul`, `li`).
  - ARIA roles if necessary, though `framer-motion` often handles this well for list items.
  - Ensure keyboard navigability if any interactive elements are added later.
  - Provide `alt` text for avatars.
  - Sufficient color contrasts.
- **Responsiveness:**
  - Font sizes, paddings, and icon sizes should adapt using Tailwind's responsive prefixes.
  - The `ScrollArea` will handle content overflow on smaller screens.
  - Test on various device sizes.
