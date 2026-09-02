import {
  isValidWorkItem,
  isValidWorkItemDateRange,
  isWorkItemStatus,
  wouldCreateDependencyCycle,
  type WorkItem,
  type WorkItemStatus,
} from "../work-item/model.ts"
import type { ProjectWorkspaceState } from "./model"

export type WorkItemDetailsPatch = Partial<
  Omit<
    WorkItem,
    "id" | "projectId" | "status" | "position" | "startDate" | "dueDate"
  >
>

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

  const statusItems = getOrderedStatusItems(
    state.workItemsById,
    detachedWorkItem.projectId,
    detachedWorkItem.status
  )
  const insertIndex = clampIndex(
    detachedWorkItem.position,
    statusItems.length
  )
  const candidate = { ...detachedWorkItem, position: insertIndex }

  if (!hasValidReferences(state, candidate)) {
    return state
  }

  const nextStatusItems = [...statusItems]
  nextStatusItems.splice(insertIndex, 0, candidate)

  const nextWorkItems = { ...state.workItemsById }
  writeOrderedItems(nextWorkItems, nextStatusItems, candidate.status)

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

export function moveWorkItemState(
  state: ProjectWorkspaceState,
  workItemId: string,
  status: WorkItemStatus,
  index: number
) {
  const current = state.workItemsById[workItemId]

  if (!current || !isWorkItemStatus(status) || !Number.isInteger(index)) {
    return state
  }

  const sourceItems = getOrderedStatusItems(
    state.workItemsById,
    current.projectId,
    current.status
  )
  const sourceWithoutCurrent = sourceItems.filter(
    (workItem) => workItem.id !== current.id
  )

  if (current.status === status) {
    const insertIndex = clampIndex(index, sourceWithoutCurrent.length)
    const nextStatusItems = [...sourceWithoutCurrent]
    nextStatusItems.splice(insertIndex, 0, current)

    if (haveSameOrder(sourceItems, nextStatusItems)) {
      return state
    }

    const nextWorkItems = { ...state.workItemsById }
    writeOrderedItems(nextWorkItems, nextStatusItems, status)
    return { ...state, workItemsById: nextWorkItems }
  }

  const targetItems = getOrderedStatusItems(
    state.workItemsById,
    current.projectId,
    status
  )
  const insertIndex = clampIndex(index, targetItems.length)
  const movedWorkItem = { ...current, status, position: insertIndex }
  const nextTargetItems = [...targetItems]
  nextTargetItems.splice(insertIndex, 0, movedWorkItem)

  const nextWorkItems = { ...state.workItemsById }
  writeOrderedItems(nextWorkItems, sourceWithoutCurrent, current.status)
  writeOrderedItems(nextWorkItems, nextTargetItems, status)

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
    (current.startDate === startDate && current.dueDate === dueDate)
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

  const remainingStatusItems = getOrderedStatusItems(
    nextWorkItems,
    current.projectId,
    current.status
  )
  writeOrderedItems(nextWorkItems, remainingStatusItems, current.status)

  return { ...state, workItemsById: nextWorkItems }
}

function hasValidReferences(
  state: ProjectWorkspaceState,
  workItem: WorkItem
) {
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

    if (!resource || resource.projectId !== workItem.projectId) {
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

function getOrderedStatusItems(
  workItemsById: Readonly<Record<string, WorkItem>>,
  projectId: string,
  status: WorkItemStatus
) {
  return Object.values(workItemsById)
    .filter(
      (workItem) =>
        workItem.projectId === projectId && workItem.status === status
    )
    .sort(
      (left, right) =>
        left.position - right.position || left.id.localeCompare(right.id)
    )
}

function writeOrderedItems(
  workItemsById: Record<string, WorkItem>,
  workItems: WorkItem[],
  status: WorkItemStatus
) {
  workItems.forEach((workItem, position) => {
    workItemsById[workItem.id] =
      workItem.status === status && workItem.position === position
        ? workItem
        : { ...workItem, status, position }
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
