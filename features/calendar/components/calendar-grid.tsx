import {
  buildCalendarDays,
  type CalendarMonth,
} from "../date-utils"
import type { CalendarTask } from "../model"
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
  tasks: CalendarTask[]
  todayIsoDate: string
  onOpenTask: (taskId: string, trigger: HTMLButtonElement) => void
}

export function CalendarGrid({
  activeMonth,
  tasks,
  todayIsoDate,
  onOpenTask,
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
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function groupTasksByDate(tasks: CalendarTask[]) {
  const groupedTasks = new Map<string, CalendarTask[]>()

  for (const task of tasks) {
    const tasksForDate = groupedTasks.get(task.dueDate) ?? []
    tasksForDate.push(task)
    groupedTasks.set(task.dueDate, tasksForDate)
  }

  return groupedTasks
}
