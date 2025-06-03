// WS Message Detail: Survey Question (Index 5)
// Sent from Host -> Player
export default {
    gameBlockIndex: 5,
    totalGameBlockCount: 7,
    title: "Which CSS framework do you prefer?",
    video: { startTime: 0, endTime: 0, service: "youtube", fullUrl: "" },
    image: "https://placehold.co/600x400/indigo/white?text=Survey",
    media: [],
    type: "survey",
    timeRemaining: 20000,
    timeAvailable: 20000,
    numberOfAnswersAllowed: 1,
    currentQuestionAnswerCount: 0,
    // No pointsMultiplier for survey
    numberOfChoices: 4,
    // Choices sent to player
    choices: [
        { answer: "Tailwind CSS" },
        { answer: "Bootstrap" },
        { answer: "Material UI (MUI)" },
        { answer: "None/Other" }
    ],
    getReadyTimeAvailable: 5000,
    getReadyTimeRemaining: 5000,
    questionIndex: 5,
    gameBlockType: "survey"
};