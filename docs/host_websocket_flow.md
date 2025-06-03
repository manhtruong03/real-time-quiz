# Host WebSocket Message Flow (Kahoot!)

This file describes the WebSocket message flow sent and received by the Host (game server) during a Kahoot! session, based on the `host.txt` log file. Duplicate message structures have been removed to focus on the main types of interactions.

## 1. Connection Setup (Handshake & Connect)

The process begins by establishing a secure connection and identifying the client.

### Send Handshake (Sent)

- **Purpose:** Initiate the "handshake" process with the server, announcing the version and supported connection types.
- **Structure:**

```json
[
  {
    "id": "1",
    "version": "1.0",
    "minimumVersion": "1.0",
    "channel": "/meta/handshake",
    "supportedConnectionTypes": [
      "websocket",
      "long-polling",
      "callback-polling"
    ],
    "advice": {
      "timeout": 60000,
      "interval": 0
    },
    "ext": {
      "ack": true,
      "timesync": {
        "tc": 1736434632999,
        "l": 0,
        "o": 0
      }
    }
  }
]
```

### Receive Handshake Response (Received)

- **Purpose:** Response from the server, confirming successful handshake and providing a `clientId` to the client.
- **Structure:**

```json
[
  {
    "ext": {
      "timesync": {
        "p": 0,
        "a": -1619,
        "tc": 1736434632999,
        "ts": 1736434634618
      },
      "ack": true
    },
    "minimumVersion": "1.0",
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht", // Assigned Client ID
    "supportedConnectionTypes": [
      "websocket",
      "long-polling",
      "callback-polling"
    ],
    "advice": {
      "interval": 0,
      "timeout": 30000,
      "reconnect": "retry"
    },
    "channel": "/meta/handshake",
    "id": "1",
    "version": "1.0",
    "successful": true // Handshake successful
  }
]
```

### Send Connect (Sent)

- **Purpose:** Request formal connection after handshake, using the received `clientId`.
- **Structure:**

```json
[
  {
    "id": "2",
    "channel": "/meta/connect",
    "connectionType": "websocket",
    "advice": {
      "timeout": 0
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {
      "ack": 0,
      "timesync": {
        "tc": 1736434634221,
        "l": 610,
        "o": 1010
      }
    }
  }
]
```

### Receive Connect Response (Received)

- **Purpose:** Confirm successful connection.
- **Structure:**

```json
[
  {
    "ext": {
      "ack": 1
    },
    "advice": {
      "interval": 0,
      "timeout": 30000,
      "reconnect": "retry"
    },
    "channel": "/meta/connect",
    "id": "2",
    "successful": true // Connection successful
  }
]
```

_(Note: Subsequent `/meta/connect` messages (Sent/Received) with different `ack` and `timesync` values are used to maintain the connection and synchronize time, but have similar structures and have been omitted)_

## 2. Game Initialization and State

After connecting, the Host begins initializing the game service.

### Send Start Player Service (Sent)

- **Purpose:** Inform the server that the player service is ready to operate.
- **Structure:**

```json
[
  {
    "id": "3",
    "channel": "/service/player",
    "data": {
      "type": "started", // Message type: service has started
      "gameid": "940367",
      "host": "play.kahoot.it"
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Start Player Service Response (Received)

- **Purpose:** Server confirms receipt of the service start request.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434635046 // Server timestamp
    },
    "channel": "/service/player",
    "id": "3",
    "successful": true
  }
]
```

### Receive Game Status Notification (Received)

