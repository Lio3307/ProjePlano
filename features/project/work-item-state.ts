import {
  isValidWorkItem,
  isValidWorkItemDate,
  isValidWorkItemDateRange,
  wouldCreateDependencyCycle,
  WORK_ITEM_PRIORITIES,
  type EditableWorkItemFields,
  type WorkItem,
  type WorkItemPriority,
} from "../work-item/model.ts"
import type { ProjectWorkspaceState } from "./model"
import type { TaskPlan, TimeEntry } from "./planning"
import { addProjectDocumentState } from "./project-state.ts"

export type WorkItemDetailsPatch = Partial<
  Omit<
    WorkItem,
    | "id"
    | "projectId"
    | "boardId"
    | "position"
    | "startDate"
    | "dueDate"
    | "archived"
  >
>

export type CreateAndLinkWorkItemDocumentInput = {
  id: string
  workItemId: string
  title: string
}

export type WorkItemDeletion = {
  planning?: { task: TaskPlan | null; entries: TimeEntry[] }
  workItem: WorkItem
  dependents: { id: string; dependencyIndex: number }[]
}

export type WorkItemCompletion = {
  workItemId: string
  title: string
  projectId: string
  sourceBoardId: string
  targetBoardId: string
  position: number
}

export function createWorkItemState(
  state: ProjectWorkspaceState,
  workItem: WorkItem
) {
  const detachedWorkItem = structuredClone(workItem)

  if (
    state.workItemsById[detachedWorkItem.id] ||
    !state.projectsById[detachedWorkItem.projectId] ||
    !isValidWorkItem(detachedWorkItem)
  ) {
    return state
  }

  const boardItems = getOrderedBoardItems(
    state.workItemsById,
    detachedWorkItem.projectId,
    detachedWorkItem.boardId
  )
  const insertIndex = clampIndex(
    detachedWorkItem.position,
    boardItems.length
  )
  const candidate = { ...detachedWorkItem, position: insertIndex }

  if (!hasValidReferences(state, candidate)) {
    return state
  }

  const nextBoardItems = [...boardItems]
  nextBoardItems.splice(insertIndex, 0, candidate)

  const nextWorkItems = { ...state.workItemsById }
  writeOrderedItems(nextWorkItems, nextBoardItems)

  return { ...state, workItemsById: nextWorkItems }
}

export function setWorkItemArchivedState(state: ProjectWorkspaceState, workItemId: string, archived: boolean) {
  const item = state.workItemsById[workItemId]
  if (!item || typeof archived !== "boolean" || Boolean(item.archived) === archived ||
    (archived && state.taskBoardsById[item.boardId]?.stage !== "done") ||
    !isValidWorkItem(item) || !hasValidReferences(state, item)) return state
  return { ...state, workItemsById: { ...state.workItemsById, [item.id]: { ...item, archived } } }
}

export function updateWorkItemState(
  state: ProjectWorkspaceState,
  workItemId: string,
  patch: WorkItemDetailsPatch
) {
  const current = state.workItemsById[workItemId]

  if (!current || Object.keys(patch).length === 0) {
    return state
  }

  const candidate = structuredClone({ ...current, ...patch })

  if (
    haveSameWorkItemValue(current, candidate) ||
    !isValidWorkItem(candidate) ||
    !hasValidReferences(state, candidate)
  ) {
    return state
  }

  return {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [workItemId]: candidate,
    },
  }
}

export function saveWorkItemState(
  state: ProjectWorkspaceState,
  workItemId: string,
  fields: EditableWorkItemFields
) {
  const current = state.workItemsById[workItemId]

  if (!current) {
    return state
  }

  const candidate = structuredClone({ ...current, ...fields })

  if (
    haveSameWorkItemValue(current, candidate) ||
    !isValidWorkItem(candidate) ||
    !hasValidReferences(state, candidate)
  ) {
    return state
  }

  return {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [workItemId]: candidate,
    },
  }
}

