import type { WorkItem, WorkItemStatus } from "../work-item/model.ts"
import type {
  ProjectDocumentResource,
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

type ArraySelectorCache<T> = WeakMap<
  ProjectWorkspaceState,
  Map<string, T[]>
>

const resolvedWorkItemCache: ArraySelectorCache<ResolvedWorkItem> =
  new WeakMap()
const documentLinkedWorkItemCache: ArraySelectorCache<DocumentLinkedWorkItem> =
  new WeakMap()

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
