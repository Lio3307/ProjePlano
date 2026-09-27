"use client"

import { DragDropProvider } from "@dnd-kit/react"

import type { ProjectBoardView } from "@/features/project/model"
import type { TaskBoard } from "@/features/project/task-board"
import { getBlockingDependencyCounts } from "@/features/work-item/dependencies"
import type { WorkItem } from "@/features/work-item/model"
import {
  buildKanbanBoards,
  getKanbanDropDestination,
  parseKanbanWorkItemDragId,
} from "../model"
import { KanbanBoard } from "./kanban-board"

interface KanbanViewProps {
  workItems: readonly WorkItem[]
  board: ProjectBoardView
  boards: readonly TaskBoard[]
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
  onMoveWorkItem: (
    workItemId: string,
    boardId: string,
    index: number
  ) => void
  onAddTask: (boardId: string, trigger: HTMLElement) => void
  onAddBoard: (trigger: HTMLElement) => void
  onEditBoard: (boardId: string, trigger: HTMLElement) => void
  onSetLabels: (trigger: HTMLElement) => void
}

export function KanbanView({
  workItems,
  board,
  boards,
  onOpenWorkItem,
  onMoveWorkItem,
  onAddTask,
  onAddBoard,
  onEditBoard,
  onSetLabels,
}: KanbanViewProps) {
  const records = buildKanbanBoards(boards, workItems)
  const stagesByBoardId = Object.fromEntries(
    boards.map((taskBoard) => [taskBoard.id, taskBoard.stage])
  )
  const blockingCountsByWorkItemId = getBlockingDependencyCounts(
    workItems,
    stagesByBoardId
  )

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
        const destination = getKanbanDropDestination(records, targetId)

        if (workItemId && destination) {
          onMoveWorkItem(
            workItemId,
            destination.boardId,
            destination.index
          )
        }
      }}
    >
      <KanbanBoard
        columns={records}
        board={board}
        blockingCountsByWorkItemId={blockingCountsByWorkItemId}
        onOpenWorkItem={onOpenWorkItem}
        onAddTask={onAddTask}
        onAddBoard={onAddBoard}
        onEditBoard={onEditBoard}
        onSetLabels={onSetLabels}
      />
    </DragDropProvider>
  )
}
