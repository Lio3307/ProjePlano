import type { KanbanPriority } from "../model"

const PRIORITY_LABELS: Record<KanbanPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const PRIORITY_STYLES: Record<KanbanPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
}

const LABEL_STYLES: Record<string, string> = {
  API: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  Backend:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  Docs: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  Frontend:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Product:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  Quality:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Research:
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  Security:
    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  UX: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
}

const FALLBACK_LABEL_STYLE =
  "bg-muted text-muted-foreground ring-1 ring-foreground/10"

export function KanbanPriorityBadge({
  priority,
}: {
  priority: KanbanPriority
}) {
  return (
    <span
      className={
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium " +
        PRIORITY_STYLES[priority]
      }
    >
      {PRIORITY_LABELS[priority]} priority
    </span>
  )
}

export function KanbanLabelList({ labels }: { labels: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Labels">
      {labels.map((label) => (
        <li
          key={label}
          className={
            "rounded-full px-2 py-0.5 text-[11px] font-medium " +
            (LABEL_STYLES[label] ?? FALLBACK_LABEL_STYLE)
          }
        >
          {label}
        </li>
      ))}
    </ul>
  )
}

export function formatKanbanDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date + "T00:00:00"))
}

export function getChecklistProgress(checklist: { completed: boolean }[]) {
  const completed = checklist.filter((item) => item.completed).length

  return {
    completed,
    total: checklist.length,
  }
}
