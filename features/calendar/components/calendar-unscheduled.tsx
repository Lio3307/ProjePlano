import {
  WorkItemAssignee,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
  WorkItemTypeBadge,
} from "@/features/work-item/components/work-item-meta"
import type { WorkItem } from "@/features/work-item/model"

interface CalendarUnscheduledProps {
  workItems: readonly WorkItem[]
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
}

export function CalendarUnscheduled({
  workItems,
  onOpenWorkItem,
}: CalendarUnscheduledProps) {
  return (
    <section
      className="rounded-xl border bg-background p-3"
      aria-labelledby="unscheduled-heading"
      data-calendar-unscheduled
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="unscheduled-heading" className="text-sm font-semibold">
          Unscheduled
        </h2>
        <span className="text-xs text-muted-foreground">
          {workItems.length} tasks
        </span>
      </div>

      {workItems.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          All tasks have a due date.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 lg:grid-cols-2">
          {workItems.map((workItem) => (
            <li key={workItem.id}>
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-muted/45 p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) =>
                  onOpenWorkItem(workItem.id, event.currentTarget)
                }
              >
                <span className="min-w-40 flex-1 font-medium">
                  {workItem.title}
                </span>
                <WorkItemStatusBadge status={workItem.status} />
                <WorkItemTypeBadge type={workItem.type} />
                <WorkItemPriorityBadge priority={workItem.priority} />
                <WorkItemAssignee assignee={workItem.assignee} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
