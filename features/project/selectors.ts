import { isValidWorkItemDate, type WorkItem, type WorkItemStatus } from "../work-item/model.ts"
import type { Workspace } from "../workspace/types"
import type {
  ProjectDocumentResource,
  ProjectRecord,
  ProjectBoardView,
  ProjectResource,
  ProjectViewConfig,
  ProjectWorkspaceState,
} from "./model"
import type { TaskBoard } from "./task-board.ts"
import {
  isSupportedProjectViewType,
  type SupportedProjectView,
} from "./view-definitions.ts"

export type DocumentLinkedWorkItem = {
  boardViewId: string
  boardId: string
  boardTitle: string
  workItemId: string
  workItemTitle: string
}

export type ResolvedWorkItem = {
  workItem: WorkItem
  board: TaskBoard
  stage: WorkItemStatus
}

export type WorkspaceWorkItem = {
  workItem: WorkItem
  board: TaskBoard
  project: ProjectRecord
  workspace: Workspace
}

export type DatedWorkItem = WorkspaceWorkItem & {
  workItem: WorkItem & { dueDate: string }
}

export type AgendaFilters = {
  workspaceId: string
  projectId: string
  priority: WorkItem["priority"] | ""
}

export function filterWorkspaceWorkItems(
  items: readonly WorkspaceWorkItem[],
  filters: AgendaFilters
) {
  return items.filter(({ workspace, project, workItem }) =>
    (!filters.workspaceId || workspace.id === filters.workspaceId) &&
    (!filters.projectId || project.id === filters.projectId) &&
    (!filters.priority || workItem.priority === filters.priority)
  )
}

