import type { PlanId, SavedPlan } from "./types.ts"

const planIds: PlanId[] = ["outdoors", "creative", "relax", "social"]

export function isSavedPlan(value: unknown): value is SavedPlan {
  if (typeof value !== "object" || value === null) return false
  const plan = value as Record<string, unknown>
  return (
    typeof plan.title === "string" &&
    typeof plan.plan === "string" &&
    planIds.some((id) => id === plan.plan) &&
    Array.isArray(plan.days) &&
    plan.days.every((day: unknown) => typeof day === "string") &&
    typeof plan.indoor === "boolean" &&
    (plan.note === undefined || typeof plan.note === "string")
  )
}

export function loadSavedPlan(raw: string): SavedPlan {
  const value: unknown = JSON.parse(raw)
  if (!isSavedPlan(value)) throw new Error("Saved plan data is invalid")
  return value
}
