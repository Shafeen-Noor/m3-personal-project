# Weekend Planner

Weekend Planner turns a few preferences into a weekend schedule. The web app lets you filter by day, add, edit, and remove stops, and copy the plan. The CLI and web app use the same API.

## Run

```sh
pnpm install
pnpm api
```

In a second terminal, run `pnpm web` and open [http://localhost:3001](http://localhost:3001). Run `pnpm start -- plan --help` to see the CLI options or `pnpm start -- plan "A few hours outside" --energy 4 --indoors no` to make a plan. Run `pnpm start -- activities` to choose a day, or pass `Saturday` or `Sunday` directly.

## Check

```sh
pnpm lint
pnpm typecheck
pnpm format:check
```

## Project layout

- `apps/api/src` holds the Fastify routes and session storage.
- `apps/cli/src` holds the command-line app and its API service.
- `apps/web/src` holds the browser app and its API service.
- `packages/core` holds the shared types, plan data, and scoring. The workspace uses a shared dependency catalog and Nx task ordering.

The API and both clients use the same plan data and activity routes. Activities stay in memory while the API runs. A database would be the next step.
