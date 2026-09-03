import {
  WORK_ITEM_STATUSES,
  isWorkItemStatus,
  type WorkItem,
  type WorkItemStatus,
} from "../work-item/model.ts"

const COLUMN_TITLES: Record<WorkItemStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  testing: "Testing",
  done: "Done",
}

const ITEM_PREFIX = "kanban-item:"
const COLUMN_PREFIX = "kanban-column:"

export type KanbanColumnRecord = {
  status: WorkItemStatus
  title: string
  workItems: WorkItem[]
}

export type KanbanDropDestination = {
  status: WorkItemStatus
  index: number
}

export function buildKanbanColumns(
  workItems: readonly WorkItem[]
): KanbanColumnRecord[] {
  return WORK_ITEM_STATUSES.map((status) => ({
    status,
    title: COLUMN_TITLES[status],
    workItems: workItems
      .filter((workItem) => workItem.status === status)
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

export function getKanbanColumnDropId(status: WorkItemStatus) {
  return COLUMN_PREFIX + status
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
  columns: readonly KanbanColumnRecord[],
  targetId: string | number
): KanbanDropDestination | null {
  const normalized = String(targetId)

  if (normalized.startsWith(COLUMN_PREFIX)) {
    const status = normalized.slice(COLUMN_PREFIX.length)
    const column = isWorkItemStatus(status)
      ? columns.find((candidate) => candidate.status === status)
      : undefined

    return column
      ? { status: column.status, index: column.workItems.length }
      : null
  }

  const workItemId = parseKanbanWorkItemDragId(normalized)

  if (!workItemId) {
    return null
  }

  for (const column of columns) {
    const index = column.workItems.findIndex(
      (workItem) => workItem.id === workItemId
    )

    if (index >= 0) {
      return { status: column.status, index }
    }
  }

  return null
}
