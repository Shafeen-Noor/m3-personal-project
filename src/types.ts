export type PlanId = "outside" | "creative" | "rest" | "social"

export type Day = "Saturday" | "Sunday"

export interface Activity {
  day: Day
  time: string
  name: string
}

export interface WeekendPlan {
  id: PlanId
  title: string
  description: string
  schedule: Activity[]
}

export interface PlanChoice {
  label: string
  plan: PlanId
  points: number
}

interface TimePreference {
  kind: "time"
  text: string
  choices: PlanChoice[]
}

interface EnergyPreference {
  kind: "energy"
  text: string
  low: string
  high: string
  lowPlan: PlanId
  highPlan: PlanId
}

interface IndoorPreference {
  kind: "indoors"
  text: string
  yesPlan: PlanId
  noPlan: PlanId
}

export type PlanningStep = TimePreference | EnergyPreference | IndoorPreference

interface TimeAnswer {
  kind: "time"
  picked: PlanChoice
}

interface EnergyAnswer {
  kind: "energy"
  value: number
}

interface IndoorAnswer {
  kind: "indoors"
  value: boolean
}

export type PlanningAnswer = TimeAnswer | EnergyAnswer | IndoorAnswer

export interface SavedPlan {
  plan: PlanId
  days: Day[]
  indoor: boolean
  note?: string
}
