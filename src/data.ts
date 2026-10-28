import type { PlanChoice, PlanningStep, WeekendPlan } from "./types.ts"

export const plans: WeekendPlan[] = [
  {
    id: "outside",
    title: "Fresh Air Plan",
    description: "A relaxed outdoor block with time left over.",
    schedule: [
      { day: "Saturday", time: "10:00", name: "Walk at the park" },
      { day: "Saturday", time: "12:00", name: "Lunch nearby" },
      { day: "Sunday", time: "11:00", name: "Visit the local market" },
    ],
  },
  {
    id: "creative",
    title: "Make Something Plan",
    description: "A calm block for a small project and a short break.",
    schedule: [
      { day: "Saturday", time: "10:00", name: "Pick a small project" },
      { day: "Saturday", time: "11:00", name: "Make or cook something" },
      { day: "Sunday", time: "15:00", name: "Read or sketch" },
    ],
  },
  {
    id: "rest",
    title: "Slow Weekend Plan",
    description: "A light schedule with plenty of room to rest.",
    schedule: [
      { day: "Saturday", time: "11:00", name: "Have a slow breakfast" },
      { day: "Saturday", time: "15:00", name: "Read or listen to music" },
      { day: "Sunday", time: "16:00", name: "Get ready for the week" },
    ],
  },
  {
    id: "social",
    title: "Meet Up Plan",
    description: "A simple plan with time to see someone.",
    schedule: [
      { day: "Saturday", time: "11:00", name: "Get coffee with a friend" },
      { day: "Saturday", time: "17:00", name: "Play a game together" },
      { day: "Sunday", time: "13:00", name: "Share lunch" },
    ],
  },
]

export const timeChoices: PlanChoice[] = [
  { label: "A few hours outside", plan: "outside", points: 3 },
  { label: "A short creative block", plan: "creative", points: 3 },
  { label: "A quiet day at home", plan: "rest", points: 3 },
  { label: "Time with friends", plan: "social", points: 3 },
]

export const planningSteps: PlanningStep[] = [
  {
    kind: "time",
    text: "How would you like to spend your free time?",
    choices: timeChoices,
  },
  {
    kind: "energy",
    text: "How much energy do you want to spend?",
    low: "very little",
    high: "a lot",
    lowPlan: "rest",
    highPlan: "outside",
  },
  {
    kind: "indoors",
    text: "Would you like an indoor option in case of rain?",
    yesPlan: "rest",
    noPlan: "outside",
  },
]
