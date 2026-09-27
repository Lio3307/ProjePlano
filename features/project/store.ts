import { createStore, type StoreApi } from "zustand/vanilla"
import type { Workspace } from "../workspace/types"
import {
  createWorkspaceState, updateWorkspaceState, deleteWorkspaceState,
  updateProjectState, setProjectArchivedState, deleteProjectState,
  type WorkspaceDetails, type ProjectDetails,
} from "./lifecycle.ts"

import type {
  EditableWorkItemFields,
  WorkItem,
  WorkItemPriority,
} from "../work-item/model"
import type { ProjectWorkspaceState } from "./model"
import { isTableSnapshot, type TableSnapshot } from "../table/snapshot.ts"
import { parseBackup, serializeBackup, type BackupResult } from "./backup.ts"
import {
  addProjectDocumentState,
  addProjectViewState,
  addTaskBoardState,
  createFirstTaskBoardState,
  createProjectFromTemplateState,
  saveProjectDocumentState,
  updateBoardLabelsState,
  updateTaskBoardState,
  type CreateProjectDocumentInput,
  type CreateFirstTaskBoardInput,
  type CreateProjectInput,
  type CreateProjectViewInput,
  type CreateTaskBoardInput,
  type UpdateBoardLabelsInput,
  type UpdateTaskBoardInput,
} from "./project-state.ts"
import { createProjectSeedState } from "./seed-data.ts"
import {
  createAndLinkWorkItemDocumentState,
  createWorkItemState,
  completeWorkItemState,
  deleteWorkItemState,
  linkWorkItemDocumentState,
  moveWorkItemState,
  moveWorkItemsState,
  restoreDeletedWorkItemState,
  saveWorkItemState,
  updateWorkItemDateRangeState,
  updateWorkItemDueDatesState,
  updateWorkItemPrioritiesState,
  updateWorkItemState,
  unlinkWorkItemDocumentState,
  undoWorkItemCompletionState,
  type CreateAndLinkWorkItemDocumentInput,
  type WorkItemDetailsPatch,
  type WorkItemDeletion,
  type WorkItemCompletion,
} from "./work-item-state.ts"

export type ProjectStoreActions = {
  createWorkspace: (input: Workspace) => boolean
  updateWorkspace: (id: string, details: WorkspaceDetails) => boolean
  deleteWorkspace: (id: string) => boolean
  updateProject: (id: string, details: ProjectDetails) => boolean
  setProjectArchived: (id: string, archived: boolean) => boolean
  deleteProject: (id: string) => boolean
  exportBackup: () => string
  importBackup: (text: string) => BackupResult
  updateTable: (viewId: string, update: (current: TableSnapshot) => TableSnapshot) => boolean
  createProjectFromTemplate: (input: CreateProjectInput) => boolean
  addProjectView: (input: CreateProjectViewInput) => boolean
  createFirstTaskBoard: (input: CreateFirstTaskBoardInput) => boolean
  addTaskBoard: (input: CreateTaskBoardInput) => boolean
  updateTaskBoard: (input: UpdateTaskBoardInput) => boolean
  updateBoardLabels: (input: UpdateBoardLabelsInput) => boolean
  addProjectDocument: (input: CreateProjectDocumentInput) => boolean
  saveProjectDocument: (resourceId: string, content: string) => boolean
  createWorkItem: (workItem: WorkItem) => boolean
  updateWorkItem: (
    workItemId: string,
    patch: WorkItemDetailsPatch
  ) => boolean
  saveWorkItem: (
    workItemId: string,
    fields: EditableWorkItemFields
  ) => boolean
  moveWorkItem: (
    workItemId: string,
    targetBoardId: string,
    index: number
  ) => boolean
  updateWorkItemDateRange: (
    workItemId: string,
    startDate: string | null,
    dueDate: string | null
  ) => boolean
  updateWorkItemDueDates: (workItemIds: readonly string[], dueDate: string) => boolean
  updateWorkItemPriorities: (workItemIds: readonly string[], priority: WorkItemPriority) => boolean
  moveWorkItems: (workItemIds: readonly string[], targetBoardId: string) => boolean
  linkWorkItemDocument: (
    workItemId: string,
    resourceId: string
  ) => boolean
  unlinkWorkItemDocument: (
    workItemId: string,
    resourceId: string
  ) => boolean
  createAndLinkWorkItemDocument: (
    input: CreateAndLinkWorkItemDocumentInput
  ) => boolean
  deleteWorkItem: (workItemId: string) => boolean
  undoDeleteWorkItem: () => boolean
  completeWorkItem: (workItemId: string, targetBoardId: string) => boolean
  undoCompleteWorkItem: () => boolean
  resetDemo: () => void
}

