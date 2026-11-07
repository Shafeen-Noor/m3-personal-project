import {
  addActivity,
  answerQuestion,
  getActivities,
  getPlan,
  getProgress,
  getResult,
  removeActivity,
  startPlan,
  updateActivity,
} from "/services/planner.js"

const app = document.querySelector("#app")
let steps = []
let answered = 0
let result = undefined
let activeDay = "All"
let editingId = ""

function makeButton(label, className, action) {
  const element = document.createElement("button")
  element.type = "button"
  element.className = className
  element.textContent = label
  element.addEventListener("click", action)
  return element
}

function showStep() {
  const step = steps[answered]
  app.replaceChildren()
  const card = document.createElement("div")
  card.className = "question-card"
  const eyebrow = document.createElement("p")
  eyebrow.className = "eyebrow"
  eyebrow.textContent = "Start with what sounds good"
  const progress = document.createElement("div")
  progress.className = "progress"
  const fill = document.createElement("span")
  fill.style.width = `${(answered / steps.length) * 100}%`
  progress.append(fill)
  const count = document.createElement("p")
  count.className = "muted"
  count.textContent = `Step ${answered + 1} of ${steps.length}`
  const title = document.createElement("h2")
  title.textContent = step.text
  const options = document.createElement("div")
  options.className = "options"

  if (step.kind === "time") {
    for (const choice of step.choices) {
      options.append(
        makeButton(choice.label, "choice", () =>
          answer({ kind: "time", picked: choice }),
        ),
      )
    }
  } else if (step.kind === "energy") {
    const row = document.createElement("div")
    row.className = "number-row"
    for (let value = 1; value <= 5; value += 1) {
      row.append(
        makeButton(String(value), "choice", () =>
          answer({ kind: "energy", value }),
        ),
      )
    }
    options.append(row)
    const labels = document.createElement("p")
    labels.className = "muted"
    labels.textContent = `1 ${step.low} · 5 ${step.high}`
    options.append(labels)
  } else {
    const row = document.createElement("div")
    row.className = "number-row"
    row.append(
      makeButton("Yes", "choice", () =>
        answer({ kind: "indoors", value: true }),
      ),
      makeButton("No", "choice", () =>
        answer({ kind: "indoors", value: false }),
      ),
    )
    options.append(row)
  }

  card.append(eyebrow, progress, count, title, options)
  app.append(card)
}

async function answer(value) {
  try {
    await answerQuestion(value)
    const progress = await getProgress()
    answered = progress.answered
    if (answered < progress.total) showStep()
    else await showResult()
  } catch (error) {
    showError(error.message)
  }
}

async function showResult() {
  try {
    const [plan, { activities }] = await Promise.all([
      getResult(),
      getActivities(),
    ])
    result = { ...plan, schedule: activities }
    renderResult()
  } catch (error) {
    showError(error.message)
  }
}

function renderResult() {
  app.replaceChildren()
  const card = document.createElement("section")
  card.className = "result-card"

  const heading = document.createElement("div")
  heading.className = "result-heading"
  const titleGroup = document.createElement("div")
  const eyebrow = document.createElement("p")
  eyebrow.className = "eyebrow"
  eyebrow.textContent = "Your weekend, your way"
  const title = document.createElement("h2")
  title.textContent = result.title
  const description = document.createElement("p")
  description.textContent = result.description
  titleGroup.append(eyebrow, title, description)
  const copy = makeButton("Copy plan", "secondary", copyPlan)
  heading.append(titleGroup, copy)

  const layout = document.createElement("div")
  layout.className = "result-layout"
  const itinerary = document.createElement("section")
  itinerary.className = "itinerary"
  const sectionHeading = document.createElement("div")
  sectionHeading.className = "section-heading"
  const itineraryTitle = document.createElement("h3")
  itineraryTitle.textContent = "The plan"
  const stopCount = document.createElement("span")
  stopCount.className = "muted"
  stopCount.textContent = `${result.schedule.length} ${result.schedule.length === 1 ? "stop" : "stops"}`
  sectionHeading.append(itineraryTitle, stopCount)

  const tabs = document.createElement("div")
  tabs.className = "day-tabs"
  for (const day of ["All", "Saturday", "Sunday"]) {
    const tab = makeButton(day, "day-tab", () => {
      activeDay = day
      renderResult()
    })
    tab.setAttribute("aria-pressed", String(activeDay === day))
    tabs.append(tab)
  }

  const list = document.createElement("ul")
  list.className = "schedule"
  const activities = result.schedule.filter(
    (activity) => activeDay === "All" || activity.day === activeDay,
  )
  if (!activities.length) {
    const empty = document.createElement("li")
    empty.className = "empty-state"
    empty.textContent = "No plans for this day yet. Add one to get started."
    list.append(empty)
  }
  for (const activity of activities) list.append(makeActivity(activity))
  itinerary.append(sectionHeading, tabs, list)

  const side = document.createElement("div")
  side.className = "side-column"
  side.append(makeEditor())
  side.append(makeSummary())
  layout.append(itinerary, side)

  const footer = document.createElement("div")
  footer.className = "footer-row"
  const note = document.createElement("span")
  note.className = "muted"
  note.textContent = "Change the stops until the weekend feels right."
  footer.append(note, makeButton("Start a new plan", "secondary", start))
  card.append(heading, layout, footer)
  app.append(card)
}

