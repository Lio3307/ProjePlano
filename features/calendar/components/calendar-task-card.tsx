"use client"

import { useDraggable } from "@dnd-kit/react"
import { GripVertical } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { WorkspaceMember } from "@/features/member/model"
import { WorkItemBlockedBadge } from "@/features/work-item/components/work-item-blocked-badge"
import {
  WorkItemAssignee,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
  WorkItemTypeBadge,
} from "@/features/work-item/components/work-item-meta"
import type { WorkItem, WorkItemStatus } from "@/features/work-item/model"
import { cn } from "@/lib/utils"
import { getCalendarTaskDragId } from "../model"

interface CalendarTaskCardProps {
  workItem: WorkItem
  status: WorkItemStatus
  assignee: WorkspaceMember | null
  blockingCount: number
  onOpen: (workItemId: string, trigger: HTMLElement) => void
}

export function CalendarTaskCard({
  workItem,
  status,
  assignee,
  blockingCount,
  onOpen,
}: CalendarTaskCardProps) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: getCalendarTaskDragId(workItem.id),
    type: "calendar-work-item",
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
          data-work-item-open-trigger={workItem.id}
          className="min-w-0 flex-1 space-y-2 p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label={"Open details for " + workItem.title}
          onClick={(event) =>
            onOpen(workItem.id, event.currentTarget)
          }
        >
          <h3 className="text-xs leading-4 font-medium">
            {workItem.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            <WorkItemStatusBadge status={status} />
            <WorkItemTypeBadge type={workItem.type} />
            <WorkItemPriorityBadge priority={workItem.priority} />
            <WorkItemBlockedBadge count={blockingCount} />
          </div>
          {assignee ? (
            <WorkItemAssignee assignee={assignee} />
          ) : null}
        </button>
        <button
          ref={handleRef}
          type="button"
          className="m-1.5 rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={"Reschedule " + workItem.title}
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}
