import type { ProjectStore, ProjectStoreApi } from "./store"
import { warnBeforeUnload } from "../../lib/before-unload.ts"

export function hasUnexportedChanges(state: ProjectStore) {
  const saved = state.backupBaseline
  return state.workspaceIds !== saved.workspaceIds ||
    state.workspacesById !== saved.workspacesById ||
    state.projectIdsByWorkspaceId !== saved.projectIdsByWorkspaceId ||
    state.projectsById !== saved.projectsById ||
    state.projectViewsById !== saved.projectViewsById ||
    state.taskBoardsById !== saved.taskBoardsById ||
    state.workItemsById !== saved.workItemsById ||
    state.resourcesById !== saved.resourcesById ||
    state.milestonesById !== saved.milestonesById ||
    state.tablesByViewId !== saved.tablesByViewId
}

export function watchUnexportedChanges(
  store: ProjectStoreApi,
  target: Pick<Window, "addEventListener" | "removeEventListener">
) {
  let stopWarning: (() => void) | null = null
  function sync() {
    const state = store.getState()
    const dirty = hasUnexportedChanges(state) || Object.keys(state.documentDraftsById).length > 0
    if (dirty === (stopWarning !== null)) return
    stopWarning?.()
    stopWarning = dirty ? warnBeforeUnload(target) : null
  }
  const unsubscribe = store.subscribe(sync)
  sync()
  return () => {
    unsubscribe()
    stopWarning?.()
  }
}
