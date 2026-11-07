export interface ApiError {
  error: string
}

export interface PlanPrompt {
  kind: "time" | "energy" | "indoors"
  text: string
  choices?: { label: string }[]
  low?: string
  high?: string
}

export interface PlanResult {
  title: string
  description: string
  schedule: { day: string; time: string; name: string }[]
}

let sessionId = ""

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}${path}`,
    {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(sessionId ? { "x-session-id": sessionId } : {}),
        ...options.headers,
      },
    },
  )
  const data: unknown =
    response.status === 204 ? undefined : await response.json()
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String(data.error)
        : "Something went wrong"
    throw new Error(message)
  }
  return data as T
}

export async function makePlan(
  time: string,
  energy: number,
  indoors: boolean,
): Promise<PlanResult> {
  const plan = await request<{ steps: PlanPrompt[] }>("/plans")
  const timeStep = plan.steps.find((step) => step.kind === "time")
  if (!timeStep?.choices?.some((choice) => choice.label === time)) {
    throw new Error("Choose a time option from the list")
  }

  const session = await request<{ session_id: string }>("/session", {
    method: "POST",
    body: JSON.stringify({ plan: "weekend" }),
  })
  sessionId = session.session_id

  await request<void>("/session/answer", {
    method: "POST",
    body: JSON.stringify({ kind: "time", picked: { label: time } }),
  })
  await request<void>("/session/answer", {
    method: "POST",
    body: JSON.stringify({ kind: "energy", value: energy }),
  })
  await request<void>("/session/answer", {
    method: "POST",
    body: JSON.stringify({ kind: "indoors", value: indoors }),
  })

  return request<PlanResult>("/session/result")
}
