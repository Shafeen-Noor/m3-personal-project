import type { Day, PlanId, SavedPlan } from "./types.ts"

const planIds: PlanId[] = ["outside", "creative", "rest", "social"]
const days: Day[] = ["Saturday", "Sunday"]

export function isSavedPlan(value: unknown): value is SavedPlan {
  if (typeof value !== "object" || value === null) return false

  if (!("plan" in value) || !isPlanId(value.plan)) return false
  if (
    !("days" in value) ||
    !Array.isArray(value.days) ||
    !value.days.every(isDay)
  ) {
    return false
  }
  if (!("indoor" in value) || typeof value.indoor !== "boolean") return false

  return (
    !("note" in value) ||
    value.note === undefined ||
    typeof value.note === "string"
  )
}

function isPlanId(value: unknown): value is PlanId {
  return planIds.some((planId) => planId === value)
}

function isDay(value: unknown): value is Day {
  return days.some((day) => day === value)
}

export function loadSavedPlan(raw: string): SavedPlan {
  let value: unknown

  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error("Saved plan data is not valid JSON")
  }

  if (!isSavedPlan(value)) {
    throw new Error("Saved plan data is invalid")
  }

  return value
}
