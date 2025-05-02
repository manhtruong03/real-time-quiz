## Unified WebSocket Message Structure

This document defines the unified **envelope structure** for messages exchanged via WebSocket during an active quiz session, based on the patterns observed in the communication protocol and message examples[cite: 1, 2, 7, 8, 10, 11, 1694, 1695]. The goal is to establish a consistent format for developers.

### 1. General Envelope Structure

Application-level WebSocket messages exchanged between the Host and Players generally follow this JSON structure, often wrapped in an array `[{...}]`:

```json
// Example Structure (Conceptual)
[
  {
    "id": "<message_id>", // Optional: Bayeux protocol message ID for request/response linking.
    "channel": "<target_channel>", // e.g., "/service/player", "/service/controller", "/controller/{gameid}"
    "clientId": "<websocket_client_id>", // Optional: Bayeux client ID, often recipient's ID.
    "data": {
      // ---- Application-Specific Data Payload ----
      "gameid": "<session_game_id>",        // Unique ID for the current game session.
      "type": "message",                   // Standard indicator for application data messages.
      "id": <payload_type_id>,             // Numeric ID indicating the *type* of content within the 'content' field (e.g., 2=QuestionStart, 6/45=Answer, 8=Result, 13=FinalResult).
      "content": "<json_string_payload>",  // STRINGIFIED JSON containing the specific event data (question, answer, result). **Details vary - see below.**
      "cid": "<player_cid>",               // Player Client ID (Present when Player -> Host, or Host -> Specific Player).
      "host": "<host_origin>"              // Optional: Originating host identifier (e.g., "play.kahoot.it").
      // ---- End Application-Specific Data ----
    },
    "ext": { // Optional: Bayeux extensions
      "timetrack": <timestamp_ms>,          // Timestamp (e.g., from player submission or host broadcast).
      "ack": <ack_id>                      // Used for Bayeux acknowledgements.
      // Potentially other Bayeux fields like 'timesync'.
    },
    "successful": <boolean>                // Optional: Used in acknowledgement messages (e.g., Server -> Client).
  }
]
```

### 2. Key Fields Explained

- **`channel`**: Specifies the target endpoint for the message. Common channels observed are `/service/player` (Host -> Players), `/service/controller` (Player -> Host/Server), and `/controller/{gameId}` (Player -> Specific Host instance or vice-versa).
- **`data`**: The container for the actual application-level information.
  - **`gameid`**: Consistently identifies the specific quiz session.
  - **`type`**: Often `"message"` for standard application data exchange, but can vary (e.g., `"joined"` for join events)..
  - **`id` (within `data`)**: This numeric ID is crucial as it distinguishes the _purpose_ or _type_ of the payload contained within `data.content`. Examples include `1` or `2` for question stages, `6` or `45` for answers, and `8` or `13` for results, `35` for host-initiated updates like background changes, and potentially others like `46` for avatar changes. **Consistent use of these IDs is vital.**
  - **`content`**: **This field contains a JSON object that has been _stringified_.** The internal structure of this JSON object varies significantly depending on whether it's a question broadcast, an answer submission, or a result notification, or avatar info, and further depends on the specific question type (quiz, jumble, survey, etc.).
    - **Detailed structures** for the _parsed_ `content` payload for each phase are documented separately in:
      - `./data_structures/phase2_ws_question_detail.md` (Host -> Player Question Details)
      - `./data_structures/phase3_ws_answer_detail.md` (Player -> Host Answer Submission)
      - `./data_structures/phase4_ws_result_detail.md` (Host -> Player Result Feedback)
  - **`cid`**: Identifies the specific player involved, essential for routing answers to the correct host and results to the correct player.
