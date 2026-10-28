import type { ActivityOption, Answer, Question, PlanId } from "./types.ts"

export interface Points {
  plan: PlanId
  value: number
}

export function pointsFor(question: Question, answer: Answer): Points {
  if (question.kind !== answer.kind)
    throw new Error("Answer kind does not match")

  if (question.kind === "choice" && answer.kind === "choice") {
    const option = question.choices.find(
      (item) => item.label === answer.picked.label,
    )
    if (!option) throw new Error("That choice is not available")
    return { plan: option.plan, value: option.points }
  }

  if (question.kind === "scale" && answer.kind === "scale") {
    if (
      !Number.isInteger(answer.value) ||
      answer.value < 0 ||
      answer.value > 5
    ) {
      throw new Error("Choose a number from 0 to 5")
    }
    return { plan: question.plan, value: answer.value }
  }

  if (question.kind === "yesno" && answer.kind === "yesno") {
    return { plan: question.plan, value: answer.value ? 1 : 0 }
  }

  throw new Error("Unknown question kind")
}

export function formatAnswer(question: Question, answer: Answer): string {
  if (question.kind !== answer.kind)
    throw new Error("Answer kind does not match")
  if (question.kind === "choice" && answer.kind === "choice") {
    return answer.picked.label
  }
  if (question.kind === "scale" && answer.kind === "scale") {
    return `${answer.value}/5`
  }
  if (question.kind === "yesno" && answer.kind === "yesno") {
    return answer.value ? "Yes" : "No"
  }
  throw new Error("Unknown question kind")
}

export function isActivityOption(value: unknown): value is ActivityOption {
  if (typeof value !== "object" || value === null) return false
  const option = value as Record<string, unknown>
  return (
    typeof option.label === "string" &&
    typeof option.plan === "string" &&
    typeof option.points === "number"
  )
}
