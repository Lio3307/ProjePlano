import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  isValidWorkItemDate,
  type Assignee,
  type WorkItem,
} from "../model"

export const WORK_ITEM_STATUS_LABELS: Record<
  WorkItem["status"],
  string
> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  testing: "Testing",
  done: "Done",
}

export const WORK_ITEM_TYPE_LABELS: Record<
  WorkItem["type"],
  string
> = {
  feature: "Feature",
  bug: "Bug",
  chore: "Chore",
  spike: "Spike",
}

export const WORK_ITEM_PRIORITY_LABELS: Record<
  WorkItem["priority"],
  string
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

const STATUS_STYLES: Record<WorkItem["status"], string> = {
  backlog:
    "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  todo: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  "in-progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  review:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  testing:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
}

const TYPE_STYLES: Record<WorkItem["type"], string> = {
  feature:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  bug: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  chore:
    "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  spike:
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
}

const PRIORITY_STYLES: Record<WorkItem["priority"], string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  urgent:
    "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
}

function MetaBadge({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        className
      )}
    >
      {children}
    </span>
  )
}

export function WorkItemStatusBadge({
  status,
}: {
  status: WorkItem["status"]
}) {
  return (
    <MetaBadge className={STATUS_STYLES[status]}>
      {WORK_ITEM_STATUS_LABELS[status]}
    </MetaBadge>
  )
}

export function WorkItemTypeBadge({
  type,
}: {
  type: WorkItem["type"]
}) {
  return (
    <MetaBadge className={TYPE_STYLES[type]}>
      {WORK_ITEM_TYPE_LABELS[type]}
    </MetaBadge>
  )
}

export function WorkItemPriorityBadge({
  priority,
}: {
  priority: WorkItem["priority"]
}) {
  return (
    <MetaBadge className={PRIORITY_STYLES[priority]}>
      {WORK_ITEM_PRIORITY_LABELS[priority]}
    </MetaBadge>
  )
}

export function WorkItemLabelList({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Labels">
      {labels.map((label) => (
        <li
          key={label}
          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-foreground/10"
        >
          {label}
        </li>
      ))}
    </ul>
  )
}

export function WorkItemAssignee({
  assignee,
  showName = false,
}: {
  assignee: Assignee | null
  showName?: boolean
}) {
  if (!assignee) {
    return <span className="text-muted-foreground">Unassigned</span>
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
        aria-hidden="true"
      >
        {assignee.initials}
      </span>
      {showName ? (
        <span>{assignee.name}</span>
      ) : (
        <span className="sr-only">Assigned to {assignee.name}</span>
      )}
    </span>
  )
}

export function formatWorkItemDate(value: string | null) {
  if (!value || !isValidWorkItemDate(value)) {
    return "No due date"
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"))
}

export function getWorkItemChecklistProgress(
  checklist: WorkItem["checklist"]
) {
  return {
    completed: checklist.filter((item) => item.completed).length,
    total: checklist.length,
  }
}
