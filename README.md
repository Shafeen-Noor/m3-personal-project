# Weekend Planner

Weekend Planner turns a few preferences into a simple weekend schedule. The CLI and web page both get the questions and result from the API.

## Run

```sh
npm install
npm run api
```

In a second terminal, run `npm run web` and open [http://localhost:3001](http://localhost:3001). Run `npm start -- plan --help` to see the CLI options or `npm start -- plan --time "A few hours outside" --energy 4 --indoors no` to make a plan.

## Check

```sh
npm run lint
npm run typecheck
npm run format:check
```

## Project layout

- `apps/api/src` holds the Fastify routes and session storage.
- `apps/cli/src` holds the command-line app and its API service.
- `apps/web/src` holds the browser app and its API service.
- `src` holds the shared planning types, data, scoring, and saved-plan logic.

The API and both clients work. Plans are kept in memory while the API is running. Next, I would add a database so plans can be saved between runs.
