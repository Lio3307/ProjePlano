import { isId } from "../../lib/json-validation.ts"
import type { Milestone, ProjectWorkspaceState } from "./model"
import type { WorkItem } from "../work-item/model"
import { createWorkItemState } from "./work-item-state.ts"
import {
  EMPTY_PLANNING, EMPTY_TASK_PLAN, isMinutes, isPlanningDate,
  isRecurrence, isTaskTemplate, isTaskView, isTimeEntry, nextRecurringDate, addPlanningDays,
  type PlanningData, type Recurrence, type TaskTemplate, type TaskView, type TimeEntry,
} from "./planning.ts"
import { hasValidPlanningRelationships } from "./backup-schema.ts"

export type PlanningAction =
  | { type: "schedule"; taskId: string; date: string | null; minutes: number | null }
  | { type: "recurrence"; taskId: string; rule: Recurrence | null }
  | { type: "generate-recurrence"; taskId: string }
  | { type: "capacity"; date: string; minutes: number }
  | { type: "entry"; entry: TimeEntry }
  | { type: "delete-entry"; id: string }
  | { type: "template"; template: TaskTemplate }
  | { type: "delete-template"; id: string }
  | { type: "use-template"; templateId: string; boardId: string; id: string }
  | { type: "view"; view: TaskView }
  | { type: "delete-view"; id: string }
  | { type: "milestone"; milestone: Milestone }
  | { type: "delete-milestone"; id: string }
  | { type: "import-tasks"; tasks: WorkItem[] }

function withPlanning(state: ProjectWorkspaceState, planning: PlanningData) {
  const next = { ...state, planning }
  if (!hasValidPlanningRelationships(next) || JSON.stringify(planning) === JSON.stringify(state.planning ?? EMPTY_PLANNING)) return state
  return next
}

export function applyPlanningAction(state: ProjectWorkspaceState, action: PlanningAction, makeId: () => string): ProjectWorkspaceState {
  const data = state.planning ?? EMPTY_PLANNING
  switch (action.type) {
    case "schedule": {
      if (!Object.hasOwn(state.workItemsById, action.taskId) || (action.date !== null && !isPlanningDate(action.date)) ||
        (action.minutes !== null && !isMinutes(action.minutes))) return state
      const plan = { ...(data.tasks[action.taskId] ?? EMPTY_TASK_PLAN), date: action.date, minutes: action.minutes }
      return withPlanning(state, { ...data, tasks: { ...data.tasks, [action.taskId]: plan } })
    }
    case "recurrence": {
      const task = state.workItemsById[action.taskId]
      const rule = action.rule
      if (!Object.hasOwn(state.workItemsById, action.taskId) || !task || (rule && (!isRecurrence(rule) || !task.dueDate ||
        state.taskBoardsById[rule.boardId]?.projectId !== task.projectId || state.taskBoardsById[rule.boardId]?.stage === "done"))) return state
      const previous = data.tasks[task.id] ?? EMPTY_TASK_PLAN
      return withPlanning(state, { ...data, tasks: { ...data.tasks, [task.id]: { ...previous, recurrence: rule } } })
    }
    case "generate-recurrence": return generateRecurringTask(state, action.taskId, makeId)
    case "capacity": {
      if (!isPlanningDate(action.date) || !isMinutes(action.minutes)) return state
      return withPlanning(state, { ...data, capacity: { ...data.capacity, [action.date]: action.minutes } })
    }
    case "entry": {
      if (!isTimeEntry(action.entry) || !Object.hasOwn(state.workItemsById, action.entry.taskId) ||
        (data.entries[action.entry.id] && data.entries[action.entry.id].taskId !== action.entry.taskId)) return state
      return withPlanning(state, { ...data, entries: { ...data.entries, [action.entry.id]: { ...action.entry, note: action.entry.note.trim() } } })
    }
    case "delete-entry": return withPlanning(state, { ...data, entries: without(data.entries, action.id) })
    case "template": {
      if (!isTaskTemplate(action.template)) return state
      return withPlanning(state, { ...data, templates: { ...data.templates, [action.template.id]: structuredClone(action.template) } })
    }
    case "delete-template": return withPlanning(state, { ...data, templates: without(data.templates, action.id) })
    case "use-template": {
      const template = data.templates[action.templateId]
      const board = state.taskBoardsById[action.boardId]
      if (!Object.hasOwn(data.templates, action.templateId) || !Object.hasOwn(state.taskBoardsById, action.boardId) ||
        !template || !board || state.projectsById[board.projectId]?.archived || !isId(action.id)) return state
      return createWorkItemState(state, {
        id: action.id, projectId: board.projectId, boardId: board.id,
        title: template.title, description: template.description, type: template.type, priority: template.priority,
        estimate: template.estimate, startDate: null, dueDate: null, position: Number.MAX_SAFE_INTEGER,
        checklist: template.checklist.map((label, index) => ({ id: `${action.id}-check-${index}`, label, completed: false })),
        milestoneId: null, dependencyIds: [], labelIds: [], linkedResourceIds: [], customFields: {},
      })
    }
    case "view": {
      if (!isTaskView(action.view)) return state
      return withPlanning(state, { ...data, views: { ...data.views, [action.view.id]: { ...action.view } } })
    }
    case "delete-view": return withPlanning(state, { ...data, views: without(data.views, action.id) })
    case "milestone": {
      const item = action.milestone
      const project = state.projectsById[item.projectId]
      if (!isId(item.id) || !Object.hasOwn(state.projectsById, item.projectId) || !project || !item.title.trim() || typeof item.description !== "string" ||
        (item.targetDate !== null && !isPlanningDate(item.targetDate)) || !["planned", "in-progress", "completed"].includes(item.status) ||
        (state.milestonesById[item.id] && state.milestonesById[item.id].projectId !== project.id)) return state
      const milestone = { ...item, title: item.title.trim(), description: item.description.trim() }
      if (JSON.stringify(state.milestonesById[item.id]) === JSON.stringify(milestone)) return state
      return { ...state, milestonesById: { ...state.milestonesById, [item.id]: milestone },
        projectsById: { ...state.projectsById, [project.id]: { ...project, milestoneIds: project.milestoneIds.includes(item.id) ? project.milestoneIds : [...project.milestoneIds, item.id] } } }
    }
    case "delete-milestone": {
      const milestone = state.milestonesById[action.id]
      if (!Object.hasOwn(state.milestonesById, action.id) || !milestone) return state
      const project = state.projectsById[milestone.projectId]
      return { ...state, milestonesById: without(state.milestonesById, action.id),
        projectsById: { ...state.projectsById, [project.id]: { ...project, milestoneIds: project.milestoneIds.filter(id => id !== action.id) } },
        workItemsById: Object.fromEntries(Object.entries(state.workItemsById).map(([id, task]) => [id, task.milestoneId === action.id ? { ...task, milestoneId: null } : task])),
      }
    }
    case "import-tasks": {
      if (!action.tasks.length || action.tasks.length > 1000) return state
      let next = state
      for (const task of action.tasks) {
        if (state.projectsById[task.projectId]?.archived || !isId(task.id)) return state
        const inserted = createWorkItemState(next, { ...task, position: Number.MAX_SAFE_INTEGER })
        if (inserted === next) return state
        next = inserted
      }
      return next
    }
  }
}