- **`ext.timetrack`**: Provides a timestamp for when the message was sent or processed.
- **`id` (Top Level), `clientId`, `successful`, other `ext` fields**: These fields are primarily related to the underlying **Bayeux protocol** managing the WebSocket communication session, message handling, and acknowledgements.
  - **`id` (Top Level):** A Bayeux message identifier, often used to correlate requests and responses (e.g., acknowledgements).
  - **`clientId`:** This is the unique **Bayeux session identifier** assigned by the server to a specific client connection during the initial `/meta/handshake`.
    - **Server Assignment:** It's crucial to understand that the client _receives_ this ID from the server; it doesn't generate it initially.
    - **Session Identification:** The client must include this `clientId` in subsequent messages (like `/meta/connect`, publish requests, etc.) sent _to_ the server over its established WebSocket connection.
    - **Server-Side Validation (Security):** A correctly implemented Bayeux server **validates** incoming messages. It ensures that the `clientId` present in the message payload matches the `clientId` it previously associated with the specific WebSocket connection from which the message arrived. **This binding prevents one client (e.g., Player 1 on Connection A) from successfully sending messages while impersonating another client (e.g., using Player 2's `clientId` on Connection A). Such attempts should be rejected by the server.**
    - **Reconnection:** The `clientId` is also used in `/meta/connect` messages when a client attempts to reconnect after a transport interruption (e.g., a new WebSocket connection is established). The server will only allow this resumption if the session associated with the provided `clientId` exists _and_ is not currently bound to another _active_ WebSocket connection. This prevents hijacking an _active_ session belonging to another user.
  - **`successful`:** Typically present in server responses (e.g., acknowledgements) to indicate the success or failure of the corresponding client request.
  - **`ext`:** Container for Bayeux extensions, such as acknowledgements (`ack`), timestamps (`timetrack`), or time synchronization (`timesync`).

### 3. Example Message Payloads and Variations

This section provides examples of specific message types, highlighting how they fit or deviate from the general envelope structure defined in Section 1.

#### 3.1. Standard Message Example (Question Broadcast Envelope)

This shows the typical envelope structure (fitting the general model) when the Host sends a question (Phase 2). `data.content` is a stringified JSON object.

```json
// Based on: docs/data_structures/phase2_ws_question_message.txt
[
  {
    "id": "19", // Bayeux message ID
    "channel": "/service/player", // Target channel
    "data": {
      // Standard data structure
      "gameid": "1480287",
      "type": "message", // Standard type
      "host": "play.kahoot.it",
      "id": 2, // ID indicating Question Start
      "content": "{...}" // STRINGIFIED JSON payload
    },
    "clientId": "...", // Bayeux client ID
    "ext": {} // Optional extensions
  }
]
```

#### 3.2. Player Join Message (Host Receives - _Structural Variation_)

**Note:** This message type deviates from the general envelope structure described in Section 1. It lacks top-level `id` and `clientId`, and its `data` object has a different set of fields focused purely on the join event.

- **Direction:** Player Client -> Host Controller Channel
- **Structure:** Direct JSON object (usually within an array `[{...}]`).

```json
// Example Player Join Message (Received by Host)
[
  {
    "ext": {
      "timetrack": 1744956086732 // Timestamp of join
    },
    // 'data' object has a specific structure for 'joined' type:
    "data": {
      "name": "Player 01", // Nickname chosen by player
      "type": "joined", // Event type specific to join
      "content": "{}", // Usually empty or minimal for join event
      "cid": "1992509558" // Player's unique connection ID
    },
    "channel": "/controller/1480287" // Specific game channel host listens on
  }
]
```

#### 3.3. Player Avatar Change Message (Host Receives - _Standard Structure_)

This message follows the general envelope structure. The key identifier is the `data.id` value (e.g., 46 in the example), distinguishing it as a player update containing avatar information within the `data.content` string.

- **Direction:** Player Client -> Host Controller Channel
- **`data.id` Value:** `46` (Example ID for this specific player update)
- **`data.content` Structure:** JSON string: `{"avatar":{"id":<avatar_id>}}`

```json
// Example Avatar Change Message (Received by Host)
[
  {
    "ext": {
      "timetrack": 1744956094127 // Timestamp of change
    },
    // 'data' object follows the standard structure:
    "data": {
      "gameid": "1480287", // Game session ID
      "id": 46, // <<< Specific ID indicating Avatar Change payload type
      "type": "message", // General message type
      // Content is a JSON string containing the avatar update:
      "content": "{\"avatar\":{\"id\":avatar-cat-uuid-9i8j}}",
      "cid": "1992509558" // Player's unique connection ID
    },
    "channel": "/controller/1480287" // Specific game channel
  }
]
```

#### 3.4. Host Background Change Message (Host Broadcasts - _Standard Structure_)

This message follows the general envelope structure. It's sent by the Host to all players when the lobby background is changed via settings. The key identifier is the `data.id` value (e.g., `35` in this example), distinguishing it as a game setting update containing background information within the `data.content` string.

- **Direction:** Host -> Player Clients (Broadcast)
- **Channel:** `/service/player`
- **`data.id` Value:** `35` (Example ID for this specific Host update - **Please confirm/choose an appropriate ID**)
- **`data.content` Structure:** JSON string: `{"background":{"id":"<selected_background_uuid>"}}`

```json
// Example Host Background Change Message (Sent by Host)
[
  {
    // Top-level Bayeux ID might be present if sent as a request requiring ack,
    // or absent if just a broadcast publish. Example assumes broadcast.
    // "id": "...",
    "channel": "/service/player", // Standard broadcast channel
    "clientId": null, // Usually null for broadcasts from host? Confirm necessity.
    "data": {
      // Standard data structure:
      "gameid": "1480287", // Game session ID
      "id": 35, // <<< Specific ID indicating Background Change payload type
      "type": "message", // General message type
      "host": "VuiQuiz.com", // Optional: Host identifier
      // Content is a JSON string containing the background update:
      "content": "{\"background\":{\"id\":\"bg-spring-uuid-3cd4\"}}" // Example with a background UUID
      // "cid" is usually absent in broadcast messages from host -> all players
    },
    "ext": {
      "timetrack": 1744956128979 // Timestamp of change broadcast
      // Other extensions like 'ack' might depend on publish method
    }
    // "successful" field is typically for server->client ACKs, not host broadcasts
  }
]
```

_(Rest of the document, potentially including other standard messages like Answer Submission_...
