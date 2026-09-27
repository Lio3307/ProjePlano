import type { BoardLabel } from "@/features/project/board"
import type { WorkItemStagesByBoardId } from "@/features/work-item/dependencies"
import {
  buildCalendarDays,
  type CalendarMonth,
} from "../date-utils"
import type { ScheduledWorkItem } from "../model"
import { CalendarDay } from "./calendar-day"

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

interface CalendarGridProps {
  activeMonth: CalendarMonth
  tasks: ScheduledWorkItem[]
  labels: readonly BoardLabel[]
  stagesByBoardId: WorkItemStagesByBoardId
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  todayIsoDate: string
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
}

export function CalendarGrid({
  activeMonth,
  tasks,
  labels,
  stagesByBoardId,
  blockingCountsByWorkItemId,
  todayIsoDate,
  onOpenWorkItem,
}: CalendarGridProps) {
  const days = buildCalendarDays(activeMonth, todayIsoDate)
  const tasksByDate = groupTasksByDate(tasks)

  return (
    <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-3">
      <div
        className="min-w-[63rem] overflow-hidden rounded-xl border bg-background"
        aria-label="Month calendar"
      >
        <div className="grid grid-cols-7 border-b bg-muted/45">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="border-r px-3 py-2 text-xs font-medium text-muted-foreground last:border-r-0"
            >
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <CalendarDay
              key={day.isoDate}
              day={day}
              tasks={tasksByDate.get(day.isoDate) ?? []}
              labels={labels}
              stagesByBoardId={stagesByBoardId}
              blockingCountsByWorkItemId={blockingCountsByWorkItemId}
              onOpenWorkItem={onOpenWorkItem}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function groupTasksByDate(tasks: ScheduledWorkItem[]) {
  const grouped = new Map<string, ScheduledWorkItem[]>()

  for (const task of tasks) {
    grouped.set(task.dueDate, [
      ...(grouped.get(task.dueDate) ?? []),
      task,
    ])
  }

  return grouped
}
