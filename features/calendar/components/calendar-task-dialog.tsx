"use client"

import type * as React from "react"
import {
  CalendarDays,
  Check,
  Flag,
  ListChecks,
  type LucideIcon,
  UserRound,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { getCalendarDateLabel } from "../date-utils"
import type { CalendarTask } from "../model"
import {
  CalendarLabelList,
  CalendarPriorityBadge,
  CalendarStatusBadge,
  getCalendarChecklistProgress,
  getCalendarStatusLabel,
} from "./calendar-task-meta"

interface CalendarTaskDialogProps {
  task: CalendarTask | null
  finalFocus: React.RefObject<HTMLButtonElement | null>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalendarTaskDialog({
  task,
  finalFocus,
  open,
  onOpenChange,
}: CalendarTaskDialogProps) {
  if (!task) {
    return null
  }

  const progress = getCalendarChecklistProgress(task.checklist)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarStatusBadge status={task.status} />
            <CalendarPriorityBadge priority={task.priority} />
          </div>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>{task.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailItem icon={ListChecks} label="Status">
            {getCalendarStatusLabel(task.status)}
          </DetailItem>
          <DetailItem icon={UserRound} label="Assignee">
            {task.assignee.name}
          </DetailItem>
          <DetailItem icon={CalendarDays} label="Deadline">
            {getCalendarDateLabel(task.dueDate)}
          </DetailItem>
          <DetailItem icon={Flag} label="Priority">
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </DetailItem>
        </div>

        <section className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Labels</h3>
          <CalendarLabelList labels={task.labels} />
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium">Checklist</h3>
            <span className="text-xs text-muted-foreground">
              {progress.completed} of {progress.total} complete
            </span>
          </div>
          <ul className="space-y-2">
            {task.checklist.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg bg-muted/60 px-3 py-2.5 text-sm"
              >
                <span
                  className={
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full " +
                    (item.completed
                      ? "bg-primary text-primary-foreground"
                      : "ring-1 ring-foreground/20")
                  }
                  aria-hidden="true"
                >
                  {item.completed && <Check className="size-3" />}
                </span>
                <span
                  className={
                    item.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }
                >
                  {item.label}
                  <span className="sr-only">
                    {item.completed ? " completed" : " not completed"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
      <Icon
        className="mt-0.5 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{children}</p>
      </div>
    </div>
  )
}
