// WS Answer Detail: Jumble Question (Question 4)
// Player submits their ordered sequence based on the choices they received.
// Received order was [Tailwind(2), Next.js(0), Zod(3), React(1)]
// Player attempts alphabetical order: [Next.js, React, Tailwind, Zod]
// So they map back to the indices of the RECEIVED array: [1, 3, 0, 2]
// This submitted order is INCORRECT based on the original definition.
// Sent from Player -> Host
export default { type: "jumble", choice: [1, 3, 0, 2], questionIndex: 4 };