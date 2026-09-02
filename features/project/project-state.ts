import type {
  ProjectRecord,
  ProjectResource,
  ProjectViewType,
  ProjectWorkspaceState,
} from "./model"
import {
  getProjectTemplate,
  type ProjectTemplateId,
} from "./templates.ts"
import {
  createProjectViewConfig,
  isSupportedProjectViewType,
} from "./view-definitions.ts"

export type CreateProjectInput = {
  id: string
  workspaceId: string
  templateId: ProjectTemplateId
  title: string
  description: string
}

export function createProjectFromTemplateState(
  state: ProjectWorkspaceState,
  input: CreateProjectInput
): ProjectWorkspaceState {
  const title = input.title.trim()
  const description = input.description.trim()
  const template = getProjectTemplate(input.templateId)

  if (
    input.id.trim().length === 0 ||
    input.workspaceId.trim().length === 0 ||
    !template ||
    title.length === 0 ||
    state.projectsById[input.id]
  ) {
    return state
  }

  const views = template.viewTypes.map((type) =>
    createProjectViewConfig(input.id, type)
  )
  const document = template.documentTitle
    ? createProjectDocument(input.id, template.documentTitle)
    : null

  if (
    views.some((view) => state.projectViewsById[view.id]) ||
    (document && state.resourcesById[document.id])
  ) {
    return state
  }

  const project: ProjectRecord = {
    id: input.id,
    workspaceId: input.workspaceId,
    title,
    description,
    templateId: template.id,
    status: "planned",
    viewIds: views.map((view) => view.id),
    resourceIds: document ? [document.id] : [],
    milestoneIds: [],
  }
  const projectViewsById = { ...state.projectViewsById }

  for (const view of views) {
    projectViewsById[view.id] = view
  }

  return {
    ...state,
    projectIdsByWorkspaceId: {
      ...state.projectIdsByWorkspaceId,
      [input.workspaceId]: [
        ...(state.projectIdsByWorkspaceId[input.workspaceId] ?? []),
        input.id,
      ],
    },
    projectsById: {
      ...state.projectsById,
      [input.id]: project,
    },
    projectViewsById,
    resourcesById: document
      ? {
          ...state.resourcesById,
          [document.id]: document,
        }
      : state.resourcesById,
  }
}

export function addProjectViewState(
  state: ProjectWorkspaceState,
  projectId: string,
  type: ProjectViewType
): ProjectWorkspaceState {
  const project = state.projectsById[projectId]

  if (
    !project ||
    !isSupportedProjectViewType(type) ||
    Object.values(state.projectViewsById).some(
      (view) => view.projectId === projectId && view.type === type
    )
  ) {
    return state
  }

  const view = createProjectViewConfig(projectId, type)

  if (state.projectViewsById[view.id]) {
    return state
  }

  return {
    ...state,
    projectsById: {
      ...state.projectsById,
      [projectId]: {
        ...project,
        viewIds: [...project.viewIds, view.id],
      },
    },
    projectViewsById: {
      ...state.projectViewsById,
      [view.id]: view,
    },
  }
}

export function addProjectDocumentState(
  state: ProjectWorkspaceState,
  projectId: string
): ProjectWorkspaceState {
  const project = state.projectsById[projectId]
  const resourceId = getProjectDocumentResourceId(projectId)

  if (
    !project ||
    state.resourcesById[resourceId] ||
    Object.values(state.resourcesById).some(
      (resource) =>
        resource.projectId === projectId && resource.type === "document"
    )
  ) {
    return state
  }

  const document = createProjectDocument(projectId, "Project notes")

  return {
    ...state,
    projectsById: {
      ...state.projectsById,
      [projectId]: {
        ...project,
        resourceIds: [...project.resourceIds, document.id],
      },
    },
    resourcesById: {
      ...state.resourcesById,
      [document.id]: document,
    },
  }
}

export function getProjectDocumentResourceId(projectId: string) {
  return "resource-" + projectId + "-document"
}

function createProjectDocument(
  projectId: string,
  title: string
): ProjectResource {
  return {
    id: getProjectDocumentResourceId(projectId),
    projectId,
    title,
    type: "document",
    templateId: null,
    isPinned: true,
  }
}
