"use client"

import { useDroppable } from "@dnd-kit/react"

import type { BoardLabel } from "@/features/project/board"
import type { WorkItemStagesByBoardId } from "@/features/work-item/dependencies"
import { cn } from "@/lib/utils"
import {
  getCalendarDateLabel,
  type CalendarDayRecord,
} from "../date-utils"
import {
  getCalendarDateDropId,
  type ScheduledWorkItem,
} from "../model"
import { CalendarTaskCard } from "./calendar-task-card"

interface CalendarDayProps {
  day: CalendarDayRecord
  tasks: ScheduledWorkItem[]
  labels: readonly BoardLabel[]
  stagesByBoardId: WorkItemStagesByBoardId
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
}

export function CalendarDay({
  day,
  tasks,
  labels,
  stagesByBoardId,
  blockingCountsByWorkItemId,
  onOpenWorkItem,
}: CalendarDayProps) {
  const { ref, isDropTarget } = useDroppable({
    id: getCalendarDateDropId(day.isoDate),
  })

  return (
    <section
      ref={ref}
      className={cn(
        "min-h-36 space-y-2 border-r border-b p-2 align-top transition-colors motion-reduce:transition-none",
        !day.isCurrentMonth && "bg-muted/35 text-muted-foreground",
        isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40"
      )}
      aria-label={getCalendarDateLabel(day.isoDate)}
    >
      <div className="flex items-center justify-between">
        <time
          dateTime={day.isoDate}
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
            day.isToday && "bg-primary text-primary-foreground"
          )}
        >
          {day.day}
        </time>
        {tasks.length > 0 ? (
          <span className="text-[10px] text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <CalendarTaskCard
            key={task.id}
            workItem={task}
            labels={labels}
            status={stagesByBoardId[task.boardId]}
            blockingCount={blockingCountsByWorkItemId[task.id] ?? 0}
            onOpen={onOpenWorkItem}
          />
        ))}
      </div>
    </section>
  )
}
