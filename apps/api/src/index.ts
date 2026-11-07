import { randomUUID } from "node:crypto"
import Fastify, { type FastifyPluginAsync } from "fastify"
import PlanBuilder, {
  loadPlans,
  planningSteps,
  type Activity,
  type Day,
  type WeekendPlan,
  type PlanningAnswer,
  type PlanningStep,
} from "@weekend-planner/core"

interface SessionEntry {
  planner: PlanBuilder
  answers: PlanningAnswer[]
  activities?: PlannedActivity[]
}

interface PlannedActivity extends Activity {
  id: string
}

interface SessionHeader {
  "x-session-id"?: string
}

interface StartBody {
  plan?: string
}

interface Submission {
  kind?: string
  picked?: { label?: string }
  value?: unknown
}

interface ErrorReply {
  error: string
}

interface TimePrompt {
  kind: "time"
  text: string
  choices: { label: string }[]
}

interface EnergyPrompt {
  kind: "energy"
  text: string
  low: string
  high: string
}

interface IndoorPrompt {
  kind: "indoors"
  text: string
}

type Prompt = TimePrompt | EnergyPrompt | IndoorPrompt

interface PlansReply {
  steps: Prompt[]
}

interface StartReply {
  session_id: string
}

interface ActivityBody {
  day?: string
  time?: string
  name?: string
}

interface ActivityReply {
  activity: PlannedActivity
}

interface ActivityQuery {
  day?: string
}

interface SuggestedActivity extends Activity {
  plan: string
}

interface SuggestionsReply {
  activities: SuggestedActivity[]
}

interface ActivitiesReply {
  activities: PlannedActivity[]
}

interface ProgressReply {
  answered: number
  total: number
}

interface ResultReply extends Omit<WeekendPlan, "schedule"> {
  schedule: PlannedActivity[]
}

const entries = new Map<string, SessionEntry>()

let plans: WeekendPlan[]
try {
  plans = await loadPlans()
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Could not load weekend plans",
  )
  process.exit(1)
}

function findSession(id: string | undefined): SessionEntry | undefined {
  return id ? entries.get(id) : undefined
}

function findActivities(entry: SessionEntry): PlannedActivity[] | undefined {
  if (entry.answers.length < planningSteps.length) return undefined
  if (!entry.activities) {
    entry.activities = entry.planner.bestPlan().schedule.map((activity) => ({
      ...activity,
      id: randomUUID(),
    }))
  }
  return entry.activities
}

function toActivity(body: ActivityBody | undefined): Activity | undefined {
  if (!body) return undefined
  const day = body.day
  const time = body.time
  const name = body.name?.trim()
  if (
    (day !== "Saturday" && day !== "Sunday") ||
    !time ||
    !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time) ||
    !name ||
    name.length > 60
  ) {
    return undefined
  }
  return { day: day as Day, time, name }
}

function toAnswer(
  step: PlanningStep,
  submission: Submission,
): PlanningAnswer | undefined {
  if (step.kind !== submission.kind) return undefined

  if (step.kind === "time") {
    const picked = step.choices.find(
      ({ label }) => label === submission.picked?.label,
    )
    return picked ? { kind: "time", picked } : undefined
  }

  if (step.kind === "energy") {
    return typeof submission.value === "number" &&
      Number.isInteger(submission.value) &&
      submission.value >= 1 &&
      submission.value <= 5
      ? { kind: "energy", value: submission.value }
      : undefined
  }

  return typeof submission.value === "boolean"
    ? { kind: "indoors", value: submission.value }
    : undefined
}

