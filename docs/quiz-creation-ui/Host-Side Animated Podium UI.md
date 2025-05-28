# Development Document: Host-Side Animated Podium UI

**Version:** 1.0
**Date:** May 9, 2025

## 1. Introduction & Goal

This document outlines the technical specifications and implementation plan for developing an engaging, animated host-side Podium UI for the real-time quiz application. The Podium will be displayed at the end of the quiz to celebrate the top players (typically Top 3 or Top 5).

The primary goal is to create a visually distinct and celebratory screen that effectively showcases the winners, their final scores, and avatars, leveraging existing project architecture and components.

## 2. Context & Requirements

### 2.1. Technology Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **UI Library:** React
- **UI Components:** shadcn/ui (on Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Hooks, `useHostGameCoordinator`, `useGameStateManagement`.
- **Animation (Recommended):** `framer-motion`
- **Context:** `GameAssetsContext` (for avatars).

### 2.2. Integration Point & Game Flow

The Podium UI will be displayed in the `PODIUM` game state. This state occurs _after_ the final question's scoreboard (or directly after the final question's stats if no scoreboard is shown for the last question) and _before_ the `ENDED` state.

The game flow leading to and from the Podium:

1.  ... (Previous game states) ...
2.  **`SHOWING_SCOREBOARD`** (for the last question) / or **`SHOWING_STATS`** (for the last question):
    - When this phase ends, the game transitions to `PODIUM`.
3.  **`PODIUM` (New Focus)**:
    - The animated Podium UI is displayed, showcasing top players.
    - This screen might have a timeout or require a host action (e.g., "Next" or "End Game" button) to transition.
    - `liveGameState.players` will contain the final scores and ranks.
    - `liveGameState.previousPlayerStateForScoreboard` (as set by `showPodium` in `useGameStateManagement`) might hold the final state, useful if any last-minute animations are desired on the podium itself, though typically the podium displays the final static state.
4.  **`ENDED`**: Game session concludes, perhaps showing a final summary or options to play again/view report.

This requires:

- `PODIUM` state already exists in `LiveGameState['status']`.
- `useGameStateManagement` has `showPodium()` to transition to this state.
- `useHostGameCoordinator`'s `handleNext` function manages transitions into and out of `PODIUM`.

### 2.3. Data Source

- **`liveGameState.players`**: (`Record<string, LivePlayerState>`) Provides the final data for all players including `cid`, `nickname`, `avatarId`, `totalScore`, and final `rank`.
- **`quizData.title`**: (`QuizStructureHost`) For displaying the quiz title.
- **`GameAssetsContext`**: For mapping `avatarId` to avatar image URLs.

### 2.4. Key Information & Features (Podium)

The Podium typically highlights the Top 3 players (or Top 5, configurable).

- **Overall Appearance:** Celebratory, distinct from in-game question/scoreboard screens. Could use special background, confetti effects.
- **Podium Platforms:** Visual representation of 1st, 2nd, and 3rd place platforms, with 1st place usually being the tallest/most prominent.
- **For each Top Player (on their platform):**
  - **Rank Display:** (e.g., "1st", "2nd", "3rd" or medal icons 🥇🥈🥉).
  - **Avatar:** Prominently displayed.
  - **Nickname:** Clearly visible.
  - **Final Score:** Displayed.
- **Quiz Title:** Displayed somewhere on the screen.
- **"Runners-Up" (Optional):** A list of players ranked 4th and 5th (or more) might be displayed less prominently below the main podium.
- **Animations:**
  - Players "arriving" onto their podium spots.
  - Score counters (if desired, though final scores are usually static here).
  - Confetti or celebratory particle effects.

## 3. Component Design & Breakdown (Podium)

Components will likely reside in `src/components/game/host/podium/`.

### 3.1. `PodiumView.tsx` (Container)

- **Purpose:** Main view for the `PODIUM` game state.
- **Props:**
  - `players: Record<string, LivePlayerState>`
  - `quizTitle: string`
  - `topN?: number` (default to 3, for how many players to feature on the main podium)
- **Responsibilities:**
  - Filters and sorts players to get the top N (e.g., players with rank 1, 2, 3).
  - Handles the overall layout: Quiz Title, Podium Platforms, optional Runners-Up list.
  - Renders `PodiumPlatform.tsx` for each of the top N players.
  - Potentially initiates overall animations like confetti.
  - Provides a "Next" or "End Game" button in the `FooterBar` (controlled by `HostView`).

### 3.2. `PodiumPlatform.tsx`

- **Purpose:** Displays a single player on their designated podium spot (1st, 2nd, 3rd).
- **Props:**
  - `player: LivePlayerState`
  - `position: 1 | 2 | 3` (or rank directly)
  - `medalIcon?: React.ElementType` (e.g., Lucide icon for 🥇)
- **UI:**
  - A styled `div` representing the platform, height/color varies by position (1st is highest/gold, 2nd silver, 3rd bronze).
  - Large `Avatar` component.
  - Nickname text.
  - Final score text.
  - Medal icon or rank number.
