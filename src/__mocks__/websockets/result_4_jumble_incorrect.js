// WS Result Detail: Jumble Question (Question 4) - INCORRECT
// Sent from Host -> Player
export default {
    rank: 1,
    totalScore: 1680, // Score remains the same
    pointsData: {
        totalPointsWithBonuses: 1680,
        questionPoints: 0,
        answerStreakPoints: { streakLevel: 0, previousStreakLevel: 1 }, // Streak broken
        lastGameBlockIndex: 4
    },
    hasAnswer: true,
    choice: [1, 3, 0, 2], // Player's submitted order indices (relative to received order)
    // Correct choices MUST be indices relative to the ORIGINAL (Phase 1) order
    // Original: [Next.js(0), React(1), Tailwind(2), Zod(3)]
    correctChoices: [0, 1, 2, 3],
    points: 0,
    isCorrect: false,
    // Text could represent player's order or just state incorrect
    text: "Next.js|React|Tailwind CSS|Zod", // Example: Showing the text for the player's submitted order
    type: "jumble"
};