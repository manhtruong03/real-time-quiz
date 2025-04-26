## Unified WebSocket Message Structure

This document defines the unified **envelope structure** for messages exchanged via WebSocket during an active quiz session, based on the patterns observed in the communication protocol and message examples[cite: 1, 2, 7, 8, 10, 11, 1694, 1695]. The goal is to establish a consistent format for developers.

### 1. General Envelope Structure

Application-level WebSocket messages exchanged between the Host and Players generally follow this JSON structure, often wrapped in an array `[{...}]`:

```json
// Example Structure (Conceptual)
[
  {
    "id": "<message_id>", // Optional: Bayeux protocol message ID for request/response linking.
    "channel": "<target_channel>", // e.g., "/service/player", "/service/controller", "/controller/{gameid}" [cite: 142, 166, 176]
    "clientId": "<websocket_client_id>", // Optional: Bayeux client ID, often recipient's ID. [cite: 142]
    "data": {
      // ---- Application-Specific Data Payload ----
      "gameid": "<session_game_id>",        // Unique ID for the current game session. [cite: 142, 165, 175]
      "type": "message",                   // Standard indicator for application data messages. [cite: 142, 165, 175]
      "id": <payload_type_id>,             // Numeric ID indicating the *type* of content within the 'content' field (e.g., 2=QuestionStart, 6/45=Answer, 8=Result, 13=FinalResult). [cite: 142, 165, 175]
      "content": "<json_string_payload>",  // STRINGIFIED JSON containing the specific event data (question, answer, result). **Details vary - see below.** [cite: 142, 165, 175]
      "cid": "<player_cid>",               // Player Client ID (Present when Player -> Host, or Host -> Specific Player). [cite: 165, 176]
      "host": "<host_origin>"              // Optional: Originating host identifier (e.g., "play.kahoot.it"). [cite: 142, 175]
      // ---- End Application-Specific Data ----
    },
    "ext": { // Optional: Bayeux extensions
      "timetrack": <timestamp_ms>,          // Timestamp (e.g., from player submission or host broadcast). [cite: 165, 175]
      "ack": <ack_id>                      // Used for Bayeux acknowledgements.
      // Potentially other Bayeux fields like 'timesync'.
    },
    "successful": <boolean>                // Optional: Used in acknowledgement messages (e.g., Server -> Client).
  }
]
```

### 2. Key Fields Explained

- **`channel`**: Specifies the target endpoint for the message. Common channels observed are `/service/player` (Host -> Players), `/service/controller` (Player -> Host/Server), and `/controller/{gameId}` (Player -> Specific Host instance or vice-versa)[cite: 142, 166, 176].
- **`data`**: The container for the actual application-level information.
  - **`gameid`**: Consistently identifies the specific quiz session[cite: 142, 165, 175].
  - **`type`**: Always appears to be `"message"` for application data exchange[cite: 142, 165, 175].
  - **`id` (within `data`)**: This numeric ID is crucial as it distinguishes the _purpose_ or _type_ of the payload contained within `data.content`. Examples include `1` or `2` for question stages[cite: 142], `6` or `45` for answers[cite: 165], and `8` or `13` for results[cite: 175]. **Consistent use of these IDs is vital.**
  - **`content`**: **This field contains a JSON object that has been _stringified_.** The internal structure of this JSON object varies significantly depending on whether it's a question broadcast, an answer submission, or a result notification, and further depends on the specific question type (quiz, jumble, survey, etc.).
    - **Detailed structures** for the _parsed_ `content` payload for each phase are documented separately in:
      - `./data_structures/phase2_ws_question_detail.md` (Host -> Player Question Details)
      - `./data_structures/phase3_ws_answer_detail.md` (Player -> Host Answer Submission)
      - `./data_structures/phase4_ws_result_detail.md` (Host -> Player Result Feedback)
  - **`cid`**: Identifies the specific player involved, essential for routing answers to the correct host and results to the correct player[cite: 165, 176].
- **`ext.timetrack`**: Provides a timestamp for when the message was sent or processed[cite: 165, 175].
- **`id` (Top Level), `clientId`, `successful`, other `ext` fields**: Primarily relate to the underlying Bayeux protocol for message handling, acknowledgements, and connection management. While important for the WebSocket layer, the core application structure lies within the `data` object.

### 3. Example (Question Broadcast Envelope)

This shows the envelope structure when the Host sends a question (Phase 2). Note that `data.content` is a string.

```json
// Based on: docs/data_structures/phase2_ws_question_message.txt [cite: 10, 11]
[
  {
    "id": "19", // Bayeux message ID
    "channel": "/service/player", // Target channel
    "data": {
      "gameid": "1480287",
      "type": "message",
      "host": "play.kahoot.it",
      "id": 2, // Identifies this as a 'Question Start' payload type
      "content": "{\"gameBlockIndex\":0,\"totalGameBlockCount\":20,\"layout\":\"CLASSIC\",\"title\":\"Find the flag of <b>Switzerland.</b>\",\"video\":{...},\"image\":\"...\",\"media\":[],\"type\":\"quiz\",\"timeRemaining\":19998,\"timeAvailable\":20000,\"choices\":[{\"image\":{...}},{...},{...},{...}]}" // STRINGIFIED JSON
    },
    "clientId": "1cqat1q6g73qhx7hp91di773fpuif8r", // Recipient clientId
    "ext": {} // Example with empty extensions
  }
]
```
