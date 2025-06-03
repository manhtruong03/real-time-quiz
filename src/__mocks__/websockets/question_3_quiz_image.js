// WS Message Detail: Quiz 4-Choice Image (Index 3)
// Sent from Host -> Player
export default {
    gameBlockIndex: 3,
    totalGameBlockCount: 7,
    title: "Which shape is a square?",
    video: { startTime: 0, endTime: 0, service: "youtube", fullUrl: "" },
    image: "https://placehold.co/600x400/grey/white?text=Image+Quiz",
    media: [],
    type: "quiz",
    timeRemaining: 20000,
    timeAvailable: 20000,
    numberOfAnswersAllowed: 1,
    currentQuestionAnswerCount: 0,
    pointsMultiplier: 1,
    numberOfChoices: 4,
    // Choices sent to player (no 'correct' field)
    choices: [
        { image: { id: "img-circle", altText: "A Circle", contentType: "image/png", url: "https://placehold.co/200x200/red/white?text=Circle" } },
        { image: { id: "img-square", altText: "A Square", contentType: "image/png", url: "https://placehold.co/200x200/blue/white?text=Square" } },
        { image: { id: "img-triangle", altText: "A Triangle", contentType: "image/png", url: "https://placehold.co/200x200/green/white?text=Triangle" } },
        { image: { id: "img-rectangle", altText: "A Rectangle", contentType: "image/png", url: "https://placehold.co/300x200/yellow/black?text=Rectangle" } }
    ],
    getReadyTimeAvailable: 5000,
    getReadyTimeRemaining: 5000,
    questionIndex: 3,
    gameBlockType: "quiz"
};