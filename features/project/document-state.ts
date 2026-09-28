import type { ProjectWorkspaceState } from "./model"

export function renameProjectDocumentState(state: ProjectWorkspaceState, id: string, name: string) {
  const document = state.resourcesById[id]
  const title = name.trim()
  if (document?.type !== "document" || !title || title === document.title) return state
  return { ...state, resourcesById: { ...state.resourcesById, [id]: { ...document, title } } }
}

export function setDocumentPinnedState(state: ProjectWorkspaceState, id: string, isPinned: boolean) {
  const document = state.resourcesById[id]
  if (document?.type !== "document" || document.isPinned === isPinned) return state
  return { ...state, resourcesById: { ...state.resourcesById, [id]: { ...document, isPinned } } }
}

export function moveProjectDocumentState(state: ProjectWorkspaceState, id: string, direction: -1 | 1) {
  const document = state.resourcesById[id]
  if (document?.type !== "document" || (direction !== -1 && direction !== 1)) return state
  const project = state.projectsById[document.projectId]
  if (!project?.resourceIds.includes(id)) return state
  const documents = project.resourceIds.filter(resourceId => state.resourcesById[resourceId]?.type === "document")
  const adjacent = documents[documents.indexOf(id) + direction]
  if (!adjacent) return state
  const resourceIds = project.resourceIds.map(resourceId => resourceId === id ? adjacent : resourceId === adjacent ? id : resourceId)
  return { ...state, projectsById: { ...state.projectsById, [project.id]: { ...project, resourceIds } } }
}

export function deleteProjectDocumentState(state: ProjectWorkspaceState, id: string) {
  const document = state.resourcesById[id]
  if (document?.type !== "document") return state
  const project = state.projectsById[document.projectId]
  if (!project?.resourceIds.includes(id)) return state
  const resourcesById = { ...state.resourcesById }
  delete resourcesById[id]
  const workItemsById = { ...state.workItemsById }
  for (const item of Object.values(workItemsById)) {
    if (item.linkedResourceIds.includes(id)) {
      workItemsById[item.id] = { ...item, linkedResourceIds: item.linkedResourceIds.filter(resourceId => resourceId !== id) }
    }
  }
  return { ...state, resourcesById, workItemsById,
    projectsById: { ...state.projectsById, [project.id]: { ...project, resourceIds: project.resourceIds.filter(resourceId => resourceId !== id) } },
  }
}
