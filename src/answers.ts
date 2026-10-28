import type { PlanChoice, PlanningAnswer, PlanningStep } from "./types.ts"

export interface Score {
  plan: PlanChoice["plan"]
  points: number
}

export function scorePreference(
  step: PlanningStep,
  answer: PlanningAnswer,
): Score {
  if (step.kind !== answer.kind) {
    throw new Error("The answer does not match the planning step")
  }

  if (step.kind === "time" && answer.kind === "time") {
    const choice = step.choices.find(
      (option) => option.label === answer.picked.label,
    )
    if (!choice) throw new Error("That time choice is not available")
    return { plan: choice.plan, points: choice.points }
  }

  if (step.kind === "energy" && answer.kind === "energy") {
    if (
      !Number.isInteger(answer.value) ||
      answer.value < 1 ||
      answer.value > 5
    ) {
      throw new Error("Choose an energy level from 1 to 5")
    }
    return answer.value <= 2
      ? { plan: step.lowPlan, points: 3 - answer.value }
      : { plan: step.highPlan, points: answer.value }
  }

  if (step.kind === "indoors" && answer.kind === "indoors") {
    return { plan: answer.value ? step.yesPlan : step.noPlan, points: 2 }
  }

  throw new Error("Unknown planning step")
}

export function formatPreference(
  step: PlanningStep,
  answer: PlanningAnswer,
): string {
  if (step.kind !== answer.kind) {
    throw new Error("The answer does not match the planning step")
  }

  if (step.kind === "time" && answer.kind === "time") {
    return `${step.text} ${answer.picked.label}`
  }

  if (step.kind === "energy" && answer.kind === "energy") {
    return `${step.text} ${answer.value}/5`
  }

  if (step.kind === "indoors" && answer.kind === "indoors") {
    return `${step.text} ${answer.value ? "Yes" : "No"}`
  }

  throw new Error("Unknown planning step")
}
