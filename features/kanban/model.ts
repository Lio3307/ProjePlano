import type { TaskBoard } from "../project/task-board.ts"
import type { WorkItem } from "../work-item/model.ts"

const ITEM_PREFIX = "kanban-item:"
const BOARD_PREFIX = "kanban-board:"

export type KanbanBoardRecord = {
  board: TaskBoard
  workItems: WorkItem[]
}

export type KanbanDropDestination = {
  boardId: string
  index: number
}

export function buildKanbanBoards(
  boards: readonly TaskBoard[],
  workItems: readonly WorkItem[]
): KanbanBoardRecord[] {
  return boards.map((board) => ({
    board,
    workItems: workItems
      .filter((workItem) => workItem.boardId === board.id)
      .sort(
        (left, right) =>
          left.position - right.position ||
          left.id.localeCompare(right.id)
      ),
  }))
}

export function getKanbanWorkItemDragId(workItemId: string) {
  return ITEM_PREFIX + workItemId
}

export function getKanbanBoardDropId(boardId: string) {
  return BOARD_PREFIX + boardId
}

export function parseKanbanWorkItemDragId(value: string | number) {
  const normalized = String(value)

  if (!normalized.startsWith(ITEM_PREFIX)) {
    return null
  }

  const workItemId = normalized.slice(ITEM_PREFIX.length)

  return workItemId || null
}

export function getKanbanDropDestination(
  boards: readonly KanbanBoardRecord[],
  targetId: string | number
): KanbanDropDestination | null {
  const normalized = String(targetId)

  if (normalized.startsWith(BOARD_PREFIX)) {
    const boardId = normalized.slice(BOARD_PREFIX.length)
    const record = boards.find(
      (candidate) => candidate.board.id === boardId
    )

    return record
      ? { boardId, index: record.workItems.length }
      : null
  }

  const workItemId = parseKanbanWorkItemDragId(normalized)

  if (!workItemId) {
    return null
  }

  for (const record of boards) {
    const index = record.workItems.findIndex(
      (workItem) => workItem.id === workItemId
    )

    if (index >= 0) {
      return { boardId: record.board.id, index }
    }
  }

  return null
}
