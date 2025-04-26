// WS Message Detail: Quiz True/False (Index 1)
// Sent from Host -> Player
export default {
    gameBlockIndex: 1,
    totalGameBlockCount: 7,
    title: "<b>True or False:</b> Mock data helps frontend development.",
    video: { startTime: 0, endTime: 0, service: "youtube", fullUrl: "" },
    image: "https://placehold.co/600x400/green/white?text=True+or+False",
    media: [],
    type: "quiz",
    // Timing for the actual question answering period
    timeRemaining: 20000, // Initial remaining time
    timeAvailable: 20000, // Total time allowed
    numberOfAnswersAllowed: 1, // Single choice question
    currentQuestionAnswerCount: 0, // How many players have answered (useful for host display)
    pointsMultiplier: 1,
    numberOfChoices: 2,
    // Choices sent to player DO NOT contain the 'correct' field
    choices: [
        { answer: "True" },
        { answer: "False" }
    ],
    getReadyTimeAvailable: 5000,
    getReadyTimeRemaining: 5000,
    questionIndex: 1,
    gameBlockType: "quiz"
};