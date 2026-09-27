import { isValidWorkItem, type WorkItem, type WorkItemStatus } from "../work-item/model.ts"
import type { ProjectWorkspaceState } from "./model"
import { moveWorkItemState, updateWorkItemDateRangeState, updateWorkItemState } from "./work-item-state.ts"

export type BulkWorkItemField = "dueDate" | "priority" | "boardId" | "labelIds"
export type BulkWorkItemChange = {
  field: BulkWorkItemField
  entries: {
    before: WorkItem
    after: WorkItem
    sourceStage: WorkItemStatus
    targetStage: WorkItemStatus
  }[]
}

export function captureBulkWorkItemChange(
  before: ProjectWorkspaceState,
  after: ProjectWorkspaceState,
  ids: readonly string[],
  field: BulkWorkItemField
): BulkWorkItemChange {
  return {
    field,
    entries: [...new Set(ids)].flatMap(id => {
      const previous = before.workItemsById[id]
      const current = after.workItemsById[id]
      return JSON.stringify(previous[field]) === JSON.stringify(current[field]) ? [] : [{
        before: structuredClone(previous), after: structuredClone(current),
        sourceStage: before.taskBoardsById[previous.boardId].stage,
        targetStage: after.taskBoardsById[current.boardId].stage,
      }]
    }),
  }
}

export function retainBulkWorkItemChange(change: BulkWorkItemChange | null, state: ProjectWorkspaceState) {
  return change?.entries.every(entry => state.workItemsById[entry.before.id]) ? change : null
}

export function undoBulkWorkItemChangeState(state: ProjectWorkspaceState, change: BulkWorkItemChange) {
  let next = state
  // Restore ascending source positions so multiple tasks regain their original order.
  const entries = change.field === "boardId"
    ? [...change.entries].sort((a, b) => a.before.boardId.localeCompare(b.before.boardId) || a.before.position - b.before.position)
    : change.entries
  for (const { before, after, sourceStage, targetStage } of entries) {
    const current = next.workItemsById[before.id]
    if (!current || !isValidWorkItem(current) || current.projectId !== before.projectId ||
      !next.projectsById[current.projectId] || next.projectsById[current.projectId].archived ||
      JSON.stringify(current[change.field]) !== JSON.stringify(after[change.field])) return state

    let restored: ProjectWorkspaceState
    switch (change.field) {
      case "boardId":
        if (next.taskBoardsById[before.boardId]?.stage !== sourceStage ||
          next.taskBoardsById[after.boardId]?.stage !== targetStage) return state
        restored = moveWorkItemState(next, current.id, before.boardId, before.position)
        break
      case "dueDate":
        restored = updateWorkItemDateRangeState(next, current.id, current.startDate, before.dueDate)
        break
      case "priority":
        restored = updateWorkItemState(next, current.id, { priority: before.priority })
        break
      case "labelIds":
        restored = updateWorkItemState(next, current.id, { labelIds: before.labelIds })
        break
    }
    if (restored === next) return state
    next = restored
  }
  return next
}