const api: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: PlansReply }>("/plans", async () => ({
    steps: planningSteps.map((step) =>
      step.kind === "time"
        ? {
            kind: step.kind,
            text: step.text,
            choices: step.choices.map(({ label }) => ({ label })),
          }
        : step.kind === "energy"
          ? { kind: step.kind, text: step.text, low: step.low, high: step.high }
          : { kind: step.kind, text: step.text },
    ),
  }))

  fastify.get<{
    Querystring: ActivityQuery
    Reply: SuggestionsReply | ErrorReply
  }>("/activities", async (request, reply) => {
    const { day } = request.query
    if (day && day !== "Saturday" && day !== "Sunday") {
      return reply.code(400).send({ error: "Choose Saturday or Sunday" })
    }
    const activities = plans.flatMap((plan) =>
      plan.schedule
        .filter((activity) => !day || activity.day === day)
        .map((activity) => ({ ...activity, plan: plan.title })),
    )
    return { activities }
  })

  fastify.post<{
    Body: StartBody | undefined
    Reply: StartReply | ErrorReply
  }>("/session", async (request, reply) => {
    if (request.body?.plan !== "weekend") {
      return reply.code(404).send({ error: "There is no such plan" })
    }

    const sessionId = randomUUID()
    entries.set(sessionId, {
      planner: new PlanBuilder(plans),
      answers: [],
    })
    return reply.code(201).send({ session_id: sessionId })
  })

  fastify.get<{
    Headers: SessionHeader
    Reply: ProgressReply | ErrorReply
  }>("/session", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    return { answered: entry.answers.length, total: planningSteps.length }
  })

  fastify.post<{
    Headers: SessionHeader
    Body: Submission | undefined
    Reply: ErrorReply | undefined
  }>("/session/answer", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })

    const step = planningSteps[entry.answers.length]
    if (!step)
      return reply.code(409).send({ error: "Every question has an answer" })
    const answer = request.body && toAnswer(step, request.body)
    if (!answer)
      return reply.code(400).send({ error: "That does not fit the question" })

    entry.planner.add(step, answer)
    entry.answers.push(answer)
    return reply.code(204).send(undefined)
  })

  fastify.get<{
    Headers: SessionHeader
    Reply: ActivitiesReply | ErrorReply
  }>("/session/activities", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    const activities = findActivities(entry)
    if (!activities) {
      return reply.code(409).send({ error: "Finish the plan questions first" })
    }
    return { activities }
  })

  fastify.post<{
    Headers: SessionHeader
    Body: ActivityBody | undefined
    Reply: ActivityReply | ErrorReply
  }>("/session/activities", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    const activities = findActivities(entry)
    if (!activities) {
      return reply.code(409).send({ error: "Finish the plan questions first" })
    }
    const activity = request.body && toActivity(request.body)
    if (!activity) {
      return reply
        .code(400)
        .send({ error: "Check the day, time, and activity" })
    }
    const plannedActivity = { ...activity, id: randomUUID() }
    activities.push(plannedActivity)
    activities.sort(
      (a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time),
    )
    return reply.code(201).send({ activity: plannedActivity })
  })

  fastify.patch<{
    Headers: SessionHeader
    Params: { id: string }
    Body: ActivityBody | undefined
    Reply: ActivityReply | ErrorReply
  }>("/session/activities/:id", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    const activities = findActivities(entry)
    if (!activities) {
      return reply.code(409).send({ error: "Finish the plan questions first" })
    }
    const index = activities.findIndex(({ id }) => id === request.params.id)
    if (index < 0) return reply.code(404).send({ error: "Activity not found" })
    const activity = request.body && toActivity(request.body)
    if (!activity) {
      return reply
        .code(400)
        .send({ error: "Check the day, time, and activity" })
    }
    activities[index] = { ...activity, id: request.params.id }
    activities.sort(
      (a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time),
    )
    return { activity: activities.find(({ id }) => id === request.params.id)! }
  })

  fastify.delete<{
    Headers: SessionHeader
    Params: { id: string }
    Reply: ErrorReply | undefined
  }>("/session/activities/:id", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    const activities = findActivities(entry)
    if (!activities) {
      return reply.code(409).send({ error: "Finish the plan questions first" })
    }
    const index = activities.findIndex(({ id }) => id === request.params.id)
    if (index < 0) return reply.code(404).send({ error: "Activity not found" })
    activities.splice(index, 1)
    return reply.code(204).send(undefined)
  })

  fastify.get<{
    Headers: SessionHeader
    Reply: ResultReply | ErrorReply
  }>("/session/result", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    if (entry.answers.length < planningSteps.length) {
      return reply.code(409).send({ error: "Some questions have no answer" })
    }

    const { id, title, description } = entry.planner.bestPlan()
    const schedule = findActivities(entry)
    if (!schedule) {
      return reply.code(409).send({ error: "Some questions have no answer" })
    }
    return { id, title, description, schedule }
  })
}

const fastify = Fastify()
fastify.register(api)
await fastify.listen({ port: Number(process.env.PORT ?? 3000) })
