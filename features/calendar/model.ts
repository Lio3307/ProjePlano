export type CalendarTaskStatus =
  | "todo"
  | "in-progress"
  | "review"
  | "done"

export type CalendarTaskPriority = "low" | "medium" | "high"

export type CalendarChecklistItem = {
  id: string
  label: string
  completed: boolean
}

export type CalendarAssignee = {
  name: string
  initials: string
}

export type CalendarTask = {
  id: string
  title: string
  description: string
  dueDate: string
  status: CalendarTaskStatus
  priority: CalendarTaskPriority
  assignee: CalendarAssignee
  labels: string[]
  checklist: CalendarChecklistItem[]
}

const TASK_DRAG_PREFIX = "calendar-task:"
const DATE_DROP_PREFIX = "calendar-date:"
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function findCalendarTask(
  tasks: CalendarTask[],
  taskId: string
) {
  return tasks.find((task) => task.id === taskId) ?? null
}

export function moveCalendarTask(
  tasks: CalendarTask[],
  taskId: string,
  dueDate: string
): CalendarTask[] {
  if (!isValidCalendarTaskDate(dueDate)) {
    return tasks
  }

  const taskIndex = tasks.findIndex((task) => task.id === taskId)

  if (taskIndex < 0 || tasks[taskIndex].dueDate === dueDate) {
    return tasks
  }

  return tasks.map((task, index) =>
    index === taskIndex ? { ...task, dueDate } : task
  )
}

export function getCalendarTaskDragId(taskId: string) {
  return TASK_DRAG_PREFIX + taskId
}

export function getCalendarDateDropId(isoDate: string) {
  return DATE_DROP_PREFIX + isoDate
}

export function parseCalendarTaskDragId(
  value: string | number
): string | null {
  const normalizedValue = String(value)

  if (!normalizedValue.startsWith(TASK_DRAG_PREFIX)) {
    return null
  }

  const taskId = normalizedValue.slice(TASK_DRAG_PREFIX.length)

  return taskId.length > 0 ? taskId : null
}

export function parseCalendarDateDropId(
  value: string | number
): string | null {
  const normalizedValue = String(value)

  if (!normalizedValue.startsWith(DATE_DROP_PREFIX)) {
    return null
  }

  const isoDate = normalizedValue.slice(DATE_DROP_PREFIX.length)

  return isValidCalendarTaskDate(isoDate) ? isoDate : null
}

function isValidCalendarTaskDate(value: string) {
  const match = ISO_DATE_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  if (year < 1000 || month < 0 || month > 11 || day < 1) {
    return false
  }

  const date = new Date(Date.UTC(year, month, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
  )
}
