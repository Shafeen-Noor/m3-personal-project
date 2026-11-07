import { select } from "@inquirer/prompts"
import { Command } from "commander"
import { listActivities, makePlan } from "./services/api.ts"

const program = new Command()

program
  .name("weekend-planner")
  .description("Make a simple plan for the weekend")
  .version("1.0.0")

program
  .command("plan")
  .description("Build a plan from a free-time choice")
  .argument("<time>", "outside, creative, rest, or social")
  .option("-e, --energy <number>", "energy level from 1 to 5", "3")
  .option("-i, --indoors <answer>", "include an indoor option", "no")
  .action(
    async (choice: string, options: { energy: string; indoors: string }) => {
      try {
        const choices: Record<string, string> = {
          outside: "A few hours outside",
          creative: "A short creative block",
          rest: "A quiet day at home",
          social: "Time with friends",
        }
        const time = choices[choice.toLowerCase()]
        if (!time) throw new Error("Choose outside, creative, rest, or social")

        const energy = Number(options.energy)
        if (!Number.isInteger(energy) || energy < 1 || energy > 5) {
          throw new Error("Energy must be a number from 1 to 5")
        }
        if (options.indoors !== "yes" && options.indoors !== "no") {
          throw new Error("Indoors must be yes or no")
        }

        const result = await makePlan(time, energy, options.indoors === "yes")
        console.log(result.title)
        console.log(result.description)
        for (const activity of result.schedule) {
          console.log(`${activity.day} ${activity.time} ${activity.name}`)
        }
      } catch (error) {
        reportError(error)
      }
    },
  )

program
  .command("activities")
  .description("Browse suggested activities for a day")
  .argument("[day]", "Saturday or Sunday")
  .action(async (day?: string) => {
    try {
      const selected: string | undefined =
        day ??
        (await select({
          message: "Choose a day",
          choices: ["Saturday", "Sunday"],
        }))
      if (!selected) throw new Error("Choose Saturday or Sunday")
      const normalized =
        selected.toLowerCase() === "saturday"
          ? "Saturday"
          : selected.toLowerCase() === "sunday"
            ? "Sunday"
            : undefined
      if (!normalized) throw new Error("Choose Saturday or Sunday")

      const result = await listActivities(normalized)
      for (const activity of result.activities) {
        console.log(`${activity.time} ${activity.name} · ${activity.plan}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") return
      reportError(error)
    }
  })

function reportError(error: unknown): void {
  console.error(
    error instanceof Error ? error.message : "Could not make a plan",
  )
  process.exitCode = 1
}

await program.parseAsync(process.argv)
