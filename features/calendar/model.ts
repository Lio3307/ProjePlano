import {
  isValidWorkItemDate,
  type WorkItem,
} from "../work-item/model.ts"
import {
  getCalendarMonthFromIsoDate,
  type CalendarMonth,
} from "./date-utils.ts"

const TASK_DRAG_PREFIX = "calendar-task:"
const DATE_DROP_PREFIX = "calendar-date:"

export type ScheduledWorkItem = WorkItem & { dueDate: string }

export type CalendarAgendaGroup = {
  readonly isoDate: string
  readonly workItems: readonly ScheduledWorkItem[]
}

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

export function groupCalendarWorkItemsByMonth(
  workItems: readonly WorkItem[],
  month: CalendarMonth
): CalendarAgendaGroup[] {
  const grouped = new Map<string, ScheduledWorkItem[]>()

  for (const workItem of workItems) {
    if (!hasScheduledDate(workItem)) {
      continue
    }

    const taskMonth = getCalendarMonthFromIsoDate(workItem.dueDate)

    if (
      taskMonth?.year !== month.year ||
      taskMonth.month !== month.month
    ) {
      continue
    }

    const existing = grouped.get(workItem.dueDate)

    if (existing) {
      existing.push(workItem)
    } else {
      grouped.set(workItem.dueDate, [workItem])
    }
  }

  return [...grouped.entries()]
    .sort(([leftDate], [rightDate]) =>
      leftDate.localeCompare(rightDate)
    )
    .map(([isoDate, groupedWorkItems]) => ({
      isoDate,
      workItems: groupedWorkItems,
    }))
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
