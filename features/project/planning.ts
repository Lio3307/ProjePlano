import { arrayOf, isBoolean, isId, isNumber, isRecord, isString, nullable, objectOf, oneOf, recordOf } from "../../lib/json-validation.ts"
import { isValidWorkItemDate, WORK_ITEM_PRIORITIES, WORK_ITEM_TYPES, type WorkItemPriority, type WorkItemType } from "../work-item/model.ts"

export type Recurrence = { frequency: "daily" | "weekly" | "monthly"; interval: number; boardId: string; anchorDay: number }
export type TaskPlan = { date: string | null; minutes: number | null; recurrence: Recurrence | null; generated: boolean }
export type TimeEntry = { id: string; taskId: string; date: string; minutes: number; note: string }
export type TaskTemplate = { id: string; name: string; title: string; description: string; type: WorkItemType; priority: WorkItemPriority; estimate: number | null; checklist: string[] }
export type TaskView = { id: string; name: string; query: string; projectId: string; priority: WorkItemPriority | ""; status: "any" | "unfinished" | "done"; sort: "title" | "deadline" | "priority"; group: "none" | "project" | "status" }
export type PlanningData = { tasks: Record<string, TaskPlan>; entries: Record<string, TimeEntry>; templates: Record<string, TaskTemplate>; views: Record<string, TaskView>; capacity: Record<string, number> }
export const EMPTY_PLANNING: PlanningData = { tasks: {}, entries: {}, templates: {}, views: {}, capacity: {} }
export const EMPTY_TASK_PLAN: TaskPlan = { date: null, minutes: null, recurrence: null, generated: false }
export const DEFAULT_TASK_VIEW: TaskView = { id: "default", name: "All unfinished", query: "", projectId: "", priority: "", status: "unfinished", sort: "title", group: "project" }

const title = (value: unknown): value is string => isString(value) && value.trim().length > 0
export const isPlanningDate = (value: unknown): value is string => isString(value) && isValidWorkItemDate(value)
export const isMinutes = (value: unknown): value is number => isNumber(value) && Number.isSafeInteger(value) && value >= 0 && value <= 1440
const positiveMinutes = (value: unknown): value is number => isNumber(value) && Number.isSafeInteger(value) && value > 0 && value <= 525600
const interval = (value: unknown): value is number => isNumber(value) && Number.isInteger(value) && value >= 1 && value <= 365
const day = (value: unknown): value is number => isNumber(value) && Number.isInteger(value) && value >= 1 && value <= 31
const estimate = (value: unknown): value is number => isNumber(value) && Number.isSafeInteger(value) && value >= 0
export const isRecurrence = objectOf<Recurrence>({ frequency: oneOf("daily", "weekly", "monthly"), interval, boardId: isId, anchorDay: day })
export const isTaskPlan = objectOf<TaskPlan>({ date: nullable(isPlanningDate), minutes: nullable(isMinutes), recurrence: nullable(isRecurrence), generated: isBoolean })
export const isTimeEntry = objectOf<TimeEntry>({ id: isId, taskId: isId, date: isPlanningDate, minutes: positiveMinutes, note: isString })
export const isTaskTemplate = objectOf<TaskTemplate>({ id: isId, name: title, title, description: isString, type: oneOf(...WORK_ITEM_TYPES), priority: oneOf(...WORK_ITEM_PRIORITIES), estimate: nullable(estimate), checklist: arrayOf(title) })
export const isTaskView = objectOf<TaskView>({ id: isId, name: title, query: isString, projectId: isString, priority: oneOf("", ...WORK_ITEM_PRIORITIES), status: oneOf("any", "unfinished", "done"), sort: oneOf("title", "deadline", "priority"), group: oneOf("none", "project", "status") })
const isCapacity = (value: unknown): value is Record<string, number> => isRecord(value) && Object.entries(value).every(([date, minutes]) => isPlanningDate(date) && isMinutes(minutes))
export const isPlanningData = objectOf<PlanningData>({ tasks: recordOf(isTaskPlan), entries: recordOf(isTimeEntry), templates: recordOf(isTaskTemplate), views: recordOf(isTaskView), capacity: isCapacity })

export function addPlanningDays(date: string, days: number) {
  const result = new Date(date + "T00:00:00Z")
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

export function nextRecurringDate(date: string, rule: Recurrence) {
  if (rule.frequency !== "monthly") return addPlanningDays(date, rule.interval * (rule.frequency === "weekly" ? 7 : 1))
  const result = new Date(date + "T00:00:00Z")
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + rule.interval)
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(rule.anchorDay, lastDay))
  return result.toISOString().slice(0, 10)
}
