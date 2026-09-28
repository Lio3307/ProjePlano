import type { WorkItemStagesByBoardId } from "./dependencies"
import type { WorkItem, WorkItemPriority, WorkItemStatus } from "./model"

export type WorkItemFilters = {
  query: string
  labelId: string | null
  priority: WorkItemPriority | null
  status: WorkItemStatus | null
}

export function createWorkItemFilters(): WorkItemFilters {
  return { query: "", labelId: null, priority: null, status: null }
}

export function filterWorkItems(
  workItems: readonly WorkItem[],
  stagesByBoardId: WorkItemStagesByBoardId,
  filters: WorkItemFilters
): WorkItem[] {
  const query = filters.query.trim().toLowerCase()

  return workItems.filter(
    (workItem) =>
      !workItem.archived &&
      workItem.title.toLowerCase().includes(query) &&
      (filters.labelId === null || workItem.labelIds.includes(filters.labelId)) &&
      (filters.priority === null || workItem.priority === filters.priority) &&
      (filters.status === null || stagesByBoardId[workItem.boardId] === filters.status)
  )
}
