// Mock data for the entire quiz structure, fetched initially via REST API.
// Contains one example of each question type.
export default {
    uuid: "mock-quiz-1234-all-types-abcd",
    creator: "mock-user-id-5678",
    creator_username: "MockUser",
    visibility: 1, // 1 typically means public
    title: "Sample Quiz - All Question Types",
    description: "This quiz contains one example of each question type for frontend mocking purposes.",
    quizType: "quiz",
    cover: "https://placehold.co/600x400/orange/white?text=Sample+Quiz+Cover",
    lobby_video: {
        youtube: { id: "", startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" }
    },
    questions: [
        // --- Question 0: content ---
        // Informational slide, no choices, no scoring.
        {
            id: "question-uuid-001",
            type: "content",
            title: "Welcome to the All-Types Sample Quiz!",
            description: "We will go through Content, Quiz (True/False, 4-Choice, Image), Jumble, Survey, and Open-Ended questions. Get ready!",
            image: "https://placehold.co/600x400/blue/white?text=Welcome",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: [] // Array for additional media elements if any
        },
        // --- Question 1: quiz (2 choices - True/False) ---
        {
            id: "question-uuid-002",
            type: "quiz",
            question: "<b>True or False:</b> Mock data helps frontend development.",
            time: 20000, // Time limit in milliseconds
            pointsMultiplier: 1, // Standard points
            choices: [
                { answer: "True", correct: true }, // correct: true indicates this is the right answer
                { answer: "False", correct: false }
            ],
            image: "https://placehold.co/600x400/green/white?text=True+or+False",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: []
        },
        // --- Question 2: quiz (4 choices - Text) ---
        {
            id: "question-uuid-003",
            type: "quiz",
            question: "Which technology is NOT part of the frontend stack mentioned?",
            time: 30000,
            pointsMultiplier: 1,
            choices: [
                { answer: "Next.js", correct: false },
                { answer: "Tailwind CSS", correct: false },
                { answer: "Python/Django", correct: true }, // The correct answer
                { answer: "React Hook Form", correct: false }
            ],
            image: "https://placehold.co/600x400/purple/white?text=4-Choice+Quiz",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: []
        },
        // --- Question 3: quiz (4 choices - Image) ---
        {
            id: "question-uuid-004",
            type: "quiz",
            question: "Which shape is a square?",
            time: 20000,
            pointsMultiplier: 1,
            choices: [
                {
                    image: { id: "img-circle", altText: "A Circle", contentType: "image/png", url: "https://placehold.co/200x200/red/white?text=Circle" },
                    correct: false
                },
                {
                    image: { id: "img-square", altText: "A Square", contentType: "image/png", url: "https://placehold.co/200x200/blue/white?text=Square" },
                    correct: true // The correct image choice
                },
                {
                    image: { id: "img-triangle", altText: "A Triangle", contentType: "image/png", url: "https://placehold.co/200x200/green/white?text=Triangle" },
                    correct: false
                },
                {
                    image: { id: "img-rectangle", altText: "A Rectangle", contentType: "image/png", url: "https://placehold.co/300x200/yellow/black?text=Rectangle" },
                    correct: false
                }
            ],
            image: "https://placehold.co/600x400/grey/white?text=Image+Quiz",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: []
        },
        // --- Question 4: jumble ---
        // Player needs to order these items correctly.
        // The 'correct' field is always true; the correct order is defined by the array sequence here.
        {
            id: "question-uuid-005",
            type: "jumble",
            question: "Place these frontend technologies in alphabetical order:",
            time: 60000,
            pointsMultiplier: 1,
            choices: [
                // Correct order (alphabetical)
                { answer: "Next.js", correct: true },      // Index 0
                { answer: "React", correct: true },        // Index 1
                { answer: "Tailwind CSS", correct: true }, // Index 2
                { answer: "Zod", correct: true }          // Index 3
            ],
            image: "https://placehold.co/600x400/teal/white?text=Jumble",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: []
        },
        // --- Question 5: survey ---
        // Poll question, no single correct answer for scoring.
        // correct:true just means it's a valid selectable option.
        {
            id: "question-uuid-006",
            type: "survey",
            question: "Which CSS framework do you prefer?",
            time: 20000,
            choices: [
                { answer: "Tailwind CSS", correct: true },
                { answer: "Bootstrap", correct: true },
                { answer: "Material UI (MUI)", correct: true },
                { answer: "None/Other", correct: true }
            ],
            image: "https://placehold.co/600x400/indigo/white?text=Survey",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: []
        },
        // --- Question 6: open_ended ---
        // Player types the answer.
        {
            id: "question-uuid-007",
            type: "open_ended",
            question: "What package manager is used in this project? (Hint: starts with 'p')",
            time: 30000,
            pointsMultiplier: 2, // Example of double points
            choices: [
                // Defines the acceptable correct answer(s) for validation by the host.
                { answer: "pnpm", correct: true }
                // Could add more entries here if variations like "PNPM" are also acceptable.
            ],
            image: "https://placehold.co/600x400/brown/white?text=Open+Ended",
            video: { startTime: 0.0, endTime: 0.0, service: "youtube", fullUrl: "" },
            media: []
        }
    ],
    isValid: true,
    playAsGuest: true, // Allow guests for easy mocking
    type: "quiz",
    created: 1678886400000, // Example timestamp (Unix milliseconds)
    modified: 1745286000000 // Example timestamp
};