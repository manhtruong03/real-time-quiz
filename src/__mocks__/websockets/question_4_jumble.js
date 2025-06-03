// WS Message Detail: Jumble Question (Index 4)
// Sent from Host -> Player
export default {
    gameBlockIndex: 4,
    totalGameBlockCount: 7,
    title: "Place these frontend technologies in alphabetical order:",
    video: { startTime: 0, endTime: 0, service: "youtube", fullUrl: "" },
    image: "https://placehold.co/600x400/teal/white?text=Jumble",
    media: [],
    type: "jumble",
    timeRemaining: 60000,
    timeAvailable: 60000,
    numberOfAnswersAllowed: 1, // Player submits one ordered sequence
    currentQuestionAnswerCount: 0,
    pointsMultiplier: 1,
    numberOfChoices: 4,
    // Choices sent to player - The host should randomize these before sending!
    // This example shows one possible randomized order the player might receive.
    // Original correct order was: [Next.js, React, Tailwind CSS, Zod]
    choices: [
        { answer: "Tailwind CSS" }, // Original index 2
        { answer: "Next.js" },      // Original index 0
        { answer: "Zod" },          // Original index 3
        { answer: "React" }        // Original index 1
    ],
    getReadyTimeAvailable: 5000,
    getReadyTimeRemaining: 5000,
    questionIndex: 4,
    gameBlockType: "jumble"
};