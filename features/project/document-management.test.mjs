import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"

function setup() {
  const store = createProjectStore()
  const projectId = Object.values(store.getState().workItemsById)[0].projectId
  store.getState().addProjectDocument({ id: "managed-document", projectId, title: "Managed" })
  const document = store.getState().resourcesById["managed-document"]
  return { store, document }
}

test("document metadata and order preserve drafts and round-trip through backup", () => {
  const { store, document } = setup()
  store.getState().updateDocumentDraft(document.id, "draft")
  assert.equal(store.getState().renameProjectDocument(document.id, "   "), false)
  assert.equal(store.getState().renameProjectDocument(document.id, " New title "), true)
  assert.equal(store.getState().setDocumentPinned(document.id, !document.isPinned), true)
  store.getState().addProjectDocument({ id: "last-document", projectId: document.projectId, title: "Last" })
  const order = store.getState().projectsById[document.projectId].resourceIds
  assert.equal(store.getState().moveProjectDocument("last-document", 1), false)
  assert.equal(store.getState().moveProjectDocument("last-document", -1), true)
  const moved = store.getState().projectsById[document.projectId].resourceIds
  assert.equal(moved.at(-2), "last-document")
  assert.equal(order.at(-1), "last-document")
  assert.equal(store.getState().documentDraftsById[document.id], "draft")
  const restored = createProjectStore()
  assert.equal(restored.getState().importBackup(store.getState().exportBackup()).ok, true)
  assert.equal(restored.getState().resourcesById[document.id].title, "New title")
  assert.equal(restored.getState().resourcesById[document.id].content, document.content)
  assert.equal(restored.getState().resourcesById[document.id].isPinned, !document.isPinned)
  assert.deepEqual(restored.getState().projectsById[document.projectId].resourceIds, moved)
})

test("deleting a document removes links and its draft without breaking task deletion Undo", () => {
  const { store, document } = setup()
  const tasks = Object.values(store.getState().workItemsById).filter(item => item.projectId === document.projectId)
  assert.ok(tasks.length >= 2)
  for (const task of tasks.slice(0, 2)) store.getState().linkWorkItemDocument(task.id, document.id)
  store.getState().deleteWorkItem(tasks[0].id)
  store.getState().updateDocumentDraft(document.id, "draft")
  const other = Object.values(store.getState().resourcesById).find(item => item.type === "document" && item.id !== document.id)
  store.getState().updateDocumentDraft(other.id, "other draft")
  assert.equal(store.getState().deleteProjectDocument(document.id), true)
  assert.equal(store.getState().resourcesById[document.id], undefined)
  assert.equal(store.getState().projectsById[document.projectId].resourceIds.includes(document.id), false)
  assert.equal(store.getState().documentDraftsById[document.id], undefined)
  assert.equal(store.getState().documentDraftsById[other.id], "other draft")
  assert.equal(store.getState().workItemsById[tasks[1].id].linkedResourceIds.includes(document.id), false)
  assert.equal(store.getState().undoDeleteWorkItem(), true)
  assert.equal(store.getState().workItemsById[tasks[0].id].linkedResourceIds.includes(document.id), false)
  assert.equal(createProjectStore().getState().importBackup(store.getState().exportBackup()).ok, true)
  const before = store.getState()
  assert.equal(store.getState().deleteProjectDocument("missing"), false)
  assert.equal(store.getState().renameProjectDocument("missing", "Name"), false)
  assert.equal(store.getState().moveProjectDocument("missing", -1), false)
  assert.equal(store.getState().setDocumentPinned("missing", true), false)
  assert.equal(store.getState(), before)
})
