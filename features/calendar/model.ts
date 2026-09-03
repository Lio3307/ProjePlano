import {
  isValidWorkItemDate,
  type WorkItem,
} from "../work-item/model.ts"

const TASK_DRAG_PREFIX = "calendar-task:"
const DATE_DROP_PREFIX = "calendar-date:"

export type ScheduledWorkItem = WorkItem & { dueDate: string }

function hasScheduledDate(
  workItem: WorkItem
): workItem is ScheduledWorkItem {
  return (
    workItem.dueDate !== null &&
    isValidWorkItemDate(workItem.dueDate)
  )
}

export function partitionCalendarWorkItems(
  workItems: readonly WorkItem[]
) {
  const scheduled: ScheduledWorkItem[] = []
  const unscheduled: WorkItem[] = []

  for (const workItem of workItems) {
    if (hasScheduledDate(workItem)) {
      scheduled.push(workItem)
    } else {
      unscheduled.push(workItem)
    }
  }

  return { scheduled, unscheduled }
}

export function getCalendarTaskDragId(workItemId: string) {
  return TASK_DRAG_PREFIX + workItemId
}

export function getCalendarDateDropId(isoDate: string) {
  return DATE_DROP_PREFIX + isoDate
}

export function parseCalendarTaskDragId(value: string | number) {
  const normalized = String(value)

  if (!normalized.startsWith(TASK_DRAG_PREFIX)) {
    return null
  }

  const workItemId = normalized.slice(TASK_DRAG_PREFIX.length)

  return workItemId || null
}

export function parseCalendarDateDropId(value: string | number) {
  const normalized = String(value)

  if (!normalized.startsWith(DATE_DROP_PREFIX)) {
    return null
  }

  const isoDate = normalized.slice(DATE_DROP_PREFIX.length)

  return isValidWorkItemDate(isoDate) ? isoDate : null
}
