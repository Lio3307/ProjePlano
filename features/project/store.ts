import { createStore, type StoreApi } from "zustand/vanilla"

import type {
  EditableWorkItemFields,
  WorkItem,
  WorkItemStatus,
} from "../work-item/model"
import type { ProjectWorkspaceState } from "./model"
import {
  addProjectDocumentState,
  addProjectViewState,
  createProjectFromTemplateState,
  saveProjectDocumentState,
  type CreateProjectDocumentInput,
  type CreateProjectInput,
  type CreateProjectViewInput,
} from "./project-state.ts"
import { createProjectSeedState } from "./seed-data.ts"
import {
  createWorkItemState,
  deleteWorkItemState,
  moveWorkItemState,
  saveWorkItemState,
  updateWorkItemDateRangeState,
  updateWorkItemState,
  type WorkItemDetailsPatch,
} from "./work-item-state.ts"

export type ProjectStoreActions = {
  createProjectFromTemplate: (input: CreateProjectInput) => boolean
  addProjectView: (input: CreateProjectViewInput) => boolean
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
    status: WorkItemStatus,
    index: number
  ) => boolean
  updateWorkItemDateRange: (
    workItemId: string,
    startDate: string | null,
    dueDate: string | null
  ) => boolean
  deleteWorkItem: (workItemId: string) => boolean
  resetDemo: () => void
}

export type ProjectStore = ProjectWorkspaceState & ProjectStoreActions
export type ProjectStoreApi = StoreApi<ProjectStore>

export function createProjectStore(
  initialState: ProjectWorkspaceState = createProjectSeedState()
): ProjectStoreApi {
  const baseline = cloneProjectState(initialState)

  return createStore<ProjectStore>()((set, get) => ({
    ...cloneProjectState(baseline),

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

    moveWorkItem(workItemId, status, index) {
      const current = readProjectState(get())
      const next = moveWorkItemState(current, workItemId, status, index)

      if (next === current) {
        return false
      }

      set(next)
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

    deleteWorkItem(workItemId) {
      const current = readProjectState(get())
      const next = deleteWorkItemState(current, workItemId)

      if (next === current) {
        return false
      }

      set(next)
      return true
    },

    resetDemo() {
      set(cloneProjectState(baseline))
    },
  }))
}

function readProjectState(store: ProjectStore): ProjectWorkspaceState {
  return {
    projectIdsByWorkspaceId: store.projectIdsByWorkspaceId,
    projectsById: store.projectsById,
    projectViewsById: store.projectViewsById,
    workItemsById: store.workItemsById,
    resourcesById: store.resourcesById,
    milestonesById: store.milestonesById,
  }
}

function cloneProjectState(state: ProjectWorkspaceState) {
  return structuredClone(state)
}
