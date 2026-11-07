import { createServer } from "node:http"
import { readFile } from "node:fs/promises"

const assets = new Map<string, [string, string]>([
  ["/", ["index.html", "text/html"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/services/planner.js", ["services/planner.js", "text/javascript"]],
])

const server = createServer(async (request, reply) => {
  const url = new URL(request.url ?? "/", "http://localhost:3001")
  if (url.pathname.startsWith("/api/")) {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const method = request.method ?? "GET"
      const sessionId = request.headers["x-session-id"]
      const response = await fetch(
        `http://localhost:${process.env.API_PORT ?? 3000}${url.pathname.slice(4)}${url.search}`,
        {
          method,
          headers: {
            "content-type":
              request.headers["content-type"] ?? "application/json",
            ...(sessionId
              ? {
                  "x-session-id": Array.isArray(sessionId)
                    ? sessionId[0]
                    : sessionId,
                }
              : {}),
          },
          body:
            method === "GET" || method === "HEAD"
              ? undefined
              : Buffer.concat(chunks),
        },
      )
      reply.writeHead(response.status, {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      })
      reply.end(Buffer.from(await response.arrayBuffer()))
    } catch {
      reply.writeHead(502).end("The API is not available")
    }
    return
  }

  const asset = assets.get(url.pathname)
  if (!asset) {
    reply.writeHead(404).end("Not found")
    return
  }

  try {
    const body = await readFile(new URL(`./${asset[0]}`, import.meta.url))
    reply.writeHead(200, { "content-type": `${asset[1]}; charset=utf-8` })
    reply.end(body)
  } catch {
    reply.writeHead(500).end("Could not load the page")
  }
})

server.listen(Number(process.env.WEB_PORT ?? 3001))