export type ProjectStore = ProjectWorkspaceState & ProjectStoreActions & {
  dataRevision: number
  lastWorkItemDeletion: WorkItemDeletion | null
  lastWorkItemCompletion: WorkItemCompletion | null
}
export type ProjectStoreApi = StoreApi<ProjectStore>

export function createProjectStore(
  initialState: ProjectWorkspaceState = createProjectSeedState()
): ProjectStoreApi {
  const baseline = cloneProjectState(initialState)

  return createStore<ProjectStore>()((set, get) => ({
    ...cloneProjectState(baseline),
    dataRevision: 0,
    lastWorkItemDeletion: null,
    lastWorkItemCompletion: null,

    createWorkspace(input) {
      const current = readProjectState(get())
      const next = createWorkspaceState(current, input)
      if (next === current) return false
      set(next)
      return true
    },

    updateWorkspace(id, details) {
      const current = readProjectState(get())
      const next = updateWorkspaceState(current, id, details)
      if (next === current) return false
      set(next)
      return true
    },

    deleteWorkspace(id) {
      const current = readProjectState(get())
      const next = deleteWorkspaceState(current, id)
      if (next === current) return false
      const deletion = get().lastWorkItemDeletion
      const completion = get().lastWorkItemCompletion
      set({ ...next,
        lastWorkItemDeletion: deletion && next.projectsById[deletion.workItem.projectId] ? deletion : null,
        lastWorkItemCompletion: completion && next.projectsById[completion.projectId] ? completion : null,
      })
      return true
    },

    updateProject(id, details) {
      const current = readProjectState(get())
      const next = updateProjectState(current, id, details)
      if (next === current) return false
      set(next)
      return true
    },

    setProjectArchived(id, archived) {
      const current = readProjectState(get())
      const next = setProjectArchivedState(current, id, archived)
      if (next === current) return false
      set(next)
      return true
    },

    deleteProject(id) {
      const current = readProjectState(get())
      const next = deleteProjectState(current, id)
      if (next === current) return false
      const deletion = get().lastWorkItemDeletion
      const completion = get().lastWorkItemCompletion
      set({ ...next,
        lastWorkItemDeletion: deletion && next.projectsById[deletion.workItem.projectId] ? deletion : null,
        lastWorkItemCompletion: completion && next.projectsById[completion.projectId] ? completion : null,
      })
      return true
    },

    exportBackup() {
      return serializeBackup(readProjectState(get()))
    },

    importBackup(text) {
      const result = parseBackup(text)
      if (!result.ok) return result
      set({ ...cloneProjectState(result.data), dataRevision: get().dataRevision + 1, lastWorkItemDeletion: null, lastWorkItemCompletion: null })
      return result
    },

    updateTable(viewId, update) {
      const current = get().tablesByViewId[viewId]
      if (get().projectViewsById[viewId]?.type !== "table" || !current) return false
      const next = update(current)
      if (next === current || !isTableSnapshot(next)) return false
      set({ tablesByViewId: { ...get().tablesByViewId, [viewId]: next } })
      return true
    },

    createProjectFromTemplate(input) {
      const current = readProjectState(get())
      const next = createProjectFromTemplateState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    addProjectView(input) {
      const current = readProjectState(get())
      const next = addProjectViewState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    createFirstTaskBoard(input) {
      const current = readProjectState(get())
      const next = createFirstTaskBoardState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    addTaskBoard(input) {
      const current = readProjectState(get())
      const next = addTaskBoardState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    updateTaskBoard(input) {
      const current = readProjectState(get())
      const next = updateTaskBoardState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    updateBoardLabels(input) {
      const current = readProjectState(get())
      const next = updateBoardLabelsState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    addProjectDocument(input) {
      const current = readProjectState(get())
      const next = addProjectDocumentState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    saveProjectDocument(resourceId, content) {
      const current = readProjectState(get())
      const next = saveProjectDocumentState(current, resourceId, content)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    createWorkItem(workItem) {
      const current = readProjectState(get())
      const next = createWorkItemState(current, workItem)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    updateWorkItem(workItemId, patch) {
      const current = readProjectState(get())
      const next = updateWorkItemState(current, workItemId, patch)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    saveWorkItem(workItemId, fields) {
      const current = readProjectState(get())
      const next = saveWorkItemState(current, workItemId, fields)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    moveWorkItem(workItemId, targetBoardId, index) {
      const current = readProjectState(get())
      const next = moveWorkItemState(
        current,
        workItemId,
        targetBoardId,
        index
      )

      if (next === current) {
        return false
      }

      const completion = get().lastWorkItemCompletion
      set({ ...next, lastWorkItemCompletion: completion?.workItemId === workItemId ? null : completion })
      return true
    },

    completeWorkItem(workItemId, targetBoardId) {
      const current = readProjectState(get())
      const next = completeWorkItemState(current, workItemId, targetBoardId)
      if (next === current) return false
      const workItem = current.workItemsById[workItemId]
      set({ ...next, lastWorkItemCompletion: {
        workItemId, targetBoardId, title: workItem.title, projectId: workItem.projectId,
        sourceBoardId: workItem.boardId, position: workItem.position,
      } })
      return true
    },

    undoCompleteWorkItem() {
      const completion = get().lastWorkItemCompletion
      if (!completion) return false
      const current = readProjectState(get())
      const next = undoWorkItemCompletionState(current, completion)
      if (next === current) return false
      set({ ...next, lastWorkItemCompletion: null })
      return true
    },

    updateWorkItemDateRange(workItemId, startDate, dueDate) {
      const current = readProjectState(get())
      const next = updateWorkItemDateRangeState(
        current,
        workItemId,
        startDate,
        dueDate
      )

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    updateWorkItemDueDates(workItemIds, dueDate) {
      const current = readProjectState(get())
      const next = updateWorkItemDueDatesState(current, workItemIds, dueDate)
      if (next === current) return false
      set(next)
      return true
    },

    updateWorkItemPriorities(workItemIds, priority) {
      const current = readProjectState(get())
      const next = updateWorkItemPrioritiesState(current, workItemIds, priority)
      if (next === current) return false
      set(next)
      return true
    },

    moveWorkItems(workItemIds, targetBoardId) {
      const current = readProjectState(get())
      const next = moveWorkItemsState(current, workItemIds, targetBoardId)
      if (next === current) return false
      const completion = get().lastWorkItemCompletion
      const completedTaskMoved = completion &&
        next.workItemsById[completion.workItemId]?.boardId !== current.workItemsById[completion.workItemId]?.boardId
      set({ ...next, lastWorkItemCompletion: completedTaskMoved ? null : completion })
      return true
    },

    linkWorkItemDocument(workItemId, resourceId) {
      const current = readProjectState(get())
      const next = linkWorkItemDocumentState(
        current,
        workItemId,
        resourceId
      )

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    unlinkWorkItemDocument(workItemId, resourceId) {
      const current = readProjectState(get())
      const next = unlinkWorkItemDocumentState(
        current,
        workItemId,
        resourceId
      )

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    createAndLinkWorkItemDocument(input) {
      const current = readProjectState(get())
      const next = createAndLinkWorkItemDocumentState(current, input)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    deleteWorkItem(workItemId) {
      const current = readProjectState(get())
      const next = deleteWorkItemState(current, workItemId)

      if (next === current) {
        return false
      }

      const deletion: WorkItemDeletion = {
        workItem: structuredClone(current.workItemsById[workItemId]),
        dependents: Object.values(current.workItemsById).flatMap(item => {
          const dependencyIndex = item.dependencyIds.indexOf(workItemId)
          return dependencyIndex < 0 ? [] : [{ id: item.id, dependencyIndex }]
        }),
      }
      const completion = get().lastWorkItemCompletion
      set({ ...next, lastWorkItemDeletion: deletion,
        lastWorkItemCompletion: completion?.workItemId === workItemId ? null : completion,
      })
      return true
    },

    undoDeleteWorkItem() {
      const deletion = get().lastWorkItemDeletion
      if (!deletion) return false
      const current = readProjectState(get())
      const next = restoreDeletedWorkItemState(current, deletion)
      if (next === current) return false
      set({ ...next, lastWorkItemDeletion: null })
      return true
    },

    resetDemo() {
      set({ ...cloneProjectState(baseline), dataRevision: get().dataRevision + 1, lastWorkItemDeletion: null, lastWorkItemCompletion: null })
    },
  }))
}

function readProjectState(store: ProjectStore): ProjectWorkspaceState {
  return {
    workspaceIds: store.workspaceIds,
    workspacesById: store.workspacesById,
    tablesByViewId: store.tablesByViewId,
    projectIdsByWorkspaceId: store.projectIdsByWorkspaceId,
    projectsById: store.projectsById,
    projectViewsById: store.projectViewsById,
    taskBoardsById: store.taskBoardsById,
    workItemsById: store.workItemsById,
    resourcesById: store.resourcesById,
    milestonesById: store.milestonesById,
  }
}

function cloneProjectState(state: ProjectWorkspaceState) {
  return structuredClone(state)
}
