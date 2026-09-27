import assert from "node:assert/strict"
import test from "node:test"

import { createProjectStore } from "./store.ts"
import { parseBackup } from "./backup.ts"

const deletedId = "work-item-2-audit-onboarding"
const dependentId = "work-item-2-workspace-filters"
const siblingId = "work-item-2-api-error-model"

function undo(store) {
  assert.equal(typeof store.getState().undoDeleteWorkItem, "function")
  return store.getState().undoDeleteWorkItem()
}

test("Undo restores the deleted task, Board order and incoming dependencies atomically", () => {
  const store = createProjectStore()
  assert.equal(store.getState().createAndLinkWorkItemDocument({
    id: "undo-notes", workItemId: deletedId, title: "Notes",
  }), true)
  const before = store.getState()
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(store.getState().deleteWorkItem(deletedId), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().workItemsById[dependentId].dependencyIds.includes(deletedId), false)
  assert.equal(undo(store), true)
  assert.equal(notifications, 2)
  assert.deepEqual(store.getState().workItemsById, before.workItemsById)
  assert.strictEqual(store.getState().resourcesById, before.resourcesById)
  assert.equal(store.getState().lastWorkItemDeletion, null)
  assert.equal(undo(store), false)
  assert.equal(notifications, 2)
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("Undo preserves subsequent task edits, dependency additions and Board moves", () => {
  const store = createProjectStore()
  assert.equal(store.getState().deleteWorkItem(deletedId), true)
  assert.equal(store.getState().updateWorkItem(dependentId, {
    title: "Edited after deletion", dependencyIds: [siblingId],
  }), true)
  assert.equal(store.getState().moveWorkItem(siblingId, "task-board-2-todo", 0), true)
  assert.equal(store.getState().saveProjectDocument("resource-1-document", "<p>Keep this edit</p>"), true)
  const documents = store.getState().resourcesById
  assert.equal(undo(store), true)
  assert.equal(store.getState().workItemsById[dependentId].title, "Edited after deletion")
  assert.deepEqual(store.getState().workItemsById[dependentId].dependencyIds, [deletedId, siblingId])
  assert.equal(store.getState().workItemsById[siblingId].boardId, "task-board-2-todo")
  assert.strictEqual(store.getState().resourcesById, documents)
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("only the latest successful deletion can be undone", () => {
  const store = createProjectStore()
  assert.equal(store.getState().deleteWorkItem(deletedId), true)
  assert.equal(store.getState().deleteWorkItem(siblingId), true)
  const pending = store.getState().lastWorkItemDeletion
  assert.equal(store.getState().deleteWorkItem("missing"), false)
  assert.strictEqual(store.getState().lastWorkItemDeletion, pending)
  assert.equal(undo(store), true)
  assert.ok(store.getState().workItemsById[siblingId])
  assert.equal(store.getState().workItemsById[deletedId], undefined)
  assert.equal(undo(store), false)
})

test("Undo rejects dependency cycles, missing labels and ID collisions without partial changes", () => {
  for (const conflict of ["cycle", "label", "identity"]) {
    const store = createProjectStore()
    assert.equal(store.getState().updateWorkItem(deletedId, { dependencyIds: [siblingId] }), true)
    const original = store.getState().workItemsById[deletedId]
    assert.equal(store.getState().deleteWorkItem(deletedId), true)
    if (conflict === "cycle") {
      assert.equal(store.getState().updateWorkItem(siblingId, { dependencyIds: [dependentId] }), true)
    } else if (conflict === "label") {
      assert.ok(original.labelIds.length > 0)
      const view = store.getState().projectViewsById["view-2-board"]
      assert.equal(store.getState().updateBoardLabels({
        viewId: view.id, labels: view.labels.filter(label => !original.labelIds.includes(label.id)),
      }), true)
    } else {
      assert.equal(store.getState().createWorkItem({ ...original, title: "New task using the ID" }), true)
    }
    const before = store.getState()
    assert.equal(undo(store), false, conflict)
    assert.strictEqual(store.getState(), before, conflict)
    assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
  }
})

test("Undo history is session-only and cleared by import, reset or deleting its owner", () => {
  for (const clear of ["import", "reset", "project", "workspace"]) {
    const store = createProjectStore()
    assert.equal(store.getState().deleteWorkItem(deletedId), true)
    const pending = store.getState().lastWorkItemDeletion
    assert.ok(pending)
    const backup = store.getState().exportBackup()
    assert.equal("lastWorkItemDeletion" in JSON.parse(backup).data, false)
    assert.equal(store.getState().importBackup("invalid").ok, false)
    assert.strictEqual(store.getState().lastWorkItemDeletion, pending)
    if (clear === "import") assert.equal(store.getState().importBackup(backup).ok, true)
    if (clear === "reset") store.getState().resetDemo()
    if (clear === "project") assert.equal(store.getState().deleteProject("2"), true)
    if (clear === "workspace") assert.equal(store.getState().deleteWorkspace("project-alpha"), true)
    assert.equal(store.getState().lastWorkItemDeletion, null, clear)
    assert.equal(undo(store), false, clear)
  }
})
