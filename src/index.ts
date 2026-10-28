import { formatPreference } from "./answers.ts"
import { plans, planningSteps, timeChoices } from "./data.ts"
import { WeekendPlanner } from "./planner.ts"
import { loadSavedPlan } from "./storage.ts"
import type { PlanningAnswer } from "./types.ts"

const answers: PlanningAnswer[] = [
  { kind: "time", picked: timeChoices[2] },
  { kind: "energy", value: 2 },
  { kind: "indoors", value: true },
]

const planner = new WeekendPlanner(plans)

for (const [index, step] of planningSteps.entries()) {
  const answer = answers[index]
  planner.add(step, answer)
  console.log(formatPreference(step, answer))
}

const result = planner.bestPlan()
const savedPlan = loadSavedPlan(
  JSON.stringify({
    plan: result.id,
    days: ["Saturday", "Sunday"],
    indoor: answers[2].kind === "indoors" && answers[2].value,
  }),
)

console.log(`\nWeekend plan: ${result.title}`)
console.log(result.description)
console.log(`Saved plan: ${savedPlan.plan}`)

for (const activity of result.schedule) {
  console.log(`${activity.day} ${activity.time} ${activity.name}`)
}
