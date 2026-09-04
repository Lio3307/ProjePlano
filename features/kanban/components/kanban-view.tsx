"use client"

import { DragDropProvider } from "@dnd-kit/react"

import type { WorkspaceMember } from "@/features/member/model"
import type {
  WorkItem,
  WorkItemStatus,
} from "@/features/work-item/model"
import { getBlockingDependencyCounts } from "@/features/work-item/dependencies"
import {
  buildKanbanColumns,
  getKanbanDropDestination,
  parseKanbanWorkItemDragId,
} from "../model"
import { KanbanBoard } from "./kanban-board"

interface KanbanViewProps {
  workItems: readonly WorkItem[]
  membersById: Readonly<Record<string, WorkspaceMember>>
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
  onMoveWorkItem: (
    workItemId: string,
    status: WorkItemStatus,
    index: number
  ) => void
}

export function KanbanView({
  workItems,
  membersById,
  onOpenWorkItem,
  onMoveWorkItem,
}: KanbanViewProps) {
  const columns = buildKanbanColumns(workItems)
  const blockingCountsByWorkItemId =
    getBlockingDependencyCounts(workItems)

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) {
          return
        }

        const sourceId = event.operation.source?.id
        const targetId = event.operation.target?.id

        if (sourceId == null || targetId == null) {
          return
        }

        const workItemId = parseKanbanWorkItemDragId(sourceId)
        const destination = getKanbanDropDestination(columns, targetId)

        if (workItemId && destination) {
          onMoveWorkItem(
            workItemId,
            destination.status,
            destination.index
          )
        }
      }}
    >
      <KanbanBoard
        columns={columns}
        membersById={membersById}
        blockingCountsByWorkItemId={blockingCountsByWorkItemId}
        onOpenWorkItem={onOpenWorkItem}
      />
    </DragDropProvider>
  )
}
