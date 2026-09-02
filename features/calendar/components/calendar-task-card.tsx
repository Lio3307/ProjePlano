"use client"

import { useDraggable } from "@dnd-kit/react"
import { GripVertical } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import {
  getCalendarTaskDragId,
  type CalendarTask,
} from "../model"
import {
  CalendarLabelList,
  CalendarPriorityBadge,
  CalendarStatusBadge,
} from "./calendar-task-meta"

interface CalendarTaskCardProps {
  task: CalendarTask
  onOpen: (taskId: string, trigger: HTMLButtonElement) => void
}

export function CalendarTaskCard({
  task,
  onOpen,
}: CalendarTaskCardProps) {
  const {
    ref,
    handleRef,
    isDragging,
  } = useDraggable({
    id: getCalendarTaskDragId(task.id),
    type: "calendar-task",
  })

  return (
    <Card
      ref={ref}
      size="sm"
      className={cn(
        "gap-0 py-0 shadow-sm transition-opacity motion-reduce:transition-none",
        isDragging && "opacity-45"
      )}
    >
      <div className="flex items-start">
        <button
          type="button"
          className="min-w-0 flex-1 space-y-2 p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label={"Open details for " + task.title}
          onClick={(event) => onOpen(task.id, event.currentTarget)}
        >
          <h3 className="text-xs leading-4 font-medium">{task.title}</h3>
          <div className="flex flex-wrap gap-1">
            <CalendarStatusBadge status={task.status} />
            <CalendarPriorityBadge priority={task.priority} />
          </div>
          <CalendarLabelList labels={task.labels} />
          <span
            className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary"
            title={task.assignee.name}
          >
            {task.assignee.initials}
          </span>
        </button>
        <button
          ref={handleRef}
          type="button"
          className="m-1.5 rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={"Reschedule " + task.title}
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}