function makeActivity(activity) {
  const item = document.createElement("li")
  item.className = "activity"
  const time = document.createElement("span")
  time.className = "activity-time"
  time.textContent = activity.time
  const details = document.createElement("div")
  const day = document.createElement("span")
  day.className = "activity-day"
  day.textContent = activity.day
  const name = document.createElement("p")
  name.className = "activity-name"
  name.textContent = activity.name
  details.append(day, name)
  const actions = document.createElement("div")
  actions.className = "activity-actions"
  actions.append(
    makeButton("Edit", "small-button", () => {
      editingId = activity.id
      renderResult()
      document.querySelector("#activity-name").focus()
    }),
    makeButton("Remove", "small-button remove", async () => {
      try {
        await removeActivity(activity.id)
        if (editingId === activity.id) editingId = ""
        await showResult()
      } catch (error) {
        showError(error.message)
      }
    }),
  )
  item.append(time, details, actions)
  return item
}

function makeEditor() {
  const editor = document.createElement("form")
  editor.className = "editor"
  const activity = result.schedule.find(({ id }) => id === editingId)
  const title = document.createElement("h3")
  title.textContent = activity ? "Change a stop" : "Add a stop"

  const nameField = makeField("Activity", "text", activity?.name ?? "")
  nameField.input.id = "activity-name"
  nameField.wrapper.querySelector("label").htmlFor = "activity-name"
  nameField.input.maxLength = 60
  nameField.input.placeholder = "Coffee with a friend"
  nameField.input.required = true
  const dayField = makeField("Day", "select", activity?.day ?? "Saturday")
  for (const day of ["Saturday", "Sunday"]) {
    const option = document.createElement("option")
    option.value = day
    option.textContent = day
    dayField.input.append(option)
  }
  dayField.input.value = activity?.day ?? "Saturday"
  const timeField = makeField("Time", "time", activity?.time ?? "10:00")
  timeField.input.required = true
  const message = document.createElement("p")
  message.className = "status-message"
  message.id = "form-message"
  const actions = document.createElement("div")
  actions.className = "editor-actions"
  const save = document.createElement("button")
  save.className = "primary"
  save.textContent = activity ? "Save changes" : "Add to weekend"
  const cancel = makeButton("Cancel", "secondary", () => {
    editingId = ""
    renderResult()
  })
  actions.append(save)
  if (activity) actions.append(cancel)

  editor.append(
    title,
    nameField.wrapper,
    dayField.wrapper,
    timeField.wrapper,
    message,
    actions,
  )
  editor.addEventListener("submit", async (event) => {
    event.preventDefault()
    const value = {
      name: nameField.input.value.trim(),
      day: dayField.input.value,
      time: timeField.input.value,
    }
    try {
      if (editingId) await updateActivity(editingId, value)
      else await addActivity(value)
      editingId = ""
      activeDay = "All"
      await showResult()
    } catch (error) {
      message.textContent = error.message
    }
  })
  return editor
}

function makeField(labelText, type, value) {
  const wrapper = document.createElement("div")
  wrapper.className = "field"
  const label = document.createElement("label")
  label.textContent = labelText
  const input = document.createElement(type === "select" ? "select" : "input")
  if (type !== "select") input.type = type
  input.value = value
  label.htmlFor = `field-${labelText.toLowerCase()}`
  input.id = label.htmlFor
  wrapper.append(label, input)
  return { wrapper, input }
}

function makeSummary() {
  const summary = document.createElement("section")
  summary.className = "plan-summary"
  const title = document.createElement("h3")
  title.textContent = "Weekend at a glance"
  const saturday = result.schedule.filter(
    ({ day }) => day === "Saturday",
  ).length
  const sunday = result.schedule.filter(({ day }) => day === "Sunday").length
  summary.append(
    title,
    makeSummaryLine("Saturday", saturday),
    makeSummaryLine("Sunday", sunday),
    makeSummaryLine("Total stops", result.schedule.length),
  )
  return summary
}

function makeSummaryLine(label, value) {
  const line = document.createElement("div")
  line.className = "summary-line"
  const name = document.createElement("span")
  name.textContent = label
  const count = document.createElement("strong")
  count.textContent = String(value)
  line.append(name, count)
  return line
}

async function copyPlan() {
  const lines = [result.title, ""]
  for (const activity of result.schedule) {
    lines.push(`${activity.day} ${activity.time} ${activity.name}`)
  }
  try {
    await navigator.clipboard.writeText(lines.join("\n"))
    const message = document.querySelector("#form-message")
    if (message) message.textContent = "Plan copied."
  } catch {
    const message = document.querySelector("#form-message")
    if (message) message.textContent = "Copy is not available in this browser."
  }
}

function showError(message) {
  app.replaceChildren()
  const card = document.createElement("div")
  card.className = "question-card"
  const text = document.createElement("p")
  text.textContent = message
  const retry = makeButton("Try again", "primary", start)
  card.append(text, retry)
  app.append(card)
}

async function start() {
  try {
    const plan = await getPlan()
    steps = plan.steps
    await startPlan()
    answered = 0
    result = undefined
    editingId = ""
    activeDay = "All"
    showStep()
  } catch (error) {
    showError(error.message)
  }
}

document.querySelector("#start").addEventListener("click", start)
