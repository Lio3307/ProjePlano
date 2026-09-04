import {
  isValidWorkItem,
  isValidWorkItemDateRange,
  wouldCreateDependencyCycle,
  type EditableWorkItemFields,
  type WorkItem,
} from "../work-item/model.ts"
import type { ProjectWorkspaceState } from "./model"
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
  >
>

export type CreateAndLinkWorkItemDocumentInput = {
  id: string
  workItemId: string
  title: string
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

  if (workItem.assigneeId !== null) {
    const member = state.membersById[workItem.assigneeId]

    if (!member || member.workspaceId !== project.workspaceId) {
      return false
    }
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