export function moveWorkItemState(
  state: ProjectWorkspaceState,
  workItemId: string,
  targetBoardId: string,
  index: number
) {
  const current = state.workItemsById[workItemId]
  const sourceBoard = current
    ? state.taskBoardsById[current.boardId]
    : undefined
  const targetBoard = state.taskBoardsById[targetBoardId]

  if (
    !current ||
    !sourceBoard ||
    !targetBoard ||
    sourceBoard.projectId !== current.projectId ||
    targetBoard.projectId !== current.projectId ||
    sourceBoard.viewId !== targetBoard.viewId ||
    !Number.isInteger(index) ||
    !hasValidReferences(state, current)
  ) {
    return state
  }

  const sourceItems = getOrderedBoardItems(
    state.workItemsById,
    current.projectId,
    current.boardId
  )
  const sourceWithoutCurrent = sourceItems.filter(
    (workItem) => workItem.id !== current.id
  )

  if (current.boardId === targetBoardId) {
    const insertIndex = clampIndex(index, sourceWithoutCurrent.length)
    const nextBoardItems = [...sourceWithoutCurrent]
    nextBoardItems.splice(insertIndex, 0, current)

    if (haveSameOrder(sourceItems, nextBoardItems)) {
      return state
    }

    const nextWorkItems = { ...state.workItemsById }
    writeOrderedItems(nextWorkItems, nextBoardItems)
    return { ...state, workItemsById: nextWorkItems }
  }

  const targetItems = getOrderedBoardItems(
    state.workItemsById,
    current.projectId,
    targetBoardId
  )
  const insertIndex = clampIndex(index, targetItems.length)
  const movedWorkItem = {
    ...current,
    ...(current.archived ? { archived: false } : {}),
    boardId: targetBoardId,
    position: insertIndex,
  }

  if (!hasValidReferences(state, movedWorkItem)) {
    return state
  }

  const nextTargetItems = [...targetItems]
  nextTargetItems.splice(insertIndex, 0, movedWorkItem)

  const nextWorkItems = { ...state.workItemsById }
  writeOrderedItems(nextWorkItems, sourceWithoutCurrent)
  writeOrderedItems(nextWorkItems, nextTargetItems)

  return { ...state, workItemsById: nextWorkItems }
}

export function completeWorkItemState(
  state: ProjectWorkspaceState,
  workItemId: string,
  targetBoardId: string
) {
  const workItem = state.workItemsById[workItemId]
  if (!workItem || state.projectsById[workItem.projectId]?.archived ||
    state.taskBoardsById[workItem.boardId]?.stage === "done" ||
    state.taskBoardsById[targetBoardId]?.stage !== "done") return state

  const targetItems = getOrderedBoardItems(state.workItemsById, workItem.projectId, targetBoardId)
  return moveWorkItemState(state, workItemId, targetBoardId, targetItems.length)
}

export function undoWorkItemCompletionState(
  state: ProjectWorkspaceState,
  completion: WorkItemCompletion
) {
  const workItem = state.workItemsById[completion.workItemId]
  if (!workItem || workItem.projectId !== completion.projectId ||
    workItem.boardId !== completion.targetBoardId ||
    state.taskBoardsById[completion.targetBoardId]?.stage !== "done" ||
    state.taskBoardsById[completion.sourceBoardId]?.stage === "done") return state

  return moveWorkItemState(state, workItem.id, completion.sourceBoardId, completion.position)
}

export function updateWorkItemDateRangeState(
  state: ProjectWorkspaceState,
  workItemId: string,
  startDate: string | null,
  dueDate: string | null
) {
  const current = state.workItemsById[workItemId]

  if (
    !current ||
    !isValidWorkItemDateRange(startDate, dueDate) ||
    (current.startDate === startDate && current.dueDate === dueDate) ||
    !hasValidReferences(state, current)
  ) {
    return state
  }

  const candidate = { ...current, startDate, dueDate }

  return {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [workItemId]: candidate,
    },
  }
}

export function updateWorkItemDueDatesState(
  state: ProjectWorkspaceState,
  workItemIds: readonly string[],
  dueDate: string
) {
  if (!isValidWorkItemDate(dueDate) || workItemIds.length === 0) return state

  const workItemsById = { ...state.workItemsById }
  let changed = false
  for (const id of new Set(workItemIds)) {
    const workItem = state.workItemsById[id]
    if (!workItem || state.projectsById[workItem.projectId]?.archived ||
      state.taskBoardsById[workItem.boardId]?.stage === "done" ||
      !isValidWorkItemDateRange(workItem.startDate, dueDate) || !hasValidReferences(state, workItem)) {
      return state
    }
    if (workItem.dueDate !== dueDate) {
      workItemsById[id] = { ...workItem, dueDate }
      changed = true
    }
  }
  return changed ? { ...state, workItemsById } : state
}

export function updateWorkItemPrioritiesState(
  state: ProjectWorkspaceState,
  workItemIds: readonly string[],
  priority: WorkItemPriority
) {
  if (!WORK_ITEM_PRIORITIES.includes(priority) || workItemIds.length === 0) return state

  const workItemsById = { ...state.workItemsById }
  let changed = false
  for (const id of new Set(workItemIds)) {
    const workItem = state.workItemsById[id]
    if (!workItem || state.projectsById[workItem.projectId]?.archived ||
      state.taskBoardsById[workItem.boardId]?.stage === "done" ||
      !isValidWorkItem(workItem) || !hasValidReferences(state, workItem)) return state
    if (workItem.priority !== priority) {
      workItemsById[id] = { ...workItem, priority }
      changed = true
    }
  }
  return changed ? { ...state, workItemsById } : state
}

export function moveWorkItemsState(
  state: ProjectWorkspaceState,
  workItemIds: readonly string[],
  targetBoardId: string
) {
  const target = state.taskBoardsById[targetBoardId]
  if (!target || workItemIds.length === 0) return state

  let next = state
  for (const id of new Set(workItemIds)) {
    const workItem = next.workItemsById[id]
    const source = workItem ? next.taskBoardsById[workItem.boardId] : undefined
    if (!workItem || !source || source.stage === "done" ||
      state.projectsById[workItem.projectId]?.archived ||
      workItem.projectId !== target.projectId || source.viewId !== target.viewId ||
      !isValidWorkItem(workItem) || !hasValidReferences(next, workItem)) return state
    if (workItem.boardId === targetBoardId) continue

    const position = getOrderedBoardItems(next.workItemsById, workItem.projectId, targetBoardId).length
    const moved = moveWorkItemState(next, id, targetBoardId, position)
    if (moved === next) return state
    next = moved
  }
  return next
}

export function updateWorkItemLabelsState(
  state: ProjectWorkspaceState,
  workItemIds: readonly string[],
  labelId: string,
  operation: "add" | "remove"
) {
  if (workItemIds.length === 0 || (operation !== "add" && operation !== "remove")) return state
  const projectId = state.workItemsById[workItemIds[0]]?.projectId
  const workItemsById = { ...state.workItemsById }
  let changed = false
  for (const id of new Set(workItemIds)) {
    const item = state.workItemsById[id]
    const board = item ? state.taskBoardsById[item.boardId] : undefined
    const view = board ? state.projectViewsById[board.viewId] : undefined
    if (!item || item.projectId !== projectId || !board || board.stage === "done" ||
      state.projectsById[item.projectId]?.archived || view?.type !== "board" ||
      !view.labels.some(label => label.id === labelId) ||
      !isValidWorkItem(item) || !hasValidReferences(state, item)) return state
    const hasLabel = item.labelIds.includes(labelId)
    if (hasLabel === (operation === "add")) continue
    workItemsById[id] = { ...item, labelIds: operation === "add"
      ? [...item.labelIds, labelId] : item.labelIds.filter(id => id !== labelId) }
    changed = true
  }
  return changed ? { ...state, workItemsById } : state
}

export function linkWorkItemDocumentState(
  state: ProjectWorkspaceState,
  workItemId: string,
  resourceId: string
) {
  const current = state.workItemsById[workItemId]
  const resource = state.resourcesById[resourceId]

  if (
    !current ||
    !resource ||
    resource.type !== "document" ||
    resource.projectId !== current.projectId ||
    current.linkedResourceIds.includes(resourceId)
  ) {
    return state
  }

  const candidate = {
    ...current,
    linkedResourceIds: [...current.linkedResourceIds, resourceId],
  }

  if (!isValidWorkItem(candidate) || !hasValidReferences(state, candidate)) {
    return state
  }

  return {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [workItemId]: candidate,
    },
  }
}

export function unlinkWorkItemDocumentState(
  state: ProjectWorkspaceState,
  workItemId: string,
  resourceId: string
) {
  const current = state.workItemsById[workItemId]

  if (!current || !current.linkedResourceIds.includes(resourceId)) {
    return state
  }

  return {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [workItemId]: {
        ...current,
        linkedResourceIds: current.linkedResourceIds.filter(
          (candidateId) => candidateId !== resourceId
        ),
      },
    },
  }
}

export function createAndLinkWorkItemDocumentState(
  state: ProjectWorkspaceState,
  input: CreateAndLinkWorkItemDocumentInput
) {
  const workItem = state.workItemsById[input.workItemId]

  if (
    !workItem ||
    !isValidWorkItem(workItem) ||
    !hasValidReferences(state, workItem)
  ) {
    return state
  }

  const withDocument = addProjectDocumentState(state, {
    id: input.id,
    projectId: workItem.projectId,
    title: input.title,
  })

  if (withDocument === state) {
    return state
  }

  const linked = linkWorkItemDocumentState(
    withDocument,
    input.workItemId,
    input.id
  )

  return linked === withDocument ? state : linked
}

