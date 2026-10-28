import { plans, questions } from "./data.ts"
import { formatAnswer } from "./answers.ts"
import { Planner } from "./planner.ts"
import { loadSavedPlan } from "./storage.ts"
import type { Answer } from "./types.ts"

const answers: Answer[] = [
  {
    kind: "choice",
    picked:
      questions[0].kind === "choice"
        ? questions[0].choices[0]
        : { label: "A walk", plan: "outdoors", points: 3 },
  },
  { kind: "scale", value: 4 },
  { kind: "yesno", value: true },
]
const savedPlan = loadSavedPlan(
  JSON.stringify({
    title: "Easy Saturday",
    plan: "outdoors",
    days: ["Saturday", "Sunday"],
    indoor: false,
    note: "Bring water",
  }),
)
const planner = new Planner(plans)

for (const [index, question] of questions.entries()) {
  const answer = answers[index]
  planner.add(question, answer)
  console.log(
    `${index + 1}. ${question.text} ${formatAnswer(question, answer)}`,
  )
}

const result = planner.bestPlan()
console.log(`\nYour weekend: ${result.title}`)
console.log(result.description)
console.log(`Saved plan: ${savedPlan.title}`)