const PRIORITY_ORDER: Record<WorkItem["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

type ArraySelectorCache<T> = WeakMap<
  ProjectWorkspaceState,
  Map<string, T[]>
>

const resolvedWorkItemCache: ArraySelectorCache<ResolvedWorkItem> =
  new WeakMap()
const documentLinkedWorkItemCache: ArraySelectorCache<DocumentLinkedWorkItem> =
  new WeakMap()
const datedWorkItemCache: ArraySelectorCache<DatedWorkItem> = new WeakMap()
const workspaceWorkItemCache: ArraySelectorCache<WorkspaceWorkItem> = new WeakMap()
const searchWorkItemCache: ArraySelectorCache<WorkspaceWorkItem> = new WeakMap()

function selectWorkspaceWorkItems(state: ProjectWorkspaceState): WorkspaceWorkItem[] {
  return getCachedArray(workspaceWorkItemCache, state, "all", () =>
    selectWorkspaces(state).flatMap(workspace =>
      selectProjectsByWorkspaceId(state, workspace.id).filter(project => !project.archived).flatMap(project =>
        selectProjectResolvedWorkItems(state, project.id).map(({ workItem, board }) => ({ workItem, board, project, workspace }))
      )
    )
  )
}

export function selectSearchWorkItems(
  state: ProjectWorkspaceState,
  query: string,
  includeCompleted = false
): WorkspaceWorkItem[] {
  const normalizedQuery = query.trim().toLowerCase()
  return getCachedArray(searchWorkItemCache, state, JSON.stringify([normalizedQuery, includeCompleted]), () =>
    selectWorkspaceWorkItems(state).filter(({ workItem, board }) =>
      (includeCompleted || board.stage !== "done") && workItem.title.toLowerCase().includes(normalizedQuery)
    ).sort((left, right) => left.workItem.title.localeCompare(right.workItem.title) || left.workItem.id.localeCompare(right.workItem.id))
  )
}

export function selectTodayWorkItems(
  state: ProjectWorkspaceState,
  today: string
): DatedWorkItem[] {
  return selectDatedWorkItems(state, today, "today")
}

export function selectUpcomingWorkItems(
  state: ProjectWorkspaceState,
  today: string
): DatedWorkItem[] {
  return selectDatedWorkItems(state, today, "upcoming")
}

function selectDatedWorkItems(
  state: ProjectWorkspaceState,
  today: string,
  mode: "today" | "upcoming"
): DatedWorkItem[] {
  return getCachedArray(datedWorkItemCache, state, mode + ":" + today, () => {
    if (!isValidWorkItemDate(today)) return []

    const items: DatedWorkItem[] = []
    const todayTime = Date.parse(today)

    for (const { workItem, board, project, workspace } of selectWorkspaceWorkItems(state)) {
      if (board.stage === "done" || !hasValidDueDate(workItem)) {
        continue
      }

      // ISO date-only strings use UTC, so calendar-day distance is DST-independent.
      const daysAhead = (Date.parse(workItem.dueDate) - todayTime) / 86_400_000
      if (mode === "today" ? daysAhead > 0 : daysAhead <= 0 || daysAhead > 7) {
        continue
      }

      items.push({ workItem, board, project, workspace })
    }

    return items.sort((left, right) =>
      left.workItem.dueDate.localeCompare(right.workItem.dueDate) ||
      PRIORITY_ORDER[left.workItem.priority] - PRIORITY_ORDER[right.workItem.priority] ||
      left.workItem.id.localeCompare(right.workItem.id)
    )
  })
}

function hasValidDueDate(workItem: WorkItem): workItem is WorkItem & { dueDate: string } {
  return workItem.dueDate !== null && isValidWorkItemDate(workItem.dueDate)
}

export function selectWorkspaces(state: ProjectWorkspaceState) {
  return state.workspaceIds.flatMap(id => state.workspacesById[id] ? [state.workspacesById[id]] : [])
}

export function selectWorkspaceById(state: ProjectWorkspaceState, workspaceId: string) {
  return Object.hasOwn(state.workspacesById, workspaceId) ? state.workspacesById[workspaceId] : null
}

export function selectProjectById(
  state: ProjectWorkspaceState,
  projectId: string
) {
  return state.projectsById[projectId] ?? null
}

export function selectProjectForWorkspace(
  state: ProjectWorkspaceState,
  workspaceId: string,
  projectId: string
) {
  const project = state.projectsById[projectId]

  return project?.workspaceId === workspaceId ? project : null
}

export function selectProjectsByWorkspaceId(
  state: ProjectWorkspaceState,
  workspaceId: string
) {
  const projectIds = state.projectIdsByWorkspaceId[workspaceId] ?? []

  return projectIds.flatMap((projectId) => {
    const project = state.projectsById[projectId]
    return project && project.workspaceId === workspaceId ? [project] : []
  })
}

export function selectProjectViews(
  state: ProjectWorkspaceState,
  projectId: string
) {
  const project = state.projectsById[projectId]

  if (!project) {
    return []
  }

  return project.viewIds.flatMap((viewId) => {
    const view = state.projectViewsById[viewId]
    return view && view.projectId === projectId ? [view] : []
  })
}

export function selectSupportedProjectViews(
  state: ProjectWorkspaceState,
  projectId: string
) {
  return selectProjectViews(state, projectId).filter(
    isSupportedProjectView
  )
}

export function selectProjectWorkItems(
  state: ProjectWorkspaceState,
  projectId: string
) {
  return selectProjectResolvedWorkItems(state, projectId).map(
    ({ workItem }) => workItem
  )
}

export function selectProjectBoardView(
  state: ProjectWorkspaceState,
  projectId: string,
  viewId: string
): ProjectBoardView | null {
  const project = state.projectsById[projectId]
  const view = state.projectViewsById[viewId]

  return project?.viewIds.includes(viewId) &&
    view?.type === "board" &&
    view.projectId === projectId
    ? view
    : null
}

export function selectTaskBoards(
  state: ProjectWorkspaceState,
  projectId: string,
  viewId: string
) {
  const view = selectProjectBoardView(state, projectId, viewId)

  if (!view) {
    return []
  }

  return view.boardIds.flatMap((boardId) => {
    const board = state.taskBoardsById[boardId]

    return board?.projectId === projectId && board.viewId === view.id
      ? [board]
      : []
  })
}

export function selectTaskBoard(
  state: ProjectWorkspaceState,
  projectId: string,
  boardId: string
): TaskBoard | null {
  const board = state.taskBoardsById[boardId]
  const view = board
    ? selectProjectBoardView(state, projectId, board.viewId)
    : null

  return board?.projectId === projectId && view?.boardIds.includes(board.id)
    ? board
    : null
}

export function selectBoardWorkItems(
  state: ProjectWorkspaceState,
  projectId: string,
  boardId: string
) {
  if (!selectTaskBoard(state, projectId, boardId)) {
    return []
  }

  return Object.values(state.workItemsById)
    .filter(
      (workItem) =>
        workItem.projectId === projectId && workItem.boardId === boardId
    )
    .sort(
      (left, right) =>
        left.position - right.position || left.id.localeCompare(right.id)
    )
}

export function selectProjectResolvedWorkItems(
  state: ProjectWorkspaceState,
  projectId: string
): ResolvedWorkItem[] {
  return getCachedArray(resolvedWorkItemCache, state, projectId, () => {
    const resolved: ResolvedWorkItem[] = []

    for (const view of selectProjectViews(state, projectId)) {
      if (view.type !== "board") {
        continue
      }

      for (const board of selectTaskBoards(state, projectId, view.id)) {
        for (const workItem of selectBoardWorkItems(
          state,
          projectId,
          board.id
        )) {
          resolved.push({ workItem, board, stage: board.stage })
        }
      }
    }

    return resolved
  })
}

export function selectProjectResources(
  state: ProjectWorkspaceState,
  projectId: string
) {
  const project = state.projectsById[projectId]

  if (!project) {
    return []
  }

  return project.resourceIds.flatMap((resourceId) => {
    const resource = state.resourcesById[resourceId]
    return resource && resource.projectId === projectId ? [resource] : []
  })
}

export function selectProjectDocumentResources(
  state: ProjectWorkspaceState,
  projectId: string
) {
  return selectProjectResources(state, projectId).filter(
    isProjectDocumentResource
  )
}

export function selectDocumentLinkedWorkItems(
  state: ProjectWorkspaceState,
  projectId: string,
  resourceId: string
): DocumentLinkedWorkItem[] {
  const cacheKey = JSON.stringify([projectId, resourceId])

  return getCachedArray(
    documentLinkedWorkItemCache,
    state,
    cacheKey,
    () => {
      const project = state.projectsById[projectId]
      const resource = state.resourcesById[resourceId]

      if (
        !project ||
        !project.resourceIds.includes(resourceId) ||
        resource?.type !== "document" ||
        resource.projectId !== projectId
      ) {
        return []
      }

      return selectProjectResolvedWorkItems(state, projectId).flatMap(
        ({ workItem, board }) => {
          const boardView = state.projectViewsById[board.viewId]

          if (
            !workItem.linkedResourceIds.includes(resourceId) ||
            boardView?.type !== "board"
          ) {
            return []
          }

          return [
            {
              boardViewId: boardView.id,
              boardId: board.id,
              boardTitle: board.title,
              workItemId: workItem.id,
              workItemTitle: workItem.title,
            },
          ]
        }
      )
    }
  )
}

export function selectProjectMilestones(
  state: ProjectWorkspaceState,
  projectId: string
) {
  const project = state.projectsById[projectId]

  if (!project) {
    return []
  }

  return project.milestoneIds.flatMap((milestoneId) => {
    const milestone = state.milestonesById[milestoneId]
    return milestone && milestone.projectId === projectId ? [milestone] : []
  })
}

function isSupportedProjectView(
  view: ProjectViewConfig
): view is SupportedProjectView {
  return isSupportedProjectViewType(view.type)
}

function isProjectDocumentResource(
  resource: ProjectResource
): resource is ProjectDocumentResource {
  return resource.type === "document"
}

function getCachedArray<T>(
  cache: ArraySelectorCache<T>,
  state: ProjectWorkspaceState,
  key: string,
  createValue: () => T[]
) {
  let valuesByKey = cache.get(state)

  if (!valuesByKey) {
    valuesByKey = new Map()
    cache.set(state, valuesByKey)
  }

  const cached = valuesByKey.get(key)

  if (cached !== undefined) {
    return cached
  }

  const value = createValue()
  valuesByKey.set(key, value)
  return value
}