export function generateRecurringTask(state: ProjectWorkspaceState, taskId: string, makeId: () => string): ProjectWorkspaceState {
  const data = state.planning
  const plan = data?.tasks[taskId]
  const task = state.workItemsById[taskId]
  const rule = plan?.recurrence
  if (!data || !plan || !task?.dueDate || !rule || plan.generated || state.taskBoardsById[task.boardId]?.stage !== "done" || state.projectsById[task.projectId]?.archived) return state
  const board = state.taskBoardsById[rule.boardId]
  if (!board || board.stage === "done" || board.projectId !== task.projectId) return state
  const dueDate = nextRecurringDate(task.dueDate, rule)
  if (!isPlanningDate(dueDate)) return state
  const days = Math.round((Date.parse(dueDate) - Date.parse(task.dueDate)) / 86400000)
  const id = makeId()
  if (!isId(id)) return state
  const next = createWorkItemState(state, { ...structuredClone(task), id, boardId: board.id, archived: false,
    dueDate, startDate: task.startDate ? addPlanningDays(task.startDate, days) : null,
    position: Number.MAX_SAFE_INTEGER, dependencyIds: [],
    checklist: task.checklist.map((item, index) => ({ ...item, id: `${id}-check-${index}`, completed: false })),
  })
  if (next === state) return state
  const result = { ...next, planning: { ...data, tasks: { ...data.tasks,
    [taskId]: { ...plan, generated: true },
    [id]: { ...plan, date: plan.date ? addPlanningDays(plan.date, days) : null, generated: false },
  } } }
  return hasValidPlanningRelationships(result) ? result : state
}

export function reconcilePlanning(before: ProjectWorkspaceState, after: ProjectWorkspaceState, makeId: () => string): ProjectWorkspaceState {
  if (!after.planning) return after
  let next = after
  for (const id of Object.keys(after.planning.tasks)) {
    const oldTask = before.workItemsById[id]
    const task = after.workItemsById[id]
    if (oldTask && task && before.taskBoardsById[oldTask.boardId]?.stage !== "done" && after.taskBoardsById[task.boardId]?.stage === "done") {
      next = generateRecurringTask(next, id, makeId)
    }
  }
  const data = next.planning ?? EMPTY_PLANNING
  const tasks = Object.fromEntries(Object.entries(data.tasks).filter(([id]) => !!next.workItemsById[id]))
  const entries = Object.fromEntries(Object.entries(data.entries).filter(([, entry]) => !!next.workItemsById[entry.taskId]))
  const views = Object.fromEntries(Object.entries(data.views).filter(([, view]) => !view.projectId || !!next.projectsById[view.projectId]))
  if (Object.keys(tasks).length === Object.keys(data.tasks).length && Object.keys(entries).length === Object.keys(data.entries).length && Object.keys(views).length === Object.keys(data.views).length) return next
  return { ...next, planning: { ...data, tasks, entries, views } }
}

function without<T>(map: Record<string, T>, id: string) {
  return Object.fromEntries(Object.entries(map).filter(([key]) => key !== id))
}
