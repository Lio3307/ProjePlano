import type {
  ProjectDocumentResource,
  ProjectRecord,
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

export type CreateProjectDocumentInput = {
  id: string
  projectId: string
  title: string
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
    ? createProjectDocument(
        getProjectDocumentResourceId(input.id),
        input.id,
        template.documentTitle,
        true
      )
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
  input: CreateProjectDocumentInput
): ProjectWorkspaceState {
  const project = state.projectsById[input.projectId]
  const title = input.title.trim()

  if (
    !project ||
    input.id.trim().length === 0 ||
    input.id.trim() !== input.id ||
    title.length === 0 ||
    state.resourcesById[input.id]
  ) {
    return state
  }

  const document = createProjectDocument(
    input.id,
    input.projectId,
    title,
    false
  )

  return {
    ...state,
    projectsById: {
      ...state.projectsById,
      [input.projectId]: {
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

export function saveProjectDocumentState(
  state: ProjectWorkspaceState,
  resourceId: string,
  content: string
): ProjectWorkspaceState {
  const resource = state.resourcesById[resourceId]

  if (
    !resource ||
    resource.type !== "document" ||
    resource.content === content
  ) {
    return state
  }

  return {
    ...state,
    resourcesById: {
      ...state.resourcesById,
      [resourceId]: { ...resource, content },
    },
  }
}

export function getProjectDocumentResourceId(projectId: string) {
  return "resource-" + projectId + "-document"
}

function createProjectDocument(
  id: string,
  projectId: string,
  title: string,
  isPinned: boolean
): ProjectDocumentResource {
  return {
    id,
    projectId,
    title,
    type: "document",
    templateId: null,
    isPinned,
    content: "",
  }
}
