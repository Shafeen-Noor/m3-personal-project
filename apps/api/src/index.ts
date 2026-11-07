import { randomUUID } from "node:crypto"
import Fastify, { type FastifyPluginAsync } from "fastify"
import { plans, planningSteps } from "../../../src/data.ts"
import { WeekendPlanner } from "../../../src/planner.ts"
import type {
  PlanningAnswer,
  PlanningStep,
  WeekendPlan,
} from "../../../src/types.ts"

interface SessionEntry {
  planner: WeekendPlanner
  answers: PlanningAnswer[]
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

interface ProgressReply {
  answered: number
  total: number
}

type ResultReply = WeekendPlan

const entries = new Map<string, SessionEntry>()

function findSession(id: string | undefined): SessionEntry | undefined {
  return id ? entries.get(id) : undefined
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

  fastify.post<{
    Body: StartBody | undefined
    Reply: StartReply | ErrorReply
  }>("/session", async (request, reply) => {
    if (request.body?.plan !== "weekend") {
      return reply.code(404).send({ error: "There is no such plan" })
    }

    const sessionId = randomUUID()
    entries.set(sessionId, {
      planner: new WeekendPlanner(plans),
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
    Reply: ResultReply | ErrorReply
  }>("/session/result", async (request, reply) => {
    const entry = findSession(request.headers["x-session-id"])
    if (!entry) return reply.code(401).send({ error: "Unknown session" })
    if (entry.answers.length < planningSteps.length) {
      return reply.code(409).send({ error: "Some questions have no answer" })
    }

    const { id, title, description, schedule } = entry.planner.bestPlan()
    return { id, title, description, schedule }
  })
}

const fastify = Fastify()
fastify.register(api)
await fastify.listen({ port: Number(process.env.PORT ?? 3000) })
