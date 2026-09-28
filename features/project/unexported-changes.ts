import type { ProjectStore, ProjectStoreApi } from "./store"

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
  let listening = false
  function warn(event: BeforeUnloadEvent) {
    event.preventDefault()
    event.returnValue = "Unexported changes"
  }
  function sync() {
    const dirty = hasUnexportedChanges(store.getState())
    if (dirty === listening) return
    if (dirty) target.addEventListener("beforeunload", warn)
    else target.removeEventListener("beforeunload", warn)
    listening = dirty
  }
  const unsubscribe = store.subscribe(sync)
  sync()
  return () => {
    unsubscribe()
    if (listening) target.removeEventListener("beforeunload", warn)
  }
}
