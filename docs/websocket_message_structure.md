## Unified WebSocket Message Structure

This document defines the unified **envelope structure** for messages exchanged via WebSocket during an active quiz session, based on the patterns observed in the communication protocol and message examples. The goal is to establish a consistent format for developers.

### 1. General Envelope Structure

Application-level WebSocket messages exchanged between the Host and Players generally follow this JSON structure, often wrapped in an array `[{...}]`. This structure accommodates both Bayeux protocol-level fields and the application-specific data payload.

```json
// Example Structure (Conceptual)
[
  {
    "id": "<message_id_bayeux>",       // Bayeux protocol message ID. Optional but common, especially for messages expecting a response/acknowledgement. Used for correlating requests and replies.
    "channel": "<target_channel>",     // e.g., "/service/player", "/service/controller", "/controller/{gameid}"
    "clientId": "<websocket_client_id>",// Optional: Bayeux client ID, often the recipient's ID or the sender's session ID.
    "data": {
      // ---- Application-Specific Data Payload ----
      "gameid": "<session_game_id>",    // Unique ID for the current game session.
      "type": "message",               // Standard indicator for application data messages (can vary, e.g., "joined", "left").
      "id": <payload_type_id>,         // Numeric ID *within the data object* indicating the specific *type* of content or action in the 'content' field (e.g., 2=QuestionStart, 10=PlayerKicked, 6/45=Answer).
      "content": "<json_string_payload>",// STRINGIFIED JSON containing the specific event data (question, answer, result, kick details).
      "cid": "<player_cid>",           // Player Client ID (Present when Player -> Host, or Host -> Specific Player).
      "host": "<host_origin>"          // Optional: Originating host identifier (e.g., "play.kahoot.it").
      // ---- End Application-Specific Data ----
    },
    "ext": { // Optional: Bayeux extensions
      "timetrack": <timestamp_ms>,      // Timestamp (e.g., from player submission or host broadcast).
      "ack": <ack_id>                  // Used for Bayeux acknowledgements.
      // Potentially other Bayeux fields like 'timesync'.
    },
    "successful": <boolean>            // Optional: Used in Bayeux acknowledgement messages (e.g., Server -> Client).
  }
]
```

### 2. Key Fields Explained

- **`id` (Top-Level, e.g., `message_id_bayeux`)**: This is primarily a **Bayeux protocol message identifier**.
  - It's often a string (though numeric in some examples).
  - Used to correlate requests and responses/acknowledgements within the Bayeux messaging layer. For example, if a client sends a message with `id: "5"`, the server's acknowledgement for that specific message might also reference `id: "5"`.
  - Its presence and value are dictated by Bayeux protocol requirements for reliable messaging, especially for publish/subscribe or client-server request-response patterns.
  - Not to be confused with `data.id`.
- **`channel`**: Specifies the target endpoint for the message. Common channels observed are `/service/player` (Host -> Players), `/service/controller` (Player -> Host/Server), and `/controller/{gameId}` (Player -> Specific Host instance or vice-versa).
- **`clientId`**: This is the unique **Bayeux session identifier** assigned by the server to a specific client connection during the initial `/meta/handshake`.
  - **Server Assignment:** The client _receives_ this ID from the server.
  - **Session Identification:** The client must include this `clientId` in subsequent messages (like `/meta/connect`, publish requests) sent _to_ the server over its established WebSocket connection.
  - **Server-Side Validation (Security):** A Bayeux server validates that the `clientId` in a message matches the session associated with the WebSocket connection.
- **`data`**: The container for the actual application-level information.
  - **`gameid`**: Consistently identifies the specific quiz session.
  - **`type`**: Often `"message"` for standard application data exchange. However, it can vary for specific events, such as `"joined"` (player join) or `"left"` (player leave), which might simplify the data structure for those events.
  - **`id` (within `data`, e.g., `payload_type_id`)**: This **numeric ID is crucial as it distinguishes the _purpose_ or _type_ of the payload** contained within `data.content` or the nature of the message if `data.content` is minimal.
    - Examples include:
      - `1` or `2`: Question stages
      - `6` or `45`: Answers
      - `8` or `13`: Results
      - `10`: Player Kicked (as seen in the kick message example)
      - `35`: Host-initiated updates (e.g., background changes)
      - `46`: Avatar changes
    - **Consistent use and clear definition of these `data.id` values are vital for message parsing and handling.**
  - **`content`**: **This field typically contains a JSON object that has been _stringified_**. The internal structure of this JSON object varies significantly depending on the `data.id` value. For instance, for a "Player Kicked" message (`data.id: 10`), `content` would be `{"kickCode":1}`.
    - **Detailed structures** for the _parsed_ `content` payload for various phases/actions should be documented separately.
  - **`cid`**: Identifies the specific player involved (often a unique player connection/session ID). Essential for routing answers to the correct host, results to the correct player, or kick messages to the targeted player.
  - **`host`**: Optional identifier for the originating host.