export function deleteWorkItemState(
  state: ProjectWorkspaceState,
  workItemId: string
) {
  const current = state.workItemsById[workItemId]

  if (!current) {
    return state
  }

  const nextWorkItems = { ...state.workItemsById }
  delete nextWorkItems[workItemId]

  for (const workItem of Object.values(nextWorkItems)) {
    if (workItem.dependencyIds.includes(workItemId)) {
      nextWorkItems[workItem.id] = {
        ...workItem,
        dependencyIds: workItem.dependencyIds.filter(
          (dependencyId) => dependencyId !== workItemId
        ),
      }
    }
  }

  const remainingBoardItems = getOrderedBoardItems(
    nextWorkItems,
    current.projectId,
    current.boardId
  )
  writeOrderedItems(nextWorkItems, remainingBoardItems)

  return { ...state, workItemsById: nextWorkItems }
}

export function restoreDeletedWorkItemState(
  state: ProjectWorkspaceState,
  deletion: WorkItemDeletion
) {
  const restored = createWorkItemState(state, deletion.workItem)
  if (restored === state) return state

  const workItemsById = { ...restored.workItemsById }
  for (const { id, dependencyIndex } of deletion.dependents) {
    const dependent = workItemsById[id]
    if (!dependent) return state
    if (dependent.dependencyIds.includes(deletion.workItem.id)) continue

    const dependencyIds = [...dependent.dependencyIds]
    dependencyIds.splice(dependencyIndex, 0, deletion.workItem.id)
    workItemsById[id] = { ...dependent, dependencyIds }
  }

  const candidate = { ...restored, workItemsById }
  const affectedIds = [deletion.workItem.id, ...deletion.dependents.map(item => item.id)]
  // Validate the complete restored dependency graph before publishing any changes.
  return affectedIds.every(id => hasValidReferences(candidate, workItemsById[id]))
    ? candidate
    : state
}

function hasValidReferences(
  state: ProjectWorkspaceState,
  workItem: WorkItem
) {
  const project = state.projectsById[workItem.projectId]
  const board = state.taskBoardsById[workItem.boardId]
  const boardView = board
    ? state.projectViewsById[board.viewId]
    : undefined

  if (
    !project ||
    !board ||
    (workItem.archived === true && board.stage !== "done") ||
    boardView?.type !== "board" ||
    board.projectId !== workItem.projectId ||
    boardView.projectId !== workItem.projectId ||
    !project.viewIds.includes(boardView.id) ||
    !boardView.boardIds.includes(board.id)
  ) {
    return false
  }

  const boardLabelIds = new Set(
    boardView.labels.map((label) => label.id)
  )

  if (workItem.labelIds.some((labelId) => !boardLabelIds.has(labelId))) {
    return false
  }

  if (workItem.milestoneId !== null) {
    const milestone = state.milestonesById[workItem.milestoneId]

    if (!milestone || milestone.projectId !== workItem.projectId) {
      return false
    }
  }

  if (hasDuplicates(workItem.linkedResourceIds)) {
    return false
  }

  for (const resourceId of workItem.linkedResourceIds) {
    const resource = state.resourcesById[resourceId]

    if (
      !resource ||
      resource.type !== "document" ||
      resource.projectId !== workItem.projectId ||
      !project.resourceIds.includes(resourceId)
    ) {
      return false
    }
  }

  if (hasDuplicates(workItem.dependencyIds)) {
    return false
  }

  for (const dependencyId of workItem.dependencyIds) {
    const dependency = state.workItemsById[dependencyId]

    if (
      dependencyId === workItem.id ||
      !dependency ||
      dependency.projectId !== workItem.projectId
    ) {
      return false
    }
  }

  const candidateItems = {
    ...state.workItemsById,
    [workItem.id]: workItem,
  }

  return !wouldCreateDependencyCycle(
    candidateItems,
    workItem.id,
    workItem.dependencyIds
  )
}

function getOrderedBoardItems(
  workItemsById: Readonly<Record<string, WorkItem>>,
  projectId: string,
  boardId: string
) {
  return Object.values(workItemsById)
    .filter(
      (workItem) =>
        workItem.projectId === projectId &&
        workItem.boardId === boardId
    )
    .sort(
      (left, right) =>
        left.position - right.position || left.id.localeCompare(right.id)
    )
}

function writeOrderedItems(
  workItemsById: Record<string, WorkItem>,
  workItems: WorkItem[]
) {
  workItems.forEach((workItem, position) => {
    workItemsById[workItem.id] =
      workItem.position === position
        ? workItem
        : { ...workItem, position }
  })
}

function haveSameOrder(left: WorkItem[], right: WorkItem[]) {
  return (
    left.length === right.length &&
    left.every((workItem, index) => workItem.id === right[index]?.id)
  )
}

function haveSameWorkItemValue(left: WorkItem, right: WorkItem) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length
}

function clampIndex(index: number, maximum: number) {
  return Math.min(Math.max(index, 0), maximum)
}
