import { Command } from "commander"
import { makePlan } from "./services/api.ts"

const program = new Command()

program
  .name("weekend-planner")
  .description("Make a simple plan for the weekend")
  .version("1.0.0")

program
  .command("plan")
  .description("Build a plan from a few preferences")
  .option(
    "-t, --time <choice>",
    "how to spend free time",
    "A few hours outside",
  )
  .option("-e, --energy <number>", "energy level from 1 to 5", "3")
  .option("-i, --indoors <answer>", "include an indoor option", "no")
  .action(
    async (options: { time: string; energy: string; indoors: string }) => {
      try {
        const energy = Number(options.energy)
        if (!Number.isInteger(energy) || energy < 1 || energy > 5) {
          throw new Error("Energy must be a number from 1 to 5")
        }
        if (options.indoors !== "yes" && options.indoors !== "no") {
          throw new Error("Indoors must be yes or no")
        }

        const result = await makePlan(
          options.time,
          energy,
          options.indoors === "yes",
        )
        console.log(result.title)
        console.log(result.description)
        for (const activity of result.schedule) {
          console.log(`${activity.day} ${activity.time} ${activity.name}`)
        }
      } catch (error) {
        console.error(
          error instanceof Error ? error.message : "Could not make a plan",
        )
        process.exitCode = 1
      }
    },
  )

await program.parseAsync(process.argv)