- **`ext.timetrack`**: Provides a timestamp for when the message was sent or processed.
- **`ext.ack`**: Used in Bayeux for acknowledgement features.
- **`successful`**: Typically present in Bayeux server responses to indicate the success or failure of a corresponding client request.

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
      "id": 2, // DATA.ID: ID indicating Question Start
      "content": "{...}" // STRINGIFIED JSON payload for the question
    },
    "clientId": "bayeux_client_session_id_example", // Bayeux client ID
    "ext": {} // Optional extensions
  }
]
```

#### 3.2. Player Join Message (Host Receives - _Structural Variation_)

**Note:** This message type deviates from the general envelope structure. It lacks a top-level `id` and `clientId` in some observed forms, and its `data` object is simplified, with `data.type` being "joined".

- **Direction:** Player Client -> Host Controller Channel
- **Structure:** Direct JSON object (usually within an array `[{...}]`).

```json
// Example Player Join Message (Received by Host)
[
  {
    "ext": {
      "timetrack": 1744956086732 // Timestamp of join
    },
    "data": {
      "name": "Player 01", // Nickname chosen by player
      "type": "joined", // Event type specific to join (not "message")
      "content": "{}", // Usually empty or minimal for join event
      "cid": "1992509558" // Player's unique connection ID
    },
    "channel": "/controller/1480287" // Specific game channel host listens on
  }
]
```

#### 3.3. Player Avatar Change Message (Host Receives - _Standard Structure_)

This message follows the general envelope structure. The key identifier is `data.id = 46`, distinguishing it as a player update containing avatar information within `data.content`.

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
    "data": {
      "gameid": "1480287", // Game session ID
      "id": 46, // <<< DATA.ID: Specific ID indicating Avatar Change payload type
      "type": "message", // General message type
      "content": "{\"avatar\":{\"id\":\"avatar-cat-uuid-9i8j\"}}", // STRINGIFIED JSON
      "cid": "1992509558" // Player's unique connection ID
    },
    "channel": "/controller/1480287" // Specific game channel
  }
]
```

#### 3.4. Host Background Change Message (Host Broadcasts - _Standard Structure_)

This message follows the general envelope structure. Sent by the Host to all players. The `data.id = 35` distinguishes it as a game setting update.

- **Direction:** Host -> Player Clients (Broadcast)
- **Channel:** `/service/player`
- **`data.id` Value:** `35`
- **`data.content` Structure:** JSON string: `{"background":{"id":"<selected_background_uuid>"}}`

```json
// Example Host Background Change Message (Sent by Host)
[
  {
    // "id": "bayeux_msg_35", // Optional Bayeux message ID
    "channel": "/service/player",
    "data": {
      "gameid": "1480287",
      "id": 35, // <<< DATA.ID: Specific ID indicating Background Change
      "type": "message",
      "host": "VuiQuiz.com",
      "content": "{\"background\":{\"id\":\"bg-spring-uuid-3cd4\"}}" // STRINGIFIED JSON
    },
    "ext": {
      "timetrack": 1744956128979
    }
  }
]
```

#### 3.5. Host Kicks Player Message (Host Proactively Sends - _Standard Structure_)

This message follows the general envelope structure. It's sent by the Host to a specific player. The `data.id = 10` indicates a kick action, and `data.content` contains the `kickCode`.

- **Direction:** Host -> Specific Player Client
- **Channel:** `/service/player` (or a direct channel to the `clientId`)
- **`data.id` Value:** `10` (Indicates Player Kicked)
- **`data.content` Structure:** JSON string: `{"kickCode":1}`

```json
// Example Host Kicks Player Message (Sent by Host)
[
  {
    "id": "10", // Bayeux message ID (can be arbitrary, matches example provided)
    "channel": "/service/player",
    "data": {
      "gameid": "4519908",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "340133713", // Player's unique connection ID (Target of the kick)
      "id": 10, // <<< DATA.ID: Specific ID indicating Player Kicked
      "content": "{\"kickCode\":1}" // STRINGIFIED JSON payload with kick reason/code
    },
    "clientId": "2mzdpm3cskrl0xscdqfpvf4iwjcn", // Bayeux client ID of the kicked player
    "ext": {
      // "timetrack": <timestamp> // Optional extension
    }
  }
]
```

_Comment: The example provided for this message shows the top-level `id` as "10" and `data.id` as 10. While the `data.id` value is critical for payload type, the top-level Bayeux `id` is typically for message tracking in that protocol and might not always align with `data.id`._

#### 3.6. Player Leaves Room Message (Host Receives - _Structural Variation_)

**Note:** This message type, similar to the Player Join Message, deviates from the general envelope. It is direct, with `data.type` being "left".

- **Direction:** Player Client -> Host Controller Channel
- **Structure:** Direct JSON object (usually within an array `[{...}]`).

```json
// Example Player Leaves Room Message (Received by Host)
[
  {
    "ext": {
      "timetrack": 1747012963324 // Timestamp of when the player left
    },
    "data": {
      "type": "left", // Event type specific to player leaving (not "message")
      "cid": "145098303" // Player's unique connection ID that left
    },
    "channel": "/controller/4519908" // Specific game channel host listens on
  }
]
```

_(Rest of the document, potentially including other standard messages like Answer Submission_...
