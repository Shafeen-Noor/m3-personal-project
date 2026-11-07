import {
  answerQuestion,
  getPlan,
  getProgress,
  getResult,
  startPlan,
} from "/services/planner.js"

const app = document.querySelector("#app")
let steps = []
let answered = 0

function button(label, action) {
  const element = document.createElement("button")
  element.textContent = label
  element.addEventListener("click", action)
  return element
}

function showStep() {
  const step = steps[answered]
  app.replaceChildren()
  const progress = document.createElement("div")
  progress.className = "progress"
  const fill = document.createElement("span")
  fill.style.width = `${(answered / steps.length) * 100}%`
  progress.append(fill)
  const count = document.createElement("p")
  count.className = "eyebrow"
  count.textContent = `Question ${answered + 1} of ${steps.length}`
  const title = document.createElement("h2")
  title.textContent = step.text
  const options = document.createElement("div")
  options.className = "options"

  if (step.kind === "time") {
    for (const choice of step.choices) {
      options.append(
        button(choice.label, () => answer({ kind: "time", picked: choice })),
      )
    }
  } else if (step.kind === "energy") {
    const row = document.createElement("div")
    row.className = "row"
    for (let value = 1; value <= 5; value += 1) {
      row.append(button(String(value), () => answer({ kind: "energy", value })))
    }
    options.append(row)
    const labels = document.createElement("p")
    labels.className = "muted"
    labels.textContent = `1 ${step.low} · 5 ${step.high}`
    options.append(labels)
  } else {
    const row = document.createElement("div")
    row.className = "row"
    row.append(button("Yes", () => answer({ kind: "indoors", value: true })))
    row.append(button("No", () => answer({ kind: "indoors", value: false })))
    options.append(row)
  }

  app.append(progress, count, title, options)
}

async function answer(value) {
  try {
    await answerQuestion(value)
    const progress = await getProgress()
    answered = progress.answered
    if (answered < progress.total) showStep()
    else showResult()
  } catch (error) {
    showError(error.message)
  }
}

async function showResult() {
  try {
    const result = await getResult()
    app.replaceChildren()
    const heading = document.createElement("h2")
    heading.textContent = result.title
    const description = document.createElement("p")
    description.textContent = result.description
    const list = document.createElement("ul")
    list.className = "schedule"
    for (const activity of result.schedule) {
      const item = document.createElement("li")
      for (const text of [activity.day, activity.time, activity.name]) {
        const part = document.createElement("span")
        part.textContent = text
        item.append(part)
      }
      list.append(item)
    }
    const again = button("Make another plan", start)
    again.className = "primary"
    app.append(heading, description, list, again)
  } catch (error) {
    showError(error.message)
  }
}

function showError(message) {
  app.replaceChildren()
  const text = document.createElement("p")
  text.textContent = message
  const retry = button("Try again", start)
  retry.className = "primary"
  app.append(text, retry)
}

async function start() {
  try {
    const plan = await getPlan()
    steps = plan.steps
    await startPlan()
    answered = 0
    showStep()
  } catch (error) {
    showError(error.message)
  }
}

document.querySelector("#start").addEventListener("click", start)