- **Animation:**
  - The platform and player elements can animate in (e.g., slide up, fade in).
  - `framer-motion` will be used for these item-specific entrance animations.

### 3.3. `PodiumRunnerUpItem.tsx` (Optional)

- **Purpose:** Displays players who didn't make the main podium (e.g., 4th, 5th place).
- **Props:**
  - `player: LivePlayerState`
- **UI:**
  - A simpler list item: Rank, Avatar, Nickname, Score.
  - Less prominent styling than `PodiumPlatform`.

### 3.4. `ConfettiEffect.tsx` (Optional Utility Component)

- **Purpose:** A reusable component to trigger a confetti animation.
- **Implementation:** Could use a library like `react-confetti` or a custom `framer-motion` particle animation.
- **Trigger:** Typically triggered when the `PodiumView` mounts.

## 4. Data Flow & State Management

- When `useHostGameCoordinator` transitions to the `PODIUM` state (via `showPodium()` from `useGameStateManagement`), `HostView.tsx` will detect this.
- `HostView.tsx` will render `PodiumView.tsx`, passing down:
  - `liveGameState.players` (containing final scores and ranks).
  - `quizData.title`.
- `PodiumView` will then process `liveGameState.players` to extract the top 3 (or N) players.

## 5. UI Implementation Details (Podium)

- **Layout (`PodiumView.tsx`):**
  - Full-screen, celebratory background (possibly from `GameAssetsContext` or a new default).
  - Centered area for the podium platforms. A common layout is 2nd place on the left, 1st in the center and slightly higher, 3rd on the right.
  - Quiz title can be at the top.
  - Runners-up list (if implemented) below the main podium.
- **Styling (Tailwind CSS):**
  - **Overall Theme:** Bright, celebratory. Contrasting with the scoreboard. Gold, silver, bronze accents.
  - **Platforms (`PodiumPlatform.tsx`):**
    - **1st Place:** Tallest, `bg-yellow-500/80 border-yellow-400`, gold text accents.
    - **2nd Place:** Medium height, `bg-slate-400/80 border-slate-300`, silver text accents.
    - **3rd Place:** Shorter height, `bg-orange-600/80 border-orange-500` (bronze-like), bronze text accents.
    - Use flexbox to arrange elements within each platform (Avatar above Name, Name above Score).
  - **Text:** Large, clear fonts for names and scores on platforms.
  - **Avatars:** Larger than in the scoreboard.
- **Icons:**
  - `Trophy`, `Award`, `Medal` icons from Lucide React for ranks.
  - `PartyPopper` for general celebration.

## 6. Animation & Effects Implementation (Podium)

- **Platform/Player Entrance (`framer-motion`):**
  - In `PodiumView.tsx`, when rendering the `PodiumPlatform` components, use `motion.div` for each platform.
  - Apply `initial`, `animate`, and `transition` props for staggered entrance animations (e.g., 3rd place appears, then 2nd, then 1st).
  - Example for a platform:
    ```tsx
    // Inside PodiumView, mapping top players
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: player.rank * 0.2 }} // Stagger based on rank
    >
      <PodiumPlatform player={player} position={player.rank as 1 | 2 | 3} />
    </motion.div>
    ```
- **Score Display:** Scores on the podium are usually static final scores. If an animation is desired, the `AnimatedScore` component can be reused, animating from `previousPlayerStateForScoreboard.score` (which should be their final score before podium) to `player.totalScore` (should be the same). Or animate from 0 if no previous state is relevant.
- **Confetti:**
  - If using `react-confetti`, render it conditionally within `PodiumView` and trigger it.
  - For `framer-motion` particles, create a component that generates and animates multiple small elements.

## 7. Development Phases (Podium UI)

Since this is a design document, the implementation would follow similar phases:

1.  **Phase P1: Basic Podium Structure & Static Data Display**

    - Create `PodiumView.tsx`, `PodiumPlatform.tsx`.
    - `PodiumView` receives players, filters for Top 3 (hardcoded for now).
    - `PodiumPlatform` statically displays rank, avatar, name, and final score.
    - Basic layout and styling for platforms (height differences, colors).
    - Integrate `PodiumView` into `HostView` to render on `PODIUM` state.

2.  **Phase P2: Styling Polish & Runners-Up (Optional)**

    - Refine Tailwind CSS to closely match visual design mockups (if available) or a standard podium look.
    - Add medal icons.
    - Implement `PodiumRunnerUpItem.tsx` and list if desired.

3.  **Phase P3: Entrance Animations & Confetti**

    - Add `framer-motion` to `PodiumPlatform` for entrance animations.
    - Implement and trigger confetti/celebratory effects.
    - Animate scores if decided.

4.  **Phase P4: Refinement & Testing**
    - Test with different numbers of players (0, 1, 2, 3, >3).
    - Ensure responsiveness.
    - Code cleanup and review.
