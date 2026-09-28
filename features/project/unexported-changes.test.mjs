import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { hasUnexportedChanges, watchUnexportedChanges } from "./unexported-changes.ts"
import { warnBeforeUnload } from "../../lib/before-unload.ts"

const taskId = "work-item-2-audit-onboarding"

test("exporting store data does not remove the separate document draft warning", () => {
  const store = createProjectStore()
  const listeners = new Set()
  const target = {
    addEventListener: (_name, handler) => listeners.add(handler),
    removeEventListener: (_name, handler) => listeners.delete(handler),
  }
  const stopStore = watchUnexportedChanges(store, target)
  const stopDraft = warnBeforeUnload(target)
  assert.equal(listeners.size, 1)
  store.getState().updateWorkItem(taskId, { title: "Changed" })
  assert.equal(listeners.size, 2)
  store.getState().markBackupDownloaded(store.getState().exportBackup())
  assert.equal(listeners.size, 1)
  const event = { prevented: false, returnValue: "", preventDefault() { this.prevented = true } }
  for (const listener of listeners) listener(event)
  assert.equal(event.prevented, true)
  assert.ok(event.returnValue)
  store.getState().updateWorkItem(taskId, { title: "Saved new content" })
  stopDraft()
  assert.equal(listeners.size, 1, "saving the draft must not remove the store warning")
  stopStore()
  assert.equal(listeners.size, 0)
})

test("download acknowledgement tracks the exported snapshot without exporting tracking metadata", () => {
  const store = createProjectStore()
  assert.ok(store.getState().backupBaseline)
  const baseline = store.getState().backupBaseline
  store.getState().updateWorkItem(taskId, { title: "Changed" })
  const exported = store.getState().exportBackup()
  assert.strictEqual(store.getState().backupBaseline, baseline)
  assert.equal("backupBaseline" in JSON.parse(exported).data, false)
  assert.equal(store.getState().markBackupDownloaded("not this export"), false)
  assert.equal(store.getState().markBackupDownloaded(exported), true)
  assert.strictEqual(store.getState().backupBaseline.workItemsById, store.getState().workItemsById)
  assert.equal(store.getState().markBackupDownloaded(exported), false)
})

test("acknowledging an older snapshot does not mark newer edits as exported", () => {
  const store = createProjectStore()
  const exported = store.getState().exportBackup()
  store.getState().updateWorkItem(taskId, { title: "After export" })
  assert.equal(typeof store.getState().markBackupDownloaded, "function")
  assert.equal(store.getState().markBackupDownloaded(exported), true)
  assert.notStrictEqual(store.getState().backupBaseline.workItemsById, store.getState().workItemsById)
})

test("valid import/reset establish a clean baseline and discard pending exports; invalid import does not", () => {
  const store = createProjectStore()
  const exported = store.getState().exportBackup()
  store.getState().updateWorkItem(taskId, { title: "Changed" })
  const before = store.getState()
  assert.equal(store.getState().importBackup("bad").ok, false)
  assert.strictEqual(store.getState(), before)
  assert.equal(store.getState().importBackup(exported).ok, true)
  assert.ok(store.getState().backupBaseline)
  assert.strictEqual(store.getState().backupBaseline.workItemsById, store.getState().workItemsById)
  assert.equal(store.getState().markBackupDownloaded(exported), false)
  store.getState().updateWorkItem(taskId, { title: "Another change" })
  store.getState().resetDemo()
  assert.strictEqual(store.getState().backupBaseline.workItemsById, store.getState().workItemsById)
})

test("beforeunload listener follows data edits, download, import and cleanup without reacting to history metadata", () => {
  const store = createProjectStore()
  const listeners = new Map()
  const target = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => {
      assert.strictEqual(listeners.get(name), handler)
      listeners.delete(name)
    },
  }
  const cleanup = watchUnexportedChanges(store, target)
  assert.equal(listeners.size, 0)
  assert.equal(store.getState().updateWorkItem("missing", { title: "Invalid" }), false)
  assert.equal(listeners.size, 0)
  store.setState({ lastBulkWorkItemChange: null })
  assert.equal(listeners.size, 0)
  store.getState().updateWorkItem(taskId, { title: "Changed" })
  assert.equal(listeners.size, 1)
  const event = { prevented: false, returnValue: "", preventDefault() { this.prevented = true } }
  listeners.get("beforeunload")(event)
  assert.equal(event.prevented, true)
  assert.ok(event.returnValue)
  const exported = store.getState().exportBackup()
  assert.equal(listeners.size, 1, "serialization alone does not mean a download started")
  store.getState().markBackupDownloaded(exported)
  assert.equal(listeners.size, 0)
  store.getState().updateWorkItem(taskId, { title: "Changed again" })
  assert.equal(listeners.size, 1)
  store.getState().importBackup(exported)
  assert.equal(listeners.size, 0)
  store.getState().updateWorkItem(taskId, { title: "After import" })
  assert.equal(listeners.size, 1)
  cleanup()
  assert.equal(listeners.size, 0)
  store.getState().resetDemo()
  store.getState().updateWorkItem(taskId, { title: "After cleanup" })
  assert.equal(listeners.size, 0)
})

test("workspace, project, Board, document and Table edits all require another export", () => {
  const mutations = [
    state => state.updateWorkspace(state.workspaceIds[0], { title: "Edited workspace", description: "" }),
    state => state.setProjectArchived("2", true),
    state => {
      const board = Object.values(state.taskBoardsById)[0]
      return state.updateTaskBoard({ boardId: board.id, title: "Edited board", description: board.description, stage: board.stage })
    },
    state => state.saveProjectDocument(Object.values(state.resourcesById).find(resource => resource.type === "document").id, "<p>Edited</p>"),
    state => state.updateTable(Object.keys(state.tablesByViewId)[0], table => ({ ...table, rows: [] })),
  ]
  for (const mutate of mutations) {
    const store = createProjectStore()
    assert.equal(hasUnexportedChanges(store.getState()), false)
    assert.equal(mutate(store.getState()), true)
    assert.equal(hasUnexportedChanges(store.getState()), true)
    store.getState().markBackupDownloaded(store.getState().exportBackup())
    assert.equal(hasUnexportedChanges(store.getState()), false)
  }
})
