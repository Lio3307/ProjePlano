import {
  resolveBoardLabels,
  type BoardLabel,
} from "@/features/project/board"
import {
  WorkItemLabelList,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
  WorkItemTypeBadge,
} from "@/features/work-item/components/work-item-meta"
import { WorkItemBlockedBadge } from "@/features/work-item/components/work-item-blocked-badge"
import type { WorkItemStagesByBoardId } from "@/features/work-item/dependencies"
import type { WorkItem } from "@/features/work-item/model"

interface CalendarUnscheduledProps {
  workItems: readonly WorkItem[]
  labels: readonly BoardLabel[]
  stagesByBoardId: WorkItemStagesByBoardId
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
}

export function CalendarUnscheduled({
  workItems,
  labels,
  stagesByBoardId,
  blockingCountsByWorkItemId,
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
                data-work-item-open-trigger={workItem.id}
                className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-muted/45 p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) =>
                  onOpenWorkItem(workItem.id, event.currentTarget)
                }
              >
                <WorkItemLabelList
                  labels={resolveBoardLabels(labels, workItem.labelIds)}
                />
                <span className="min-w-0 basis-40 flex-1 font-medium wrap-anywhere">
                  {workItem.title}
                </span>
                <WorkItemStatusBadge
                  status={stagesByBoardId[workItem.boardId]}
                />
                <WorkItemTypeBadge type={workItem.type} />
                <WorkItemPriorityBadge priority={workItem.priority} />
                <WorkItemBlockedBadge
                  count={blockingCountsByWorkItemId[workItem.id] ?? 0}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
