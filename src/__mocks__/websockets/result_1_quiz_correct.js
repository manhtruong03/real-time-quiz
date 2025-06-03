// WS Result Detail: Quiz True/False (Question 1) - CORRECT
// Sent from Host -> Player
export default {
    rank: 1, // Example starting rank
    totalScore: 1750, // Example score for a correct answer (depends on speed calculation)
    pointsData: {
        totalPointsWithBonuses: 1750,
        questionPoints: 750, // Base points for this question
        answerStreakPoints: { streakLevel: 1, previousStreakLevel: 0 }, // Started a streak
        lastGameBlockIndex: 1 // Index of the question this result is for
    },
    hasAnswer: true, // Player answered
    choice: 0, // Player chose index 0 ("True")
    points: 750, // Points awarded for this question
    correctChoices: [0], // Index(es) of the correct choice(s)
    text: "True", // Text of the player's choice
    type: "quiz",
    isCorrect: true // Answer was correct
};