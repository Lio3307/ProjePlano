import type {
  ProjectDocumentResource,
  ProjectRecord,
  ProjectWorkspaceState,
} from "./model"
import {
  normalizeBoardLabels,
  type BoardLabel,
} from "./board.ts"
import {
  normalizeTaskBoardFields,
  type EditableTaskBoardFields,
  type TaskBoard,
} from "./task-board.ts"
import {
  getProjectTemplate,
  type ProjectTemplateId,
} from "./templates.ts"
import {
  createProjectViewConfig,
  type SupportedProjectViewType,
} from "./view-definitions.ts"

export type GenericProjectViewType = Exclude<
  SupportedProjectViewType,
  "board"
>

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

export type CreateProjectViewInput = {
  id: string
  projectId: string
  type: GenericProjectViewType
}

export type CreateTaskBoardInput = EditableTaskBoardFields & {
  id: string
  projectId: string
  viewId: string
}

export type CreateFirstTaskBoardInput = {
  viewId: string
  board: Omit<CreateTaskBoardInput, "viewId">
}

export type UpdateTaskBoardInput = EditableTaskBoardFields & {
  boardId: string
}

export type UpdateBoardLabelsInput = {
  viewId: string
  labels: BoardLabel[]
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
  input: CreateProjectViewInput
): ProjectWorkspaceState {
  const project = state.projectsById[input.projectId]

  if (
    !project ||
    (input.type !== "table" && input.type !== "calendar") ||
    input.id.trim().length === 0 ||
    input.id.trim() !== input.id ||
    state.projectViewsById[input.id]
  ) {
    return state
  }

  const sameTypeCount = project.viewIds.filter((viewId) => {
    const ownedView = state.projectViewsById[viewId]

    return (
      ownedView?.projectId === input.projectId &&
      ownedView.type === input.type
    )
  }).length
  const baseView = createProjectViewConfig(input.projectId, input.type)
  const instanceNumber = sameTypeCount + 1
  const view = {
    ...baseView,
    id: input.id,
    title:
      instanceNumber === 1
        ? baseView.title
        : baseView.title + " " + instanceNumber,
  }

  return {
    ...state,
    projectsById: {
      ...state.projectsById,
      [input.projectId]: {
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

export function createFirstTaskBoardState(
  state: ProjectWorkspaceState,
  input: CreateFirstTaskBoardInput
): ProjectWorkspaceState {
  const project = state.projectsById[input.board.projectId]
  const fields = normalizeTaskBoardFields(input.board)

  if (
    !project ||
    !isNormalizedId(input.viewId) ||
    !isNormalizedId(input.board.id) ||
    !isNormalizedId(input.board.projectId) ||
    state.projectViewsById[input.viewId] ||
    state.taskBoardsById[input.board.id] ||
    !fields ||
    project.viewIds.some((viewId) => {
      const view = state.projectViewsById[viewId]

      return view?.projectId === project.id && view.type === "board"
    })
  ) {
    return state
  }

  const viewConfig = createProjectViewConfig(project.id, "board")
  const board: TaskBoard = {
    id: input.board.id,
    projectId: project.id,
    viewId: input.viewId,
    ...fields,
    position: 0,
  }
  const view = {
    ...viewConfig,
    id: input.viewId,
    boardIds: [board.id],
  }

  return {
    ...state,
    projectsById: {
      ...state.projectsById,
      [project.id]: {
        ...project,
        viewIds: [...project.viewIds, view.id],
      },
    },
    projectViewsById: {
      ...state.projectViewsById,
      [view.id]: view,
    },
    taskBoardsById: {
      ...state.taskBoardsById,
      [board.id]: board,
    },
  }
}

export function addTaskBoardState(
  state: ProjectWorkspaceState,
  input: CreateTaskBoardInput
): ProjectWorkspaceState {
  const project = state.projectsById[input.projectId]
  const view = state.projectViewsById[input.viewId]
  const fields = normalizeTaskBoardFields(input)

  if (
    !project ||
    view?.type !== "board" ||
    view.projectId !== project.id ||
    !project.viewIds.includes(view.id) ||
    !isNormalizedId(input.id) ||
    !isNormalizedId(input.projectId) ||
    !isNormalizedId(input.viewId) ||
    state.taskBoardsById[input.id] ||
    !fields ||
    hasDuplicateTaskBoardTitle(state, view.boardIds, fields.title)
  ) {
    return state
  }

  const board: TaskBoard = {
    id: input.id,
    projectId: project.id,
    viewId: view.id,
    ...fields,
    position: view.boardIds.length,
  }

  return {
    ...state,
    projectViewsById: {
      ...state.projectViewsById,
      [view.id]: {
        ...view,
        boardIds: [...view.boardIds, board.id],
      },
    },
    taskBoardsById: {
      ...state.taskBoardsById,
      [board.id]: board,
    },
  }
}

export function updateTaskBoardState(
  state: ProjectWorkspaceState,
  input: UpdateTaskBoardInput
): ProjectWorkspaceState {
  const current = state.taskBoardsById[input.boardId]
  const view = current
    ? state.projectViewsById[current.viewId]
    : undefined
  const project = current
    ? state.projectsById[current.projectId]
    : undefined
  const fields = normalizeTaskBoardFields(input)

  if (
    !current ||
    !project ||
    view?.type !== "board" ||
    view.projectId !== current.projectId ||
    !project.viewIds.includes(view.id) ||
    !isNormalizedId(input.boardId) ||
    !view.boardIds.includes(current.id) ||
    !fields ||
    hasDuplicateTaskBoardTitle(
      state,
      view.boardIds,
      fields.title,
      current.id
    )
  ) {
    return state
  }

  if (
    current.title === fields.title &&
    current.description === fields.description &&
    current.stage === fields.stage
  ) {
    return state
  }

  return {
    ...state,
    taskBoardsById: {
      ...state.taskBoardsById,
      [current.id]: { ...current, ...fields },
    },
  }
}

export function updateBoardLabelsState(
  state: ProjectWorkspaceState,
  input: UpdateBoardLabelsInput
): ProjectWorkspaceState {
  const view = state.projectViewsById[input.viewId]
  const project = view ? state.projectsById[view.projectId] : undefined
  const labels = normalizeBoardLabels(input.labels)

  if (
    view?.type !== "board" ||
    !project?.viewIds.includes(view.id) ||
    !labels
  ) {
    return state
  }

  const nextLabelIds = new Set(labels.map((label) => label.id))
  const ownedBoardIds = new Set(view.boardIds)
  let workItemsById = state.workItemsById

  for (const workItem of Object.values(state.workItemsById)) {
    if (!ownedBoardIds.has(workItem.boardId)) {
      continue
    }

    const labelIds = workItem.labelIds.filter((labelId) =>
      nextLabelIds.has(labelId)
    )

    if (labelIds.length !== workItem.labelIds.length) {
      if (workItemsById === state.workItemsById) {
        workItemsById = { ...state.workItemsById }
      }

      workItemsById[workItem.id] = { ...workItem, labelIds }
    }
  }

  const labelsChanged = !haveSameBoardLabels(view.labels, labels)

  if (!labelsChanged && workItemsById === state.workItemsById) {
    return state
  }

  return {
    ...state,
    projectViewsById: {
      ...state.projectViewsById,
      [view.id]: labelsChanged ? { ...view, labels } : view,
    },
    workItemsById,
  }
}

function hasDuplicateTaskBoardTitle(
  state: ProjectWorkspaceState,
  boardIds: readonly string[],
  title: string,
  excludedBoardId?: string
) {
  const normalizedTitle = title.toLowerCase()

  return boardIds.some((boardId) => {
    const board = state.taskBoardsById[boardId]

    return (
      board?.id !== excludedBoardId &&
      board?.title.toLowerCase() === normalizedTitle
    )
  })
}

function haveSameBoardLabels(
  left: readonly BoardLabel[],
  right: readonly BoardLabel[]
) {
  return (
    left.length === right.length &&
    left.every((label, index) => {
      const candidate = right[index]

      return (
        label.id === candidate?.id &&
        label.name === candidate.name &&
        label.color === candidate.color
      )
    })
  )
}

function isNormalizedId(value: string) {
  return value.length > 0 && value.trim() === value
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
