import type {
  CalendarTaskPriority,
  CalendarTaskStatus,
} from "../model"

const STATUS_LABELS: Record<CalendarTaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
}

const STATUS_STYLES: Record<CalendarTaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  "in-progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  review:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
}

const PRIORITY_LABELS: Record<CalendarTaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const PRIORITY_STYLES: Record<CalendarTaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
}

const LABEL_STYLES: Record<string, string> = {
  Design:
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  Docs: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  Launch:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  Meeting:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  Planning:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  Product:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Quality:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Research:
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
}

const FALLBACK_LABEL_STYLE =
  "bg-muted text-muted-foreground ring-1 ring-foreground/10"

export function CalendarStatusBadge({
  status,
}: {
  status: CalendarTaskStatus
}) {
  return (
    <span
      className={
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
        STATUS_STYLES[status]
      }
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function CalendarPriorityBadge({
  priority,
}: {
  priority: CalendarTaskPriority
}) {
  return (
    <span
      className={
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
        PRIORITY_STYLES[priority]
      }
    >
      {PRIORITY_LABELS[priority]} priority
    </span>
  )
}

export function CalendarLabelList({ labels }: { labels: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Labels">
      {labels.map((label) => (
        <li
          key={label}
          className={
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
            (LABEL_STYLES[label] ?? FALLBACK_LABEL_STYLE)
          }
        >
          {label}
        </li>
      ))}
    </ul>
  )
}

export function getCalendarStatusLabel(status: CalendarTaskStatus) {
  return STATUS_LABELS[status]
}

export function getCalendarChecklistProgress(
  checklist: { completed: boolean }[]
) {
  const completed = checklist.filter((item) => item.completed).length

  return {
    completed,
    total: checklist.length,
  }
}
