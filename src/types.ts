export type PlanId = "outdoors" | "creative" | "relax" | "social"

export interface WeekendPlan {
  id: PlanId
  title: string
  description: string
  activities: string[]
  indoor: boolean
}

export interface ActivityOption {
  label: string
  plan: PlanId
  points: number
}

interface BaseQuestion {
  text: string
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: "choice"
  choices: ActivityOption[]
}

export interface ScaleQuestion extends BaseQuestion {
  kind: "scale"
  plan: PlanId
  low: string
  high: string
}

export interface YesNoQuestion extends BaseQuestion {
  kind: "yesno"
  plan: PlanId
}

export type Question = ChoiceQuestion | ScaleQuestion | YesNoQuestion

export interface ChoiceAnswer {
  kind: "choice"
  picked: ActivityOption
}

export interface ScaleAnswer {
  kind: "scale"
  value: number
}

export interface YesNoAnswer {
  kind: "yesno"
  value: boolean
}

export type Answer = ChoiceAnswer | ScaleAnswer | YesNoAnswer

export interface SavedPlan {
  title: string
  plan: PlanId
  days: string[]
  indoor: boolean
  note?: string
}
