// WS Result Detail: Open Ended Question (Question 6) - CORRECT
// Sent from Host -> Player
export default {
    rank: 1,
    totalScore: 3500, // Score increases with double points (e.g., 1680 + 910*2 = 3500)
    pointsData: {
        totalPointsWithBonuses: 3500,
        questionPoints: 1820, // Base points * pointsMultiplier (2)
        answerStreakPoints: { streakLevel: 1, previousStreakLevel: 0 }, // New streak started
        lastGameBlockIndex: 6
    },
    hasAnswer: true,
    points: 1820, // Points awarded for this question (including multiplier)
    // 'choice' field might not be relevant here, or could use a special value
    // Host determines correctness based on 'text' vs 'correctTexts'
    isCorrect: true,
    text: "pnpm", // Player's submitted text
    type: "open_ended",
    correctTexts: ["pnpm"] // Array of acceptable correct answers
};