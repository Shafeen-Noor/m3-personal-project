import type { Question, WeekendPlan } from "./types.ts"

export const plans: WeekendPlan[] = [
  {
    id: "outdoors",
    title: "Get Outside",
    description: "Spend some of the weekend out in the fresh air.",
    activities: ["walk", "market", "park"],
    indoor: false,
  },
  {
    id: "creative",
    title: "Make Something",
    description: "Try a small project and enjoy the process.",
    activities: ["sketch", "cook", "write"],
    indoor: true,
  },
  {
    id: "relax",
    title: "Take It Easy",
    description: "Keep the plan calm and leave room for a reset.",
    activities: ["read", "rest", "music"],
    indoor: true,
  },
  {
    id: "social",
    title: "Meet Up",
    description: "Share a simple activity with someone you like.",
    activities: ["coffee", "game", "dinner"],
    indoor: true,
  },
]

export const questions: Question[] = [
  {
    kind: "choice",
    text: "What sounds good for Saturday?",
    choices: [
      { label: "A long walk", plan: "outdoors", points: 3 },
      { label: "A small creative project", plan: "creative", points: 3 },
      { label: "A slow morning with a book", plan: "relax", points: 2 },
      { label: "Coffee with a friend", plan: "social", points: 3 },
    ],
  },
  {
    kind: "scale",
    text: "How much energy do you want to spend?",
    plan: "outdoors",
    low: "very little",
    high: "a lot",
  },
  {
    kind: "yesno",
    text: "Would you like to make time for friends?",
    plan: "social",
  },
]
