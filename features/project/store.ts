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
  duplicateProjectDocumentState,
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
import { applyPlanningAction, reconcilePlanning, type PlanningAction } from "./planning-state.ts"
import { EMPTY_PLANNING, isPlanningDate } from "./planning.ts"
import { duplicateProjectState } from "./duplicate-project.ts"
import { renameProjectDocumentState, setDocumentPinnedState, moveProjectDocumentState, deleteProjectDocumentState } from "./document-state.ts"
import {
  captureBulkWorkItemChange, retainBulkWorkItemChange, undoBulkWorkItemChangeState,
  type BulkWorkItemChange,
} from "./bulk-work-item-history.ts"
import {
  createAndLinkWorkItemDocumentState,
  createWorkItemState,
  setWorkItemArchivedState,
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
  updateWorkItemLabelsState,
  updateWorkItemState,
  unlinkWorkItemDocumentState,
  undoWorkItemCompletionState,
  type CreateAndLinkWorkItemDocumentInput,
  type WorkItemDetailsPatch,
  type WorkItemDeletion,
  type WorkItemCompletion,
} from "./work-item-state.ts"

export type ProjectStoreActions = {
  plan: (action: PlanningAction) => boolean
  duplicateProject: (sourceId: string, workspaceId: string, title: string) => boolean
  startTimer: (taskId: string, date: string, now?: number) => boolean
  stopTimer: (now?: number) => boolean
  createWorkspace: (input: Workspace) => boolean
  updateWorkspace: (id: string, details: WorkspaceDetails) => boolean
  deleteWorkspace: (id: string) => boolean
  updateProject: (id: string, details: ProjectDetails) => boolean
  setProjectArchived: (id: string, archived: boolean) => boolean
  deleteProject: (id: string) => boolean
  exportBackup: () => string
  markBackupDownloaded: (text: string) => boolean
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
  updateDocumentDraft: (resourceId: string, content: string) => boolean
  discardDocumentDraft: (resourceId: string) => boolean
  renameProjectDocument: (resourceId: string, title: string) => boolean
  setDocumentPinned: (resourceId: string, pinned: boolean) => boolean
  moveProjectDocument: (resourceId: string, direction: -1 | 1) => boolean
  deleteProjectDocument: (resourceId: string) => boolean
  duplicateProjectDocument: (resourceId: string, newResourceId: string) => boolean
  setWorkItemArchived: (workItemId: string, archived: boolean) => boolean
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
  updateWorkItemLabels: (workItemIds: readonly string[], labelId: string, operation: "add" | "remove") => boolean
  undoBulkWorkItemChange: () => boolean
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
  runningTimer: { taskId: string; date: string; startedAt: number } | null
  documentDraftsById: Record<string, string>
  backupBaseline: ProjectWorkspaceState
  dataRevision: number
  lastWorkItemDeletion: WorkItemDeletion | null
  lastWorkItemCompletion: WorkItemCompletion | null
  lastBulkWorkItemChange: BulkWorkItemChange | null
}
export type ProjectStoreApi = StoreApi<ProjectStore>

