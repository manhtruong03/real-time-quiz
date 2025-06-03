**1. Illustrative JSON Snippets for Each Question Type**

Here are example JSON objects quoted directly from the provided string for each identified question type:

- **`content`**:

  ```json
  {
    "type": "content",
    "title": "Get ready to wrap up 2019 and enter a new decade!",
    "description": "Let's take a tour of everything exciting that happened in 2019, and test how much you paid attention! Get ready in 3...2...1...!",
    "image": "https://media.kahoot.it/16cb820f-c510-49ba-8a97-ca121c828a87",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

- **`jumble`**:

  ```json
  {
    "type": "jumble",
    "question": "Let's start with science! Place these space events in order:",
    "time": 60000,
    "pointsMultiplier": 1,
    "choices": [
      {
        "answer": "Food grown in space eaten",
        "correct": true
      },
      {
        "answer": "Soft landing on the far side of the moon",
        "correct": true
      },
      {
        "answer": "NASA announces International Space Station will open to  tourists",
        "correct": true
      },
      {
        "answer": "All female space walk",
        "correct": true
      }
    ],
    "image": "https://media.kahoot.it/f3a2ced4-2a00-4125-b791-9e5621faa001",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

- **`quiz (2 choices)`**:

  ```json
  {
    "type": "quiz",
    "question": "<b>True or false </b>-<b> </b>The Beyond Meat fried chicken at a KFC in Atlanta, GA, sold out 5 hours after launch.",
    "time": 20000,
    "pointsMultiplier": 1,
    "choices": [
      {
        "answer": "True",
        "correct": true
      },
      {
        "answer": "False",
        "correct": false
      }
    ],
    "image": "https://media.kahoot.it/290addae-7ff9-4cff-804f-d9354f7e46ac",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

- **`quiz (4 choices)`**:

  ```json
  {
    "type": "quiz",
    "question": "Which of the below is one thing quantum computers <b>can't</b> do?",
    "time": 30000,
    "pointsMultiplier": 1,
    "choices": [
      {
        "answer": "Help us search for Earth-like planets",
        "correct": false
      },
      {
        "answer": "Break mainstream cryptosystems used for data security",
        "correct": false
      },
      {
        "answer": "Potentially cure Alzheimer’s disease",
        "correct": false
      },
      {
        "answer": "Replace world leaders",
        "correct": true
      }
    ],
    "image": "https://media.kahoot.it/37def5d0-4652-4c2f-a5a8-f0c5f8f28c2c",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

- **`quiz (image choices)`**:

  ```json
  {
    "type": "quiz",
    "question": "Find the flag of <b>Switzerland.</b>",
    "time": 20000,
    "pointsMultiplier": 1,
    "choices": [
      {
        "correct": true,
        "image": {
          "id": "588f9aff-82f1-473d-ac0b-560511c71fe5",
          "altText": "swiss flag",
          "contentType": "image/jpeg",
          "origin": "Getty Images",
          "externalRef": "186294962",
          "resources": "flowgraph/iStock/Getty Images",
          "width": 4000,
          "height": 2400
        }
      },
      {
        "correct": false,
        "image": {
          "id": "72f30900-7645-4eaa-8b41-353f41992716",
          "altText": "austrian flag",
          "contentType": "image/jpeg",
          "origin": "Getty Images",
          "externalRef": "458891415",
          "resources": "flowgraph/iStock/Getty Images",
          "width": 4000,
          "height": 2400
        }
      },
      {
        "correct": false,
        "image": {
          "id": "b9f8a9fb-4002-437e-9aae-097e1a3a776e",
          "altText": "Graphic of the blue and yellow Swedish national flag",
          "contentType": "image/jpeg",
          "origin": "Getty Images",
          "externalRef": "459675087",
          "resources": "flowgraph/iStock/Getty Images",
          "width": 4000,
          "height": 2400
        }
      },
      {
        "correct": false,
        "image": {
          "id": "999be536-7566-445b-a695-ec203049382f",
          "altText": "Flat Flag of Albania",
          "contentType": "image/jpeg",
          "origin": "Getty Images",
          "externalRef": "607745642",
          "resources": "MicroStockHub/iStock/Getty Images",
          "width": 2048,
          "height": 1463
        }
      }
    ],
    "image": "https://media.kahoot.it/53154f05-eab7-4c56-8772-866b131ee2c4",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

- **`survey`**:

  ```json
  {
    "type": "survey",
    "question": "What's your top movie choice from these all-time classics?",
    "time": 20000,
    "choices": [
      {
        "answer": "The Godfather",
        "correct": true
      },
      {
        "answer": "Pulp Fiction",
        "correct": true
      },
      {
        "answer": "Star Wars",
        "correct": true
      },
      {
        "answer": "Forrest Gump",
        "correct": true
      }
    ],
    "image": "https://media.kahoot.it/76df82c1-b762-496c-8e45-a4c5aff89f63",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

- **`open_ended`**:
  ```json
  {
    "type": "open_ended",
    "question": "Final question and double points! What was Pantone's color of 2019?",
    "time": 30000,
    "pointsMultiplier": 2,
    "choices": [
      {
        "answer": "Living Coral",
        "correct": true
      }
    ],
    "image": "https://media.kahoot.it/754dc179-c090-4a8d-8404-0e705d813821",
    "video": {
      "startTime": 0.0,
      "endTime": 0.0,
      "service": "youtube",
      "fullUrl": ""
    },
    "media": []
  }
  ```

**2. Comparison Table**

This table shows the fields identified in the general structure (vertical header) and indicates which question types (horizontal header) typically include that field. An entry in the cell indicates the presence of the field for that type.

| Field              | `content`   | `jumble`         | `quiz`           | `survey` | `open_ended`     |
| :----------------- | :---------- | :--------------- | :--------------- | :------- | :--------------- |
| **`type`**         | type        | type             | type             | type     | type             |
| `title`            | title       |                  |                  |          |                  |
| `description`      | description |                  |                  |          |                  |
| `question`         |             | question         | question         | question | question         |
| `time`             |             | time             | time             | time     | time             |
| `pointsMultiplier` |             | pointsMultiplier | pointsMultiplier |          | pointsMultiplier |
| `choices`          |             | choices          | choices          | choices  | choices          |
| `image`            | image       | image            | image            | image    | image            |
| `video`            | video       | video            | video            | video    | video            |
| `media`            | media       | media            | media            | media    | media            |
