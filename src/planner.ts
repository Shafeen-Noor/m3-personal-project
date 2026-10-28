import type { Answer, PlanId, Question, WeekendPlan } from "./types.ts"
import { pointsFor } from "./answers.ts"

export class Planner {
  private tally: Record<PlanId, number> = {
    outdoors: 0,
    creative: 0,
    relax: 0,
    social: 0,
  }
  private plans: WeekendPlan[]

  constructor(plans: WeekendPlan[]) {
    this.plans = plans
  }

  add(question: Question, answer: Answer): void {
    const points = pointsFor(question, answer)
    this.tally[points.plan] += points.value
  }

  bestPlan(): WeekendPlan {
    return this.plans.reduce((best, plan) =>
      this.tally[plan.id] > this.tally[best.id] ? plan : best,
    )
  }

  scores(): Record<PlanId, number> {
    return { ...this.tally }
  }
}
