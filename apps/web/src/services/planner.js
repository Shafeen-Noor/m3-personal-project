let sessionId = ""

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(sessionId ? { "x-session-id": sessionId } : {}),
      ...options.headers,
    },
  })
  const data = response.status === 204 ? undefined : await response.json()
  if (!response.ok) throw new Error(data?.error ?? "Something went wrong")
  return data
}

export function getPlan() {
  return request("/plans")
}

export async function startPlan() {
  const session = await request("/session", {
    method: "POST",
    body: JSON.stringify({ plan: "weekend" }),
  })
  sessionId = session.session_id
}

export function answerQuestion(answer) {
  return request("/session/answer", {
    method: "POST",
    body: JSON.stringify(answer),
  })
}

export function getProgress() {
  return request("/session")
}

export function getResult() {
  return request("/session/result")
}

export function getActivities() {
  return request("/session/activities")
}

export function addActivity(activity) {
  return request("/session/activities", {
    method: "POST",
    body: JSON.stringify(activity),
  })
}

export function updateActivity(id, activity) {
  return request(`/session/activities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(activity),
  })
}

export function removeActivity(id) {
  return request(`/session/activities/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
