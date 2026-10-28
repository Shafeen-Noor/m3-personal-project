import { scorePreference } from "./answers.ts"
import type {
  PlanId,
  PlanningAnswer,
  PlanningStep,
  WeekendPlan,
} from "./types.ts"

export class WeekendPlanner {
  private tally: Record<PlanId, number> = {
    outside: 0,
    creative: 0,
    rest: 0,
    social: 0,
  }

  private plans: WeekendPlan[]

  constructor(plans: WeekendPlan[]) {
    this.plans = plans
  }

  add(step: PlanningStep, answer: PlanningAnswer): void {
    const score = scorePreference(step, answer)
    this.tally[score.plan] += score.points
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
