// WS Message Detail: Quiz 4-Choice Text (Index 2)
// Sent from Host -> Player
export default {
    gameBlockIndex: 2,
    totalGameBlockCount: 7,
    title: "Which technology is NOT part of the frontend stack mentioned?",
    video: { startTime: 0, endTime: 0, service: "youtube", fullUrl: "" },
    image: "https://placehold.co/600x400/purple/white?text=4-Choice+Quiz",
    media: [],
    type: "quiz",
    timeRemaining: 30000,
    timeAvailable: 30000,
    numberOfAnswersAllowed: 1,
    currentQuestionAnswerCount: 0,
    pointsMultiplier: 1,
    numberOfChoices: 4,
    // Choices sent to player (no 'correct' field)
    choices: [
        { answer: "Next.js" },
        { answer: "Tailwind CSS" },
        { answer: "Python/Django" },
        { answer: "React Hook Form" }
    ],
    getReadyTimeAvailable: 5000,
    getReadyTimeRemaining: 5000,
    questionIndex: 2,
    gameBlockType: "quiz"
};