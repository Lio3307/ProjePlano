import { isId } from "../../lib/json-validation.ts"
import { isValidWorkItemDate } from "../work-item/model.ts"
import type { Workspace } from "../workspace/types"
import type { ProjectRecord, ProjectWorkspaceState } from "./model"

export type WorkspaceDetails = Pick<Workspace, "title" | "description">
export type ProjectDetails = Pick<ProjectRecord, "title" | "description" | "status">

export function createWorkspaceState(state: ProjectWorkspaceState, input: Workspace): ProjectWorkspaceState {
  if (!isId(input.id) || Object.hasOwn(state.workspacesById, input.id) ||
    !input.title.trim() || !isValidWorkItemDate(input.createdAt)) return state
  const workspace = { ...input, title: input.title.trim(), description: input.description.trim() }
  return {
    ...state,
    workspaceIds: [...state.workspaceIds, workspace.id],
    workspacesById: { ...state.workspacesById, [workspace.id]: workspace },
    projectIdsByWorkspaceId: { ...state.projectIdsByWorkspaceId, [workspace.id]: [] },
  }
}

export function updateWorkspaceState(state: ProjectWorkspaceState, id: string, details: WorkspaceDetails): ProjectWorkspaceState {
  if (!Object.hasOwn(state.workspacesById, id)) return state
  const workspace = state.workspacesById[id]
  const title = details.title.trim()
  const description = details.description.trim()
  if (!workspace || !title || (workspace.title === title && workspace.description === description)) return state
  return { ...state, workspacesById: { ...state.workspacesById, [id]: { ...workspace, title, description } } }
}

export function updateProjectState(state: ProjectWorkspaceState, id: string, details: ProjectDetails): ProjectWorkspaceState {
  if (!Object.hasOwn(state.projectsById, id)) return state
  const project = state.projectsById[id]
  const title = details.title.trim()
  const description = details.description.trim()
  if (!project || !title || !["planned", "active", "paused", "completed"].includes(details.status) ||
    (project.title === title && project.description === description && project.status === details.status)) return state
  return { ...state, projectsById: { ...state.projectsById, [id]: { ...project, title, description, status: details.status } } }
}

export function setProjectArchivedState(state: ProjectWorkspaceState, id: string, archived: boolean): ProjectWorkspaceState {
  if (!Object.hasOwn(state.projectsById, id) || typeof archived !== "boolean") return state
  const project = state.projectsById[id]
  if (!project || project.archived === archived) return state
  return { ...state, projectsById: { ...state.projectsById, [id]: { ...project, archived } } }
}

export function deleteProjectState(state: ProjectWorkspaceState, id: string): ProjectWorkspaceState {
  if (!Object.hasOwn(state.projectsById, id)) return state
  const project = state.projectsById[id]
  if (!project) return state
  return {
    ...removeProjects(state, new Set([id])),
    projectIdsByWorkspaceId: {
      ...state.projectIdsByWorkspaceId,
      [project.workspaceId]: (state.projectIdsByWorkspaceId[project.workspaceId] ?? []).filter(projectId => projectId !== id),
    },
  }
}

export function deleteWorkspaceState(state: ProjectWorkspaceState, id: string): ProjectWorkspaceState {
  if (!Object.hasOwn(state.workspacesById, id)) return state
  const ids = new Set(state.projectIdsByWorkspaceId[id] ?? [])
  return {
    ...removeProjects(state, ids),
    workspaceIds: state.workspaceIds.filter(workspaceId => workspaceId !== id),
    workspacesById: withoutKey(state.workspacesById, id),
    projectIdsByWorkspaceId: withoutKey(state.projectIdsByWorkspaceId, id),
  }
}

function removeProjects(state: ProjectWorkspaceState, ids: Set<string>): ProjectWorkspaceState {
  const projectViewsById = withoutProjects(state.projectViewsById, ids)
  return {
    ...state,
    projectsById: Object.fromEntries(Object.entries(state.projectsById).filter(([id]) => !ids.has(id))),
    projectViewsById,
    taskBoardsById: withoutProjects(state.taskBoardsById, ids),
    workItemsById: withoutProjects(state.workItemsById, ids),
    resourcesById: withoutProjects(state.resourcesById, ids),
    milestonesById: withoutProjects(state.milestonesById, ids),
    tablesByViewId: Object.fromEntries(Object.entries(state.tablesByViewId).filter(([id]) => Object.hasOwn(projectViewsById, id))),
  }
}

function withoutProjects<T extends { projectId: string }>(records: Record<string, T>, ids: Set<string>) {
  return Object.fromEntries(Object.entries(records).filter(([, record]) => !ids.has(record.projectId)))
}

function withoutKey<T>(records: Record<string, T>, id: string) {
  return Object.fromEntries(Object.entries(records).filter(([key]) => key !== id))
}
