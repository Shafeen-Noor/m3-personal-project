import type { Day, PlanId, SavedPlan } from "./types.ts"

const planIds: PlanId[] = ["outside", "creative", "rest", "social"]
const days: Day[] = ["Saturday", "Sunday"]

export function isSavedPlan(value: unknown): value is SavedPlan {
  if (typeof value !== "object" || value === null) return false

  const plan = value as Record<string, unknown>
  return (
    typeof plan.plan === "string" &&
    planIds.includes(plan.plan as PlanId) &&
    Array.isArray(plan.days) &&
    plan.days.every((day: unknown) => days.includes(day as Day)) &&
    typeof plan.indoor === "boolean" &&
    (plan.note === undefined || typeof plan.note === "string")
  )
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