export function createProjectStore(
  initialState: ProjectWorkspaceState = createProjectSeedState()
): ProjectStoreApi {
  const baseline = cloneProjectState(initialState)
  const initialData = cloneProjectState(baseline)
  let pendingExport: { text: string; data: ProjectWorkspaceState } | null = null

  return createStore<ProjectStore>()((rawSet, get) => {
    function set(patch: Partial<ProjectStore>) {
      const before = get()
      const merged = { ...before, ...patch }
      const replaced = merged.dataRevision !== before.dataRevision
      const next = replaced ? merged : reconcilePlanning(before, merged, () => crypto.randomUUID())
      const timer = merged.runningTimer
      rawSet({ ...patch, planning: next.planning, workItemsById: next.workItemsById,
        runningTimer: replaced || (timer && !next.workItemsById[timer.taskId]) ? null : timer,
      })
    }
    return ({
    ...initialData,
    runningTimer: null,
    documentDraftsById: {},
    backupBaseline: initialData,
    dataRevision: 0,
    lastWorkItemDeletion: null,
    lastWorkItemCompletion: null,
    lastBulkWorkItemChange: null,

    plan(action) {
      const current = readProjectState(get())
      const next = applyPlanningAction(current, action, () => crypto.randomUUID())
      if (next === current) return false
      const deletion = get().lastWorkItemDeletion
      set({ ...next, lastWorkItemDeletion: action.type === "delete-milestone" && deletion?.workItem.milestoneId === action.id
        ? { ...deletion, workItem: { ...deletion.workItem, milestoneId: null } } : deletion })
      return true
    },

    duplicateProject(sourceId, workspaceId, title) {
      const current = readProjectState(get())
      const next = duplicateProjectState(current, sourceId, workspaceId, title, () => crypto.randomUUID())
      if (next === current) return false
      set(next)
      return true
    },

    startTimer(taskId, date, now = Date.now()) {
      const task = get().workItemsById[taskId]
      if (get().runningTimer || !Object.hasOwn(get().workItemsById, taskId) || !task || task.archived || get().projectsById[task.projectId]?.archived ||
        !isPlanningDate(date) || !Number.isFinite(now) || now < 0) return false
      set({ runningTimer: { taskId, date, startedAt: now } })
      return true
    },

    stopTimer(now = Date.now()) {
      const timer = get().runningTimer
      if (!timer || !Number.isFinite(now) || now < timer.startedAt) return false
      const current = readProjectState(get())
      const next = applyPlanningAction(current, { type: "entry", entry: {
        id: crypto.randomUUID(), taskId: timer.taskId, date: timer.date,
        minutes: Math.max(1, Math.ceil((now - timer.startedAt) / 60000)), note: "Timer",
      } }, () => crypto.randomUUID())
      if (next === current) return false
      set({ ...next, runningTimer: null })
      return true
    },

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
        documentDraftsById: retainDocumentDrafts(get().documentDraftsById, next),
        lastWorkItemDeletion: deletion && next.projectsById[deletion.workItem.projectId] ? deletion : null,
        lastWorkItemCompletion: completion && next.projectsById[completion.projectId] ? completion : null,
        lastBulkWorkItemChange: retainBulkWorkItemChange(get().lastBulkWorkItemChange, next),
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
        documentDraftsById: retainDocumentDrafts(get().documentDraftsById, next),
        lastWorkItemDeletion: deletion && next.projectsById[deletion.workItem.projectId] ? deletion : null,
        lastWorkItemCompletion: completion && next.projectsById[completion.projectId] ? completion : null,
        lastBulkWorkItemChange: retainBulkWorkItemChange(get().lastBulkWorkItemChange, next),
      })
      return true
    },

    exportBackup() {
      const data = readProjectState(get())
      const text = serializeBackup(data)
      pendingExport = { text, data }
      return text
    },

    markBackupDownloaded(text) {
      if (!pendingExport || pendingExport.text !== text) return false
      const backupBaseline = pendingExport.data
      pendingExport = null
      set({ backupBaseline })
      return true
    },

    importBackup(text) {
      const result = parseBackup(text)
      if (!result.ok) return result
      const data = cloneProjectState(result.data)
      pendingExport = null
      set({ ...data, planning: data.planning, documentDraftsById: {}, backupBaseline: data, dataRevision: get().dataRevision + 1, lastWorkItemDeletion: null, lastWorkItemCompletion: null, lastBulkWorkItemChange: null })
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

    renameProjectDocument(id, title) {
      const current = readProjectState(get())
      const next = renameProjectDocumentState(current, id, title)
      if (next === current) return false
      set(next)
      return true
    },

    setDocumentPinned(id, pinned) {
      const current = readProjectState(get())
      const next = setDocumentPinnedState(current, id, pinned)
      if (next === current) return false
      set(next)
      return true
    },

    moveProjectDocument(id, direction) {
      const current = readProjectState(get())
      const next = moveProjectDocumentState(current, id, direction)
      if (next === current) return false
      set(next)
      return true
    },

    deleteProjectDocument(id) {
      const current = readProjectState(get())
      const next = deleteProjectDocumentState(current, id)
      if (next === current) return false
      const deletion = get().lastWorkItemDeletion
      set({ ...next,
        documentDraftsById: retainDocumentDrafts(get().documentDraftsById, next),
        lastWorkItemDeletion: deletion ? { ...deletion, workItem: {
          ...deletion.workItem, linkedResourceIds: deletion.workItem.linkedResourceIds.filter(resourceId => resourceId !== id),
        } } : null,
      })
      return true
    },

    duplicateProjectDocument(resourceId, newResourceId) {
      const current = readProjectState(get())
      const next = duplicateProjectDocumentState(current, resourceId, newResourceId)
      if (next === current) return false
      set(next)
      return true
    },

    setWorkItemArchived(workItemId, archived) {
      const current = readProjectState(get())
      const next = setWorkItemArchivedState(current, workItemId, archived)
      if (next === current) return false
      set({ ...next,
        lastWorkItemCompletion: get().lastWorkItemCompletion?.workItemId === workItemId ? null : get().lastWorkItemCompletion,
        lastBulkWorkItemChange: get().lastBulkWorkItemChange?.entries.some(entry => entry.before.id === workItemId)
          ? null : get().lastBulkWorkItemChange,
      })
      return true
    },

    updateDocumentDraft(resourceId, content) {
      const resource = get().resourcesById[resourceId]
      if (resource?.type !== "document" || typeof content !== "string") return false
      if (content === resource.content) return get().discardDocumentDraft(resourceId)
      if (get().documentDraftsById[resourceId] === content) return false
      set({ documentDraftsById: { ...get().documentDraftsById, [resourceId]: content } })
      return true
    },

    discardDocumentDraft(resourceId) {
      if (!Object.hasOwn(get().documentDraftsById, resourceId)) return false
      const documentDraftsById = { ...get().documentDraftsById }
      delete documentDraftsById[resourceId]
      set({ documentDraftsById })
      return true
    },

    saveProjectDocument(resourceId, content) {
      const current = readProjectState(get())
      const next = saveProjectDocumentState(current, resourceId, content)

      if (next === current) {
        return false
      }

      const documentDraftsById = { ...get().documentDraftsById }
      if (documentDraftsById[resourceId] === content) delete documentDraftsById[resourceId]
      set({ ...next, documentDraftsById })
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
      set({ ...next, lastBulkWorkItemChange: captureBulkWorkItemChange(current, next, workItemIds, "dueDate") })
      return true
    },

    updateWorkItemPriorities(workItemIds, priority) {
      const current = readProjectState(get())
      const next = updateWorkItemPrioritiesState(current, workItemIds, priority)
      if (next === current) return false
      set({ ...next, lastBulkWorkItemChange: captureBulkWorkItemChange(current, next, workItemIds, "priority") })
      return true
    },

    moveWorkItems(workItemIds, targetBoardId) {
      const current = readProjectState(get())
      const next = moveWorkItemsState(current, workItemIds, targetBoardId)
      if (next === current) return false
      const completion = get().lastWorkItemCompletion
      const completedTaskMoved = completion &&
        next.workItemsById[completion.workItemId]?.boardId !== current.workItemsById[completion.workItemId]?.boardId
      set({ ...next, lastWorkItemCompletion: completedTaskMoved ? null : completion,
        lastBulkWorkItemChange: captureBulkWorkItemChange(current, next, workItemIds, "boardId"),
      })
      return true
    },

    updateWorkItemLabels(workItemIds, labelId, operation) {
      const current = readProjectState(get())
      const next = updateWorkItemLabelsState(current, workItemIds, labelId, operation)
      if (next === current) return false
      set({ ...next, lastBulkWorkItemChange: captureBulkWorkItemChange(current, next, workItemIds, "labelIds") })
      return true
    },

    undoBulkWorkItemChange() {
      const change = get().lastBulkWorkItemChange
      if (!change) return false
      const current = readProjectState(get())
      const next = undoBulkWorkItemChangeState(current, change)
      if (next === current) return false
      const completion = get().lastWorkItemCompletion
      const completedTaskMoved = completion &&
        next.workItemsById[completion.workItemId]?.boardId !== current.workItemsById[completion.workItemId]?.boardId
      set({ ...next, lastBulkWorkItemChange: null, lastWorkItemCompletion: completedTaskMoved ? null : completion })
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
        planning: {
          task: current.planning?.tasks[workItemId] ?? null,
          entries: Object.values(current.planning?.entries ?? {}).filter(entry => entry.taskId === workItemId),
        },
        workItem: structuredClone(current.workItemsById[workItemId]),
        dependents: Object.values(current.workItemsById).flatMap(item => {
          const dependencyIndex = item.dependencyIds.indexOf(workItemId)
          return dependencyIndex < 0 ? [] : [{ id: item.id, dependencyIndex }]
        }),
      }
      const completion = get().lastWorkItemCompletion
      set({ ...next, lastWorkItemDeletion: deletion,
        lastWorkItemCompletion: completion?.workItemId === workItemId ? null : completion,
        lastBulkWorkItemChange: retainBulkWorkItemChange(get().lastBulkWorkItemChange, next),
      })
      return true
    },

    undoDeleteWorkItem() {
      const deletion = get().lastWorkItemDeletion
      if (!deletion) return false
      const current = readProjectState(get())
      const next = restoreDeletedWorkItemState(current, deletion)
      if (next === current) return false
      const planning = next.planning ?? EMPTY_PLANNING
      const restoredPlanning = deletion.planning && (deletion.planning.task || deletion.planning.entries.length)
        ? { ...planning, tasks: deletion.planning.task ? { ...planning.tasks, [deletion.workItem.id]: deletion.planning.task } : planning.tasks,
          entries: { ...planning.entries, ...Object.fromEntries(deletion.planning.entries.map(entry => [entry.id, entry])) } }
        : next.planning
      set({ ...next, planning: restoredPlanning, lastWorkItemDeletion: null })
      return true
    },

    resetDemo() {
      const data = cloneProjectState(baseline)
      pendingExport = null
      set({ ...data, planning: data.planning, documentDraftsById: {}, backupBaseline: data, dataRevision: get().dataRevision + 1, lastWorkItemDeletion: null, lastWorkItemCompletion: null, lastBulkWorkItemChange: null })
    },
    })
  })
}

function readProjectState(store: ProjectStore): ProjectWorkspaceState {
  return {
    ...(store.planning ? { planning: store.planning } : {}),
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

function retainDocumentDrafts(drafts: Record<string, string>, state: ProjectWorkspaceState) {
  return Object.fromEntries(Object.entries(drafts).filter(([id]) => state.resourcesById[id]?.type === "document"))
}