- **Purpose:** Server sends the current game status to the Host.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434635046
    },
    "data": {
      "type": "start", // Message type: start/current status
      "config": "{}",
      "status": "ACTIVE" // Game status: Active
    },
    "channel": "/service/player"
  }
]
```

## 3. Player Join

When a player joins the game from their device.

### Receive Player Join Notification (Received)

- **Purpose:** Server informs the Host that a new player has joined.
- **Structure:** (`/controller/{gameid}`)

```json
[
  {
    "ext": {
      "timetrack": 1736434654968
    },
    "data": {
      "name": "Alice", // Player name
      "type": "joined", // Event type: join
      "content": "{\"device\":{\"userAgent\":\"...\",\"screen\":{\"width\":1536,\"height\":864}}}", // Device info (JSON string)
      "cid": "777842842", // Player ID (controller ID)
      "status": "VERIFIED"
    },
    "channel": "/controller/940367"
  }
]
```

### Send Details to Player (Sent)

- **Purpose:** Host sends additional game and host information to the player who just joined.
- **Structure:** (`/service/player`, `data.id = 14`)

```json
[
  {
    "id": "6",
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "777842842", // Receiving player ID
      "id": 14, // Content type: Host/game info for player
      "content": "{\"playerName\":\"Alice\",\"hostPrimaryUsage\":\"teacher\",\"hostPrimaryUsageType\":\"SCHOOL\",...}" // Details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Details (Received)

- **Purpose:** Confirm message `id=6` was sent successfully.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434655398
    },
    "channel": "/service/player",
    "id": "6",
    "successful": true
  }
]
```

### Receive Namerator Configuration from Player (Received)

- **Purpose:** Player sends information about whether Namerator is being used.
- **Structure:** (`/controller/{gameid}`, `data.id = 16`)

```json
[
  {
    "ext": {
      "timetrack": 1736434655428
    },
    "data": {
      "gameid": "940367",
      "id": 16, // Content type: Namerator configuration
      "type": "message",
      "content": "{\"usingNamerator\":false}", // Content (JSON string)
      "cid": "777842842"
    },
    "channel": "/controller/940367"
  }
]
```

### Send Avatar/Status Information to Player (Sent)

- **Purpose:** Host sends information about avatar, status, and other configurations to the player.
- **Structure:** (`/service/player`, `data.id = 17`)

```json
[
  {
    "id": "8",
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "777842842",
      "id": 17, // Content type: Status/avatar information
      "content": "{\"data\":{},\"stableIdentifier\":\"...\",\"isHighContrast\":false,\"loginState\":3,...}" // Details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Avatar/Status Information (Received)

- **Purpose:** Confirm message `id=8` was sent successfully.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434655750
    },
    "channel": "/service/player",
    "id": "8",
    "successful": true
  }
]
```

_(Note: A similar flow repeats when player "Bob" joins)_

## 4. Start Game Round (Game Blocks)

Host prepares and starts the questions (game blocks).

### Send Game Blocks Overview (Sent)

- **Purpose:** Send information about the total number of questions and the structure of upcoming questions.
- **Structure:** (`/service/player`, `data.id = 9`)

```json
[
  {
    "id": "14",
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "id": 9, // Content type: Game Blocks Overview
      "content": "{\"extensiveMode\":true,\"gameBlockCount\":15,\"upcomingGameBlockData\":[{\"type\":\"quiz\",\"layout\":\"CLASSIC\"},...]}" // Details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Overview (Received)

- **Purpose:** Confirm message `id=14` was sent successfully.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434705770
    },
    "channel": "/service/player",
    "id": "14",
    "successful": true
  }
]
```

## 5. Display Question

Host sends the detailed information for each question.

### Send Get Ready Screen (Sent)

- **Purpose:** Display the "Get Ready" screen before the question timer starts.
- **Structure:** (`/service/player`, `data.id = 1`)

```json
[
  {
    "id": "16",
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "id": 1, // Content type: Start/Prepare question
      "content": "{\"gameBlockIndex\":0,\"totalGameBlockCount\":15,\"layout\":\"CLASSIC\",\"title\":\"In Vietnamese history...\",\"type\":\"quiz\",\"timeAvailable\":20000,\"choices\":[...],\"getReadyTimeAvailable\":4000,\"getReadyTimeRemaining\":4000,...}" // Question details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Get Ready Screen (Received)

- **Purpose:** Confirm message `id=16` was sent successfully.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434721101
    },
    "channel": "/service/player",
    "id": "16",
    "successful": true
  }
]
```

### Send Question Display Screen (Sent)

- **Purpose:** Display the question and start the answer countdown timer.
- **Structure:** (`/service/player`, `data.id = 2`)

```json
[
  {
    "id": "17",
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "id": 2, // Content type: Display question
      "content": "{\"gameBlockIndex\":0,\"totalGameBlockCount\":15,\"layout\":\"CLASSIC\",\"title\":\"In Vietnamese history...\",\"type\":\"quiz\",\"timeRemaining\":19991,\"timeAvailable\":20000,...}" // Question details with remaining time (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Question Screen (Received)

- **Purpose:** Confirm message `id=17` was sent successfully.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434725220
    },
    "channel": "/service/player",
    "id": "17",
    "successful": true
  }
]
```

## 6. Receive Player Answers

Host receives notifications when players submit answers.

### Receive Answer (Received)

- **Purpose:** Server forwards the player's answer to the Host.
- **Structure:** (`/controller/{gameid}`, `data.id = 45`)

```json
[
  {
    "ext": {
      "timetrack": 1736434727580
    },
    "data": {
      "gameid": "940367",
      "id": 45, // Content type: Answer from player
      "type": "message",
      "content": "{\"type\":\"quiz\",\"choice\":0,\"questionIndex\":0}", // Answer content (JSON string)
      "cid": "777842842" // ID of the player who answered
    },
    "channel": "/controller/940367"
  }
]
```

_(Note: Host receives this message for each player who answers)_

## 7. Send Question Results

After time is up or all players have answered, Host sends results to each player.

### Send Result and Rank (Sent)

- **Purpose:** Send feedback on correctness, score, and rank to each player after each question.
- **Structure:** (`/service/player`, `data.id = 8`) - _This message often contains an array of objects, one for each player._

```json
[
  {
    "id": "20", // Message ID for player "Bob"
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "479509131", // Player Bob
      "id": 8, // Content type: Answer result
      "content": "{\"rank\":1,\"totalScore\":831,\"pointsData\":{...},\"hasAnswer\":true,\"choice\":1,\"points\":831,\"correctChoices\":[1],\"text\":\"18\",\"type\":\"quiz\",\"isCorrect\":true}" // Result details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  },
  {
    "id": "21", // Message ID for player "Alice"
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "777842842", // Player Alice
      "id": 8, // Content type: Answer result
      "content": "{\"rank\":2,\"totalScore\":0,\"pointsData\":{...},\"nemesis\":{\"name\":\"Bob\",...},\"hasAnswer\":true,\"choice\":0,\"points\":0,\"correctChoices\":[1],\"text\":\"17\",\"type\":\"quiz\",\"isCorrect\":false}" // Result details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Results (Received)

- **Purpose:** Confirm the result messages (`id=20`, `id=21`) were sent successfully.
- **Structure:** _(Often received as an array of responses)_

```json
[
  {
    "ext": {
      "timetrack": 1736434732458
    },
    "channel": "/service/player",
    "id": "20",
    "successful": true
  },
  {
    "ext": {
      "timetrack": 1736434732458
    },
    "channel": "/service/player",
    "id": "21",
    "successful": true
  }
]
```

_(Note: Steps 5 through 7 repeat for each question in the game)_

## 8. End Game

After the final question, the Host sends summary information and the podium.

### Send Podium/End Information (Sent)

- **Purpose:** Send final ranking information, medals, total scores to players.
- **Structure:** (`/service/player`, `data.id = 13`) - _Similar to step 7, sent to each player._

```json
[
  {
    "id": "106", // Message for player "Bob"
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "479509131", // Player Bob
      "id": 13, // Content type: Final result/Podium
      "content": "{\"revealDelay\":13700,\"rank\":1,\"podiumMedalType\":\"gold\",\"startTime\":...,\"quizTitle\":\"Duplicate of Demo\",...,\"correctCount\":10,\"incorrectCount\":5,\"totalScore\":10630}" // Details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  },
  {
    "id": "107", // Message for player "Alice"
    "channel": "/service/player",
    "data": {
      "gameid": "940367",
      "type": "message",
      "host": "play.kahoot.it",
      "cid": "777842842", // Player Alice
      "id": 13, // Content type: Final result/Podium
      "content": "{\"revealDelay\":7700,\"rank\":2,\"podiumMedalType\":\"silver\",\"startTime\":...,\"quizTitle\":\"Duplicate of Demo\",...,\"correctCount\":4,\"incorrectCount\":11,\"totalScore\":4506}" // Details (JSON string)
    },
    "clientId": "683eh5i20l77hu4jg1dtoz6z7st4ht",
    "ext": {}
  }
]
```

### Receive Response for Sending Podium/End Information (Received)

- **Purpose:** Confirm the end game messages (`id=106`, `id=107`) were sent successfully.
- **Structure:**

```json
[
  {
    "ext": {
      "timetrack": 1736434943727
    },
    "channel": "/service/player",
    "id": "106",
    "successful": true
  },
  {
    "ext": {
      "timetrack": 1736434943727
    },
    "channel": "/service/player",
    "id": "107",
    "successful": true
  }
]
```

## 9. Maintaining Connection Post-Game

The `/meta/connect` connection continues to be maintained for some time after the game ends.

_(`/meta/connect` Sent/Received messages continue to appear to keep the connection alive)_

---
