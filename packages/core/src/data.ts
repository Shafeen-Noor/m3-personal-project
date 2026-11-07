import { readFile } from "node:fs/promises"
import type { PlanChoice, PlanningStep, WeekendPlan } from "./planner/types.ts"

const planIds = ["outside", "creative", "rest", "social"]
const days = ["Saturday", "Sunday"]

export async function loadPlans(): Promise<WeekendPlan[]> {
  let raw: string
  try {
    raw = await readFile(new URL("./plans.json", import.meta.url), "utf8")
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      throw new Error("Weekend plan data file is missing")
    }
    throw new Error("Could not read weekend plan data")
  }

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error("Weekend plan data is not valid JSON")
  }

  if (!Array.isArray(value) || !value.every(isWeekendPlan)) {
    throw new Error("Weekend plan data has an invalid shape")
  }
  return value
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isWeekendPlan(value: unknown): value is WeekendPlan {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    planIds.includes(value.id) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.schedule) &&
    value.schedule.every(isActivity)
  )
}

function isActivity(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.day === "string" &&
    days.includes(value.day) &&
    typeof value.time === "string" &&
    /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value.time) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0
  )
}
