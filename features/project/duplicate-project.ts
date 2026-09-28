import { isId } from "../../lib/json-validation.ts"
import type { WorkItem } from "../work-item/model"
import type { ProjectWorkspaceState } from "./model"

export function duplicateProjectState(
  state: ProjectWorkspaceState,
  sourceId: string,
  targetWorkspaceId: string,
  title: string,
  makeId: () => string
): ProjectWorkspaceState {
  const source = Object.hasOwn(state.projectsById, sourceId)
    ? state.projectsById[sourceId]
    : undefined
  const normalizedTitle = title.trim()
  if (!source || !Object.hasOwn(state.workspacesById, targetWorkspaceId) || !normalizedTitle) {
    return state
  }

  const usedIds = new Set<string>()
  for (const records of [
    state.workspacesById, state.projectsById, state.projectViewsById,
    state.taskBoardsById, state.workItemsById, state.resourcesById,
    state.milestonesById,
  ]) {
    for (const id of Object.keys(records)) usedIds.add(id)
  }
  for (const view of Object.values(state.projectViewsById)) {
    if (view.type === "board") for (const label of view.labels) usedIds.add(label.id)
  }
  for (const item of Object.values(state.workItemsById)) {
    for (const checklistItem of item.checklist) usedIds.add(checklistItem.id)
  }

  function allocate(): string | null {
    const id = makeId()
    if (!isId(id) || usedIds.has(id)) return null
    usedIds.add(id)
    return id
  }

  const projectId = allocate()
  if (!projectId) return state

  const viewIds = new Map<string, string>()
  const boardIds = new Map<string, string>()
  const labelIds = new Map<string, string>()
  const itemIds = new Map<string, string>()
  const resourceIds = new Map<string, string>()
  const milestoneIds = new Map<string, string>()
  const checklistIds = new Map<string, string>()
  const sourceViews = source.viewIds.map(id => state.projectViewsById[id])
  const sourceResources = source.resourceIds.map(id => state.resourcesById[id])
  const sourceMilestones = source.milestoneIds.map(id => state.milestonesById[id])
  if (sourceViews.some(view => !view || view.projectId !== sourceId) ||
    sourceResources.some(resource => !resource || resource.projectId !== sourceId) ||
    sourceMilestones.some(milestone => !milestone || milestone.projectId !== sourceId)) return state

  for (const view of sourceViews) {
    const newId = allocate()
    if (!newId) return state
    viewIds.set(view.id, newId)
    if (view.type !== "board") continue
    for (const label of view.labels) {
      const newLabelId = allocate()
      if (!newLabelId) return state
      labelIds.set(label.id, newLabelId)
    }
    for (const boardId of view.boardIds) {
      const board = state.taskBoardsById[boardId]
      if (!board || board.projectId !== sourceId || board.viewId !== view.id) return state
      const newBoardId = allocate()
      if (!newBoardId) return state
      boardIds.set(boardId, newBoardId)
    }
  }
  for (const resource of sourceResources) {
    const newId = allocate()
    if (!newId) return state
    resourceIds.set(resource.id, newId)
  }
  for (const milestone of sourceMilestones) {
    const newId = allocate()
    if (!newId) return state
    milestoneIds.set(milestone.id, newId)
  }
  const sourceItems = Object.values(state.workItemsById).filter(item => item.projectId === sourceId)
  for (const item of sourceItems) {
    if (!boardIds.has(item.boardId)) return state
    const newId = allocate()
    if (!newId) return state
    itemIds.set(item.id, newId)
    for (const checklistItem of item.checklist) {
      const newChecklistId = allocate()
      if (!newChecklistId) return state
      checklistIds.set(checklistItem.id, newChecklistId)
    }
  }

  const projectsById = {
    ...state.projectsById,
    [projectId]: {
      ...source, id: projectId, workspaceId: targetWorkspaceId,
      title: normalizedTitle, archived: false,
      viewIds: source.viewIds.map(id => viewIds.get(id)!),
      resourceIds: source.resourceIds.map(id => resourceIds.get(id)!),
      milestoneIds: source.milestoneIds.map(id => milestoneIds.get(id)!),
    },
  }
  const projectViewsById = { ...state.projectViewsById }
  const taskBoardsById = { ...state.taskBoardsById }
  const workItemsById = { ...state.workItemsById }
  const resourcesById = { ...state.resourcesById }
  const milestonesById = { ...state.milestonesById }
  const tablesByViewId = { ...state.tablesByViewId }

  for (const view of sourceViews) {
    const clonedView = structuredClone(view)
    clonedView.id = viewIds.get(view.id)!
    clonedView.projectId = projectId
    clonedView.visibleFieldIds = view.visibleFieldIds.map(id => labelIds.get(id) ?? id)
    clonedView.filterIds = view.filterIds.map(id => labelIds.get(id) ?? id)
    clonedView.groupBy = view.groupBy === null ? null : labelIds.get(view.groupBy) ?? view.groupBy
    if (clonedView.type === "board" && view.type === "board") {
      clonedView.boardIds = view.boardIds.map(id => boardIds.get(id)!)
      clonedView.labels = view.labels.map(label => ({ ...label, id: labelIds.get(label.id)! }))
    }
    projectViewsById[clonedView.id] = clonedView
    if (view.type === "table") {
      const snapshot = state.tablesByViewId[view.id]
      if (!snapshot) return state
      // Table row, column, option and attachment IDs are local to the new view.
      tablesByViewId[clonedView.id] = structuredClone(snapshot)
    }
  }
  for (const [oldId, newId] of boardIds) {
    const board = state.taskBoardsById[oldId]
    taskBoardsById[newId] = { ...board, id: newId, projectId, viewId: viewIds.get(board.viewId)! }
  }
  for (const resource of sourceResources) {
    const id = resourceIds.get(resource.id)!
    resourcesById[id] = { ...structuredClone(resource), id, projectId }
  }
  for (const milestone of sourceMilestones) {
    const id = milestoneIds.get(milestone.id)!
    milestonesById[id] = { ...milestone, id, projectId }
  }
  for (const item of sourceItems) {
    if (item.labelIds.some(id => !labelIds.has(id)) ||
      item.dependencyIds.some(id => !itemIds.has(id)) ||
      item.linkedResourceIds.some(id => !resourceIds.has(id)) ||
      (item.milestoneId !== null && !milestoneIds.has(item.milestoneId))) return state
    const id = itemIds.get(item.id)!
    const copy: WorkItem = {
      ...structuredClone(item), id, projectId, boardId: boardIds.get(item.boardId)!,
      labelIds: item.labelIds.map(oldId => labelIds.get(oldId)!),
      checklist: item.checklist.map(entry => ({ ...entry, id: checklistIds.get(entry.id)! })),
      milestoneId: item.milestoneId === null ? null : milestoneIds.get(item.milestoneId)!,
      dependencyIds: item.dependencyIds.map(oldId => itemIds.get(oldId)!),
      linkedResourceIds: item.linkedResourceIds.map(oldId => resourceIds.get(oldId)!),
    }
    workItemsById[id] = copy
  }

  // Planning data and time logs remain attached to the source project.
  return {
    ...state,
    projectIdsByWorkspaceId: {
      ...state.projectIdsByWorkspaceId,
      [targetWorkspaceId]: [...(state.projectIdsByWorkspaceId[targetWorkspaceId] ?? []), projectId],
    },
    projectsById, projectViewsById, taskBoardsById, workItemsById,
    resourcesById, milestonesById, tablesByViewId,
  }
}
