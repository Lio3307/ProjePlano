"use client"

import { useDraggable, useDroppable } from "@dnd-kit/react"
import {
  CalendarDays,
  CheckSquare,
  FileText,
  GripVertical,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import {
  resolveBoardLabels,
  type BoardLabel,
} from "@/features/project/board"
import { WorkItemBlockedBadge } from "@/features/work-item/components/work-item-blocked-badge"
import {
  WorkItemLabelList,
  WorkItemPriorityBadge,
  WorkItemTypeBadge,
  formatWorkItemDate,
  getWorkItemChecklistProgress,
} from "@/features/work-item/components/work-item-meta"
import type { WorkItem } from "@/features/work-item/model"
import { cn } from "@/lib/utils"
import { getKanbanWorkItemDragId } from "../model"

interface KanbanCardProps {
  workItem: WorkItem
  labels: readonly BoardLabel[]
  blockingCount: number
  onOpen: (workItemId: string, trigger: HTMLElement) => void
}

export function KanbanCard({
  workItem,
  labels,
  blockingCount,
  onOpen,
}: KanbanCardProps) {
  const dragId = getKanbanWorkItemDragId(workItem.id)
  const {
    ref: dragRef,
    handleRef,
    isDragging,
  } = useDraggable({
    id: dragId,
    type: "kanban-work-item",
  })
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: dragId,
    collisionPriority: 1,
  })
  const progress = getWorkItemChecklistProgress(workItem.checklist)
  const resolvedLabels = resolveBoardLabels(labels, workItem.labelIds)

  return (
    <div
      ref={dropRef}
      className={cn(
        "rounded-lg transition-colors motion-reduce:transition-none",
        isDropTarget && "bg-primary/10 ring-2 ring-primary/40"
      )}
    >
      <Card
        ref={dragRef}
        size="sm"
        className={cn(
          "gap-0 py-0 shadow-sm transition-opacity motion-reduce:transition-none",
          isDragging && "opacity-45"
        )}
      >
        <div className="flex items-start">
          <button
            type="button"
            data-work-item-open-trigger={workItem.id}
            className="min-w-0 flex-1 space-y-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            aria-label={"Open details for " + workItem.title}
            onClick={(event) =>
              onOpen(workItem.id, event.currentTarget)
            }
          >
            <WorkItemLabelList labels={resolvedLabels} />

            <div className="space-y-1">
              <h3 className="break-words text-sm leading-5 font-medium [overflow-wrap:anywhere]">
                {workItem.title}
              </h3>
              {workItem.description ? (
                <p className="line-clamp-2 break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
                  {workItem.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <WorkItemTypeBadge type={workItem.type} />
              <WorkItemPriorityBadge priority={workItem.priority} />
              <WorkItemBlockedBadge count={blockingCount} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {workItem.dueDate ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  {workItem.startDate && workItem.dueDate ? (
                    <>
                      {formatWorkItemDate(workItem.startDate)}
                      {" – "}
                      {formatWorkItemDate(workItem.dueDate)}
                    </>
                  ) : (
                    formatWorkItemDate(workItem.dueDate)
                  )}
                </span>
              ) : null}
              {workItem.linkedResourceIds.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" aria-hidden="true" />
                  {workItem.linkedResourceIds.length}
                  <span className="sr-only"> linked documents</span>
                </span>
              ) : null}
              {progress.total > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <CheckSquare
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  {progress.completed}/{progress.total}
                </span>
              ) : null}
            </div>
          </button>

          <button
            ref={handleRef}
            type="button"
            className="m-2 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={"Drag " + workItem.title}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  )
}
