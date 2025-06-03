# Online Quiz Application: Frontend-Backend Communication Protocol

**Version:** 1.0
**Date:** 2025-04-22

## 1. Introduction

This document outlines the communication protocol and data structures used between the frontend (Host Client and Player Client) and the backend server for the Online Quiz Application. The goal is to provide a clear specification for development teams to work cohesively and serve as a reference for future development.

The application allows a host to run a live quiz session where players join and answer questions in real-time, similar to platforms like Kahoot! or Quizizz.

### 1.1. Frontend Technology Stack

For context, the frontend is built using the following technologies:

- **Framework:** Next.js
- **Language:** TypeScript
- **UI Library:** React
- **UI Components:** shadcn/ui (built on Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Form Handling:** React Hook Form
- **Schema Validation:** Zod
- **Package Manager:** pnpm

### 1.2. Communication Overview

The application utilizes both RESTful APIs and WebSockets for communication:

- **REST API:** Used for initial setup (fetching quiz data) and final data persistence (saving session results).
- **WebSocket:** Used for real-time communication during the active quiz session (sending questions, receiving answers, broadcasting results).

## 2. Quiz Session Workflow

A typical quiz session follows these phases:

1.  **Phase 1: Quiz Initialization (REST)**

    - Before starting the WebSocket session, the **Host Client** sends a REST `GET` request to the server to fetch the complete data for a specific quiz.
    - The server responds with the quiz structure, including all questions and their details. This data is stored locally on the Host Client.

2.  **Phase 2: Question Broadcast (WebSocket)**

    - Once the session starts, the **Host Client** acts as the orchestrator.
    - For each question in the quiz sequence, the Host Client sends the question details (formatted for players, without revealing correct answers initially) via WebSocket to all connected **Player Clients**.

3.  **Phase 3: Answer Submission (WebSocket)**

    - Each **Player Client** selects their answer based on the question type.
    - The Player Client sends their chosen answer back to the **Host Client** via WebSocket.

4.  **Phase 4: Result Calculation & Broadcast (WebSocket)**

    - After the time limit for a question expires (or all players have answered), the **Host Client** collects all submissions.
    - The Host Client calculates scores based on correctness and speed (if applicable), determines the correct answer(s), and updates the player rankings.
    - The Host Client sends personalized results (score update, rank, correctness feedback) and potentially leaderboard updates via WebSocket to each **Player Client**.
    - This loop (Phase 2-4) repeats for all questions in the quiz. All intermediate results and calculations are managed in the Host Client's local memory during the session.

5.  **Phase 5: Session Finalization (REST)**
    - After the last question is completed, the quiz session ends.
    - The **Host Client** aggregates the final results (overall scores, rankings, potentially answer statistics).
    - The Host Client sends this summary data via a REST `POST` request to the server for storage in the database.

## 3. Data Structures

This section details the agreed-upon data structures for each communication phase.

---

### 3.1. Phase 1: Quiz Initialization (Host REST Request)

The Host Client fetches the entire quiz structure.

#### 3.1.1. Overall Quiz Structure (`GET /api/quizzes/{quizId}`)

- **File:** `./data_structures/phase1_rest_quiz_structure.json`
- **Description:** Represents the main metadata and container for a quiz.

```json
{
  "uuid": "000054c5-8aa0-4b20-9d67-36eeb42ebca1", // Unique Quiz Identifier
  "creator": "39567e72-f833-4bcc-80b0-0c2b02d6c921", // User ID of the creator
  "creator_username": "Trivia", // Username of the creator
  "visibility": 1, // Visibility status (e.g., 1 for public)
  "title": "Ultimate trivia of 2019!", // Quiz title
  "description": "How much did you pay attention in 2019? Try our ultimate trivia quiz of 2019!", // Quiz description
  "quizType": "quiz", // General type of the quiz
  "cover": "https://media.kahoot.it/0689fc9f-c36d-4fba-b0e4-856b332b6788", // URL for the cover image
  "lobby_video": {
    // Optional video settings for the lobby
    "youtube": {
      "id": "",
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    }
  },
  "questions": [
    // Array of Question Objects (See Section 3.1.2)
  ],
  "isValid": true, // Server-side validation flag
  "playAsGuest": false, // Flag indicating if guests can play
  "type": "quiz", // Redundant? Same as quizType? Confirm usage.
  "created": 1572350841857, // Creation timestamp (Unix millis)
  "modified": 1741775174112 // Last modified timestamp (Unix millis)
}
```

#### 3.1.2. Question Structure (Within `questions` Array)

- **File:** `./data_structures/phase1_rest_question_structure.md`
- **Description:** Defines the structure for each item in the `questions` array. The fields vary based on the `type` property. All types include `type`, `image`, `video`, `media`.

**Common Fields:**

- `type`: (String) The type of question block (`content`, `quiz`, `jumble`, `survey`, `open_ended`).
- `image`: (String|Null) URL for the main question image/media.
- `video`: (Object|Null) Details for any associated video.
- `media`: (Array) Additional media elements.

**Type-Specific Fields:**

- **`content`** (Informational Slide):

  - `title`: (String) The main title/heading.
  - `description`: (String) Body text/content.

  <!-- end list -->

  ```json
  // Example: content
  {
    "type": "content",
    "title": "Get ready to wrap up 2019 and enter a new decade!",
    "description": "Let's take a tour of everything exciting that happened in 2019...",
    "image": "https://media.kahoot.it/16cb820f-c510-49ba-8a97-ca121c828a87",
    "video": {
      /* ... */
    },
    "media": []
  }
  ```

- **`quiz`** (Multiple Choice, True/False, Image Choice):

  - `question`: (String) The question text (can contain HTML for formatting).
  - `time`: (Number) Time limit in milliseconds.
  - `pointsMultiplier`: (Number) Factor for point calculation (e.g., 1 for standard, 2 for double points).
  - `choices`: (Array) Array of choice objects (See Section 3.1.3).

  <!-- end list -->

  ```json
  // Example: quiz (4 text choices)
  {
    "type": "quiz",
    "question": "Which of the below is one thing quantum computers <b>can't</b> do?",
    "time": 30000,
    "pointsMultiplier": 1,
    "choices": [
      /* See 3.1.3 */
    ],
    "image": "https://media.kahoot.it/37def5d0-4652-4c2f-a5a8-f0c5f8f28c2c",
    "video": {
      /* ... */
    },
    "media": []
  }
  ```

  ```json
  // Example: quiz (image choices)
  {
    "type": "quiz",
    "question": "Find the flag of <b>Switzerland.</b>",
    "time": 20000,
    "pointsMultiplier": 1,
    "choices": [
      /* See 3.1.3 */
    ],
    "image": "https://media.kahoot.it/53154f05-eab7-4c56-8772-866b131ee2c4",
    "video": {
      /* ... */
    },
    "media": []
  }
  ```

- **`jumble`** (Order Items Correctly):

  - `question`: (String) The instruction/question text.
  - `time`: (Number) Time limit in milliseconds.
  - `pointsMultiplier`: (Number) Point calculation factor.
  - `choices`: (Array) Array of choice objects. The `correct` field indicates if it's part of the sequence (usually all true), the inherent order in the array defines the correct sequence. (See Section 3.1.3).

  <!-- end list -->

  ```json
  // Example: jumble
  {
    "type": "jumble",
    "question": "Let's start with science! Place these space events in order:",
    "time": 60000,
    "pointsMultiplier": 1,
    "choices": [
      /* See 3.1.3 */
    ],
    "image": "https://media.kahoot.it/f3a2ced4-2a00-4125-b791-9e5621faa001",
    "video": {
      /* ... */
    },
    "media": []
  }
  ```

- **`survey`** (Poll/Opinion Question):

  - `question`: (String) The survey question text.
  - `time`: (Number) Time limit in milliseconds.
  - `choices`: (Array) Array of choice objects. `correct` is typically `true` for all, as there's no single right answer for scoring. (See Section 3.1.3).

  <!-- end list -->

  ```json
  // Example: survey
  {
    "type": "survey",
    "question": "What's your top movie choice from these all-time classics?",
    "time": 20000,
    "choices": [
      /* See 3.1.3 */
    ],
    "image": "https://media.kahoot.it/76df82c1-b762-496c-8e45-a4c5aff89f63",
    "video": {
      /* ... */
    },
    "media": []
  }
  ```

- **`open_ended`** (Text Input):

  - `question`: (String) The question text.
  - `time`: (Number) Time limit in milliseconds.
  - `pointsMultiplier`: (Number) Point calculation factor.
  - `choices`: (Array) Contains the acceptable correct answer(s). (See Section 3.1.3).

  <!-- end list -->

  ```json
  // Example: open_ended
  {
    "type": "open_ended",
    "question": "Final question and double points! What was Pantone's color of 2019?",
    "time": 30000,
    "pointsMultiplier": 2,
    "choices": [
      /* See 3.1.3 */
    ],
    "image": "https://media.kahoot.it/754dc179-c090-4a8d-8404-0e705d813821",
    "video": {
      /* ... */
    },
    "media": []
  }
  ```

#### 3.1.3. Choice Structure (Within `choices` Array of a Question)

- **File:** `./data_structures/phase1_rest_choice_structure.md`

- **Description:** Defines the structure for each item in the `choices` array within a question object (fetched in Phase 1). The host uses this structure, including the `correct` field, for validation and scoring.

- **`content`**:

  - `choices`: `[]` (Always empty)

- **`quiz`** (Text or Image Choices):

  - `answer`: (String, optional) The text of the answer choice. Required if `image` is not present.
  - `image`: (Object, optional) Image details for the choice. Required if `answer` is not present. Contains `id`, `altText`, `contentType`, `url` (implicitly derived from `id` or explicit), etc.
  - `correct`: (Boolean) Indicates if this choice is the correct answer.

  <!-- end list -->

  ```json
  // Example: quiz (text choice)
  {
    "answer": "True",
    "correct": true
  }
  ```

  ```json
  // Example: quiz (image choice)
  {
    "image": {
      "id": "588f9aff-82f1-473d-ac0b-560511c71fe5",
      "altText": "swiss flag",
      "contentType": "image/jpeg"
      /* ... other image metadata ... */
    },
    "correct": true
  }
  ```

- **`jumble`**:

  - `answer`: (String) The text of the item to be ordered.
  - `correct`: (Boolean) Always `true`. The order in the `choices` array defines the correct sequence.

  <!-- end list -->

  ```json
  // Example: jumble choice
  {
    "answer": "Food grown in space eaten",
    "correct": true // Correctness is defined by position in the array
  }
  ```

- **`survey`**:

  - `answer`: (String) The text of the survey option.
  - `correct`: (Boolean) Typically `true` for all options, as surveys are opinion-based.

  <!-- end list -->

  ```json
  // Example: survey choice
  {
    "answer": "The Godfather",
    "correct": true // Indicates it's a valid option, not necessarily 'correct'
  }
  ```

- **`open_ended`**:

  - `answer`: (String) The text of an acceptable correct answer. Multiple entries might exist if variations are allowed.
  - `correct`: (Boolean) Always `true`.

  <!-- end list -->

  ```json
  // Example: open_ended choice (defines the correct answer)
  {
    "answer": "Living Coral",
    "correct": true
  }
  ```

---

### 3.2. Phase 2: Question Broadcast (Host WebSocket Message -\> Player)

The Host sends the current question to all players.

#### 3.2.1. WebSocket Message Envelope

- **File:** `./data_structures/phase2_ws_question_message.json`
- **Description:** The wrapper structure for WebSocket messages containing question data. The actual question data is a JSON _string_ within the `data.content` field.

<!-- end list -->

```json
[
  // WebSocket messages often arrive in an array
  {
    "id": "19", // Internal message ID for WebSocket protocol (e.g., Bayeux)
    "channel": "/service/player", // Target channel for player clients
    "data": {
      "gameid": "1480287", // Unique ID for this specific game session
      "type": "message", // Type of data payload
      "host": "play.kahoot.it", // Originating host (may not be needed)
      "id": 2, // **Specific ID indicating this message contains question data**
      "content": "..." // JSON String containing the detailed question structure (See Section 3.2.2)
    },
    "clientId": "1cqat1q6g73qhx7hp91di773fpuif8r", // WebSocket client ID of the recipient
    "ext": {
      // Optional extensions (e.g., timing info)
    }
  }
]
```

#### 3.2.2. Detailed Question Structure (Inside `data.content` JSON String)

- **File:** `./data_structures/phase2_ws_question_detail.md`
- **Description:** The structure of the JSON object _parsed from the `data.content` string_ in the WebSocket message. This is what the Player Client receives and renders. **Crucially, it does not contain the `correct` field within choices.**

**Common Fields:**

- `gameBlockIndex` / `questionIndex`: (Number) 0-based index of the current question/block in the quiz sequence.
- `totalGameBlockCount`: (Number) Total number of questions/blocks in the quiz.
- `title`: (String) Question text or content title.
- `video`: (Object) Video details.
- `image`: (String) Main image URL.
- `media`: (Array) Additional media.
- `type` / `gameBlockType`: (String) Question type (`content`, `quiz`, `jumble`, `survey`, `open_ended`).
- `timeAvailable`: (Number) Total time allowed for the question (ms).
- `timeRemaining`: (Number) Time left when the message was sent (can be used for synchronization, but frontend timer is likely primary).
- `getReadyTimeAvailable` / `getReadyTimeRemaining`: (Number) Time for the "Get Ready" screen before the question starts (ms).
- `pointsMultiplier`: (Number) Points factor (not present in `survey`).
- `numberOfChoices`: (Number) Number of options available (present in `quiz`, `jumble`, `survey`).
- `choices`: (Array) Array of choices, **without the `correct` field**. Structure varies by type (See below).
- `numberOfAnswersAllowed`: (Number) How many choices can be selected (usually 1, could be \>1 for multi-select).
- `currentQuestionAnswerCount`: (Number) How many answers have been received by the host so far (for display on host screen, maybe player).

**Type-Specific `choices` Structure for Players:**

- **`content`**: No `choices` field. Has `description`.
- **`quiz`** (Text or Image): Array of objects, each containing _either_ `answer` (String) _or_ `image` (Object).
  ```json
    // Example: quiz choices for player
    "choices":[
      { "answer": "True" },
      { "answer": "False" }
    ]
    // --- OR ---
    "choices":[
      { "image": { /* image metadata */ } },
      { "image": { /* image metadata */ } },
      { "image": { /* image metadata */ } },
      { "image": { /* image metadata */ } }
    ]
  ```
- **`jumble`**: Array of objects, each containing `answer` (String). The order received by the player is typically randomized.
  ```json
    // Example: jumble choices for player (randomized order)
    "choices":[
      { "answer": "NASA announces..." },
      { "answer": "Food grown..." },
      { "answer": "All female space walk" },
      { "answer": "Soft landing..." }
    ]
  ```
- **`survey`**: Array of objects, each containing `answer` (String).
  ```json
    // Example: survey choices for player
    "choices":[
      { "answer": "The Godfather" },
      { "answer": "Pulp Fiction" },
      { "answer": "Star Wars" },
      { "answer": "Forrest Gump" }
    ]
  ```
- **`open_ended`**: No `choices` field sent to the player. Player sees a text input field.

---

### 3.3. Phase 3: Answer Submission (Player WebSocket Message -\> Host)

The Player sends their selected answer back to the Host.

#### 3.3.1. WebSocket Message Envelope

- **File:** `./data_structures/phase3_ws_answer_message.json`
- **Description:** The wrapper structure for WebSocket messages containing player answers. The actual answer data is a JSON _string_ within the `data.content` field.

<!-- end list -->

```json
[
  {
    "ext": {
      "timetrack": 1745286630637 // Client-side timestamp when sent
    },
    "data": {
      "gameid": "6681947", // Game session ID
      "id": 6, // **Specific ID indicating this message contains an answer submission**
      "type": "message",
      "content": "...", // JSON String containing the detailed answer structure (See Section 3.3.2)
      "cid": "576520963" // Unique identifier for the player (can be WebSocket client ID or internal ID)
    },
    "channel": "/controller/6681947" // Target channel for the host controller
  }
]
```

#### 3.3.2. Detailed Answer Structure (Inside `data.content` JSON String)

- **File:** `./data_structures/phase3_ws_answer_detail.md`
- **Description:** The structure of the JSON object _parsed from the `data.content` string_. This is what the Host Client receives.

**Common Fields:**

- `type`: (String) The type of question being answered (`quiz`, `jumble`, `survey`, `open_ended`).
- `questionIndex`: (Number) The index of the question being answered (to prevent race conditions).

**Type-Specific Fields:**

- **`quiz` / `survey`**:

  - `choice`: (Number) The 0-based index of the selected choice from the `choices` array sent in Phase 2.

  <!-- end list -->

  ```json
  // Example: quiz/survey answer
  { "type": "quiz", "choice": 0, "questionIndex": 3 }
  ```

- **`jumble`**:

  - `choice`: (Array\<Number\>) An array of 0-based indices representing the player's submitted order of the choices sent in Phase 2.

  <!-- end list -->

  ```json
  // Example: jumble answer
  { "type": "jumble", "choice": [0, 1, 3, 2], "questionIndex": 1 }
  ```

- **`open_ended`**:

  - `text`: (String) The text entered by the player.

  <!-- end list -->

  ```json
  // Example: open_ended answer
  { "type": "open_ended", "text": "hello", "questionIndex": 14 }
  ```

---

### 3.4. Phase 4: Result Broadcast (Host WebSocket Message -\> Player)

The Host sends the outcome of the question (points, correctness, rank) to each player.

#### 3.4.1. WebSocket Message Envelope

- **File:** `./data_structures/phase4_ws_result_message.json`
- **Description:** The wrapper structure for WebSocket messages containing player results for the completed question. The actual result data is a JSON _string_ within the `data.content` field.

<!-- end list -->

```json
[
  {
    "ext": {
      "timetrack": 1745286636262 // Host-side timestamp when sent
    },
    "data": {
      "gameid": "6681947", // Game session ID
      "host": "play.kahoot.it", // Originating host
      "id": 8, // **Specific ID indicating this message contains question result data**
      "type": "message",
      "content": "...", // JSON String containing the detailed result structure (See Section 3.4.2)
      "cid": "576520963" // Identifier for the player receiving this result (WebSocket client ID or internal ID)
    },
    "channel": "/service/player" // Target channel for player clients
  }
]
```

#### 3.4.2. Detailed Result Structure (Inside `data.content` JSON String)

- **File:** `./data_structures/phase4_ws_result_detail.md`
- **Description:** The structure of the JSON object _parsed from the `data.content` string_. This contains personalized feedback for the player.

**Common Fields:**

- `rank`: (Number) Player's current rank in the game.
- `totalScore`: (Number) Player's total score accumulated so far.
- `pointsData`: (Object) Detailed breakdown of points earned.
  - `totalPointsWithBonuses`: (Number) Total points including streak bonuses.
  - `questionPoints`: (Number) Base points earned for the current question.
  - `answerStreakPoints`: (Object) Info about the answer streak bonus.
    - `streakLevel`: (Number) Current consecutive correct answer count.
    - `previousStreakLevel`: (Number) Streak count before this question.
  - `lastGameBlockIndex`: (Number) Index of the question this result pertains to.
- `hasAnswer`: (Boolean) Whether the player submitted an answer for this question.
- `choice`: (Number | Array\<Number\> | String) The answer submitted by the player (matches format from Phase 3.3.2, or -4 / other indicator for `open_ended` correctness check).
- `points`: (Number) Points awarded for _this_ question (present for `quiz`, `jumble`, `open_ended` if correct).
- `isCorrect`: (Boolean) Whether the submitted answer was correct (present for `quiz`, `jumble`, `open_ended`).
- `text`: (String) Display text related to the answer. Varies by type:
  - `quiz`: Text of the chosen answer.
  - `jumble`: Pipe-separated string of the player's submitted order.
  - `survey`: Text of the chosen option.
  - `open_ended`: The text the player submitted.
- `type`: (String) The question type (`quiz`, `jumble`, `survey`, `open_ended`).

**Type-Specific Fields:**

- **`quiz` / `jumble` / `open_ended`**:

  - `correctChoices` / `correctTexts`: (Array\<Number\> | Array\<String\>) The correct answer(s)/sequence/texts.
    - `quiz`: Array containing the index(es) of the correct choice(s).
    - `jumble`: Array containing the indices in the correct order.
    - `open_ended`: Array containing the acceptable correct string(s).

- **`survey`**: Does not contain `points`, `isCorrect`, or `correctChoices`.

**Examples:**

```json
// Example: jumble result (incorrect)
{
  "rank": 1,
  "totalScore": 0,
  "pointsData": { /* ... */ "lastGameBlockIndex": 1 },
  "hasAnswer": true,
  "choice": [1, 0, 3, 2], // Player's order
  "correctChoices": [1, 3, 0, 2], // Correct order
  "points": 0,
  "isCorrect": false,
  "text": "Food grown...|NASA announces...|Soft landing...|All female...", // Player's order text
  "type": "jumble"
}
```

```json
// Example: quiz result (correct)
{
  "rank": 1,
  "totalScore": 533,
  "pointsData": { /* ... */ "lastGameBlockIndex": 3 },
  "hasAnswer": true,
  "choice": 0, // Player chose index 0
  "points": 533,
  "correctChoices": [0], // Correct choice was index 0
  "text": "True", // Text of the chosen answer
  "type": "quiz",
  "isCorrect": true
}
```

```json
// Example: survey result
{
  "rank": 1,
  "totalScore": 533, // Score unchanged from previous question
  "pointsData": { /* ... */ "questionPoints": 0, "lastGameBlockIndex": 10 },
  "hasAnswer": true,
  "choice": 1, // Player chose index 1
  "text": "Pulp Fiction", // Text of chosen option
  "type": "survey"
  // No points, isCorrect, correctChoices
}
```

```json
// Example: open_ended result (incorrect)
{
  "rank": 1,
  "totalScore": 533, // Score unchanged
  "pointsData": { /* ... */ "questionPoints": 0, "lastGameBlockIndex": 14 },
  "hasAnswer": true,
  "points": 0,
  "choice": -4, // Indicator for text comparison result? Confirm meaning. Or simply derived from isCorrect.
  "isCorrect": false,
  "text": "hello", // Player's submitted text
  "type": "open_ended",
  "correctTexts": ["Living Coral"] // The correct answer(s)
}
```

---

### 3.5. Phase 5: Session Finalization (Host REST POST Request)

- **Description:** After the final question, the Host Client aggregates all data collected locally (player scores, final rankings, potentially answer distributions per question) and sends it to a designated REST endpoint (e.g., `POST /api/sessions/{gameId}/results`).
- **Structure:** _To be defined_. It should contain enough information for the backend to permanently store the session outcome. This will likely include:
  - `gameId`: The unique identifier for the session.
  - `quizId`: The UUID of the quiz used.
  - `finalRanking`: An array of objects, each with player info (`cid` or `username`), `finalScore`, and final `rank`.
  - `questionResults` (Optional): Aggregated statistics per question (e.g., percentage correct, answer distribution).

<!-- end list -->

```json
// Example (Hypothetical Structure - Needs Finalization)
{
  "gameId": "6681947",
  "quizId": "000054c5-8aa0-4b20-9d67-36eeb42ebca1",
  "finalRanking": [
    {
      "cid": "576520963",
      "username": "Player1",
      "finalScore": 1250,
      "rank": 1
    },
    { "cid": "987654321", "username": "Player2", "finalScore": 980, "rank": 2 }
    // ... other players
  ],
  "sessionEndTime": 1745286800000 // Timestamp
  // Optional detailed stats per question could go here
}
```

---

## 4\. Key Considerations

- **JSON Stringification in WebSockets:** Note that the `content` field in WebSocket messages (`data.content`) is a **stringified JSON object**. Clients and the host need to `JSON.parse()` this string upon receiving and `JSON.stringify()` the relevant object before sending.
- **Error Handling:** Robust error handling for both REST and WebSocket communication (network errors, invalid data, timeouts) must be implemented.
- **State Management:** The Host Client holds the primary state during the session. Player clients reflect the state pushed by the host.
- **Synchronization:** Time synchronization can be challenging. Relying on server-sent `timeRemaining` might have latency issues. Using client-side timers initiated upon receiving the question (Phase 2) alongside the `timeAvailable` value is generally more reliable for the player experience. The host manages the authoritative timer.
- **Scalability:** The current architecture places significant load (computation, memory) on the Host Client. For very large numbers of players, consider moving calculation logic to the backend via WebSocket communication if performance becomes an issue.

<!-- end list -->
