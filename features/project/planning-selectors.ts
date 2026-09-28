import type { ProjectWorkspaceState } from "./model"
import { addPlanningDays, type TaskView } from "./planning.ts"

export function selectPlanningTasks(state: ProjectWorkspaceState, view: TaskView) {
  const priority = { urgent: 0, high: 1, medium: 2, low: 3 }
  return Object.values(state.workItemsById).filter(task => !task.archived && !state.projectsById[task.projectId]?.archived &&
    (!view.projectId || task.projectId === view.projectId) && (!view.priority || task.priority === view.priority) &&
    task.title.toLowerCase().includes(view.query.trim().toLowerCase()) &&
    (view.status === "any" || (state.taskBoardsById[task.boardId]?.stage === "done") === (view.status === "done")))
    .sort((a, b) => (view.sort === "priority" ? priority[a.priority] - priority[b.priority] :
      view.sort === "deadline" ? (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") : 0) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
}

export function planningWeek(date: string) {
  const day = new Date(date + "T00:00:00Z").getUTCDay()
  const monday = addPlanningDays(date, -((day + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => addPlanningDays(monday, index))
}

export function getDailyCapacity(state: ProjectWorkspaceState, date: string) {
  const tasks = Object.values(state.workItemsById).filter(task => !task.archived && !state.projectsById[task.projectId]?.archived && state.planning?.tasks[task.id]?.date === date)
  const minutes = tasks.reduce((sum, task) => sum + (state.planning?.tasks[task.id]?.minutes ?? 0), 0)
  return { tasks, minutes, unknown: tasks.filter(task => state.planning?.tasks[task.id]?.minutes === null).length, capacity: state.planning?.capacity[date] ?? 480 }
}
