import {
  WORK_ITEM_STATUSES,
  type WorkItemStatus,
} from "../work-item/model.ts"
import type {
  ProjectDocumentResource,
  ProjectResource,
  ProjectViewConfig,
  ProjectWorkspaceState,
} from "./model"
import {
  isSupportedProjectViewType,
  type SupportedProjectView,
} from "./view-definitions.ts"

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
  if (!state.projectsById[projectId]) {
    return []
  }

  return Object.values(state.workItemsById)
    .filter((workItem) => workItem.projectId === projectId)
    .sort((left, right) => {
      const statusDifference =
        WORK_ITEM_STATUSES.indexOf(left.status) -
        WORK_ITEM_STATUSES.indexOf(right.status)

      return (
        statusDifference ||
        left.position - right.position ||
        left.id.localeCompare(right.id)
      )
    })
}

export function selectWorkItemsByStatus(
  state: ProjectWorkspaceState,
  projectId: string,
  status: WorkItemStatus
) {
  if (!state.projectsById[projectId]) {
    return []
  }

  return Object.values(state.workItemsById)
    .filter(
      (workItem) =>
        workItem.projectId === projectId && workItem.status === status
    )
    .sort(
      (left, right) =>
        left.position - right.position || left.id.localeCompare(right.id)
    )
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
