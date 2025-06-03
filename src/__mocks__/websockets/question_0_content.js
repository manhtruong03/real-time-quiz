// WS Message Detail: Content slide (Index 0)
// Sent from Host -> Player
export default {
    gameBlockIndex: 0,
    totalGameBlockCount: 7, // Total questions in this mock quiz
    title: "Welcome to the All-Types Sample Quiz!",
    video: { startTime: 0, endTime: 0, service: "youtube", fullUrl: "" },
    image: "https://placehold.co/600x400/blue/white?text=Welcome",
    media: [],
    type: "content",
    description: "We will go through Content, Quiz (True/False, 4-Choice, Image), Jumble, Survey, and Open-Ended questions. Get ready!",
    // --- ADDED Missing Time Fields ---
    timeAvailable: 0, // Content blocks typically aren't timed
    timeRemaining: 0,
    numberOfAnswersAllowed: 0, // Content blocks don't have answers
    pointsMultiplier: 0, // Content blocks don't award points
    // --- END ADD ---
    // Timing for the "Get Ready" screen before the question/content appears
    getReadyTimeAvailable: 5000,
    getReadyTimeRemaining: 5000,
    questionIndex: 0,
    gameBlockType: "content" // Corresponds to 'type'
};