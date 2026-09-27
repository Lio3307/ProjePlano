import { Card } from "@/components/ui/card"
import {
  resolveBoardLabels,
  type BoardLabel,
} from "@/features/project/board"
import { WorkItemBlockedBadge } from "@/features/work-item/components/work-item-blocked-badge"
import {
  WorkItemLabelList,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
  WorkItemTypeBadge,
} from "@/features/work-item/components/work-item-meta"
import type { WorkItemStagesByBoardId } from "@/features/work-item/dependencies"
import { getCalendarDateLabel } from "../date-utils"
import type { CalendarAgendaGroup } from "../model"

interface CalendarAgendaProps {
  groups: readonly CalendarAgendaGroup[]
  labels: readonly BoardLabel[]
  stagesByBoardId: WorkItemStagesByBoardId
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
}

export function CalendarAgenda({
  groups,
  labels,
  stagesByBoardId,
  blockingCountsByWorkItemId,
  onOpenWorkItem,
}: CalendarAgendaProps) {
  return (
    <section aria-label="Monthly task agenda" data-calendar-agenda>
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background px-4 py-8 text-center">
          <h3 className="text-sm font-medium">No tasks this month</h3>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-background">
          {groups.map((group) => (
            <section key={group.isoDate} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <time
                  dateTime={group.isoDate}
                  className="text-sm font-semibold"
                >
                  {getCalendarDateLabel(group.isoDate)}
                </time>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {group.workItems.length}{" "}
                  {group.workItems.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {group.workItems.map((workItem) => (
                  <li key={workItem.id}>
                    <Card size="sm" className="gap-0 py-0 shadow-none">
                      <button
                        type="button"
                        data-work-item-open-trigger={workItem.id}
                        className="min-h-11 w-full space-y-2 rounded-xl p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        aria-label={"Open details for " + workItem.title}
                        onClick={(event) =>
                          onOpenWorkItem(workItem.id, event.currentTarget)
                        }
                      >
                        <WorkItemLabelList
                          labels={resolveBoardLabels(labels, workItem.labelIds)}
                        />
                        <h3 className="break-words text-sm leading-5 font-medium [overflow-wrap:anywhere]">
                          {workItem.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          <WorkItemStatusBadge
                            status={stagesByBoardId[workItem.boardId]}
                          />
                          <WorkItemTypeBadge type={workItem.type} />
                          <WorkItemPriorityBadge
                            priority={workItem.priority}
                          />
                          <WorkItemBlockedBadge
                            count={
                              blockingCountsByWorkItemId[workItem.id] ?? 0
                            }
                          />
                        </div>
                      </button>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
