import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { hasUnexportedChanges, watchUnexportedChanges } from "./unexported-changes.ts"

function setup() {
  const store = createProjectStore()
  const documents = Object.values(store.getState().resourcesById).filter(resource => resource.type === "document")
  assert.equal(typeof store.getState().updateDocumentDraft, "function")
  return { store, documents }
}

test("drafts live in the dashboard store independently, without changing saved content or backups", () => {
  const { store, documents: [first, second] } = setup()
  store.getState().updateDocumentDraft(first.id, "<p>First draft</p>")
  store.getState().updateDocumentDraft(second.id, "")
  assert.equal(store.getState().documentDraftsById[first.id], "<p>First draft</p>")
  assert.equal(store.getState().documentDraftsById[second.id], "")
  assert.equal(store.getState().resourcesById[first.id].content, first.content)
  assert.equal(hasUnexportedChanges(store.getState()), false)
  const backup = JSON.parse(store.getState().exportBackup())
  assert.equal("documentDraftsById" in backup.data, false)
  assert.equal(backup.data.resourcesById[first.id].content, first.content)
  assert.deepEqual(createProjectStore().getState().documentDraftsById, {})
})

test("Save, Discard and reverting to saved content remove only the matching draft", () => {
  const { store, documents: [first, second] } = setup()
  store.getState().updateDocumentDraft(first.id, "<p>Draft one</p>")
  store.getState().updateDocumentDraft(second.id, "<p>Draft two</p>")
  assert.equal(store.getState().saveProjectDocument(first.id, "<p>Draft one</p>"), true)
  assert.equal(store.getState().documentDraftsById[first.id], undefined)
  assert.equal(store.getState().documentDraftsById[second.id], "<p>Draft two</p>")
  assert.equal(store.getState().saveProjectDocument("missing", "bad"), false)
  assert.equal(store.getState().documentDraftsById[second.id], "<p>Draft two</p>")
  store.getState().discardDocumentDraft(second.id)
  assert.equal(store.getState().resourcesById[second.id].content, second.content)
  assert.deepEqual(store.getState().documentDraftsById, {})
  store.getState().updateDocumentDraft(first.id, "<p>Changed again</p>")
  store.getState().updateDocumentDraft(first.id, "<p>Draft one</p>")
  assert.deepEqual(store.getState().documentDraftsById, {})
  const before = store.getState()
  assert.equal(store.getState().updateDocumentDraft("missing", "bad"), false)
  assert.equal(store.getState().updateDocumentDraft("__proto__", "bad"), false)
  assert.equal(store.getState(), before)
  store.getState().updateDocumentDraft(second.id, "<p>Newer draft</p>")
  store.getState().saveProjectDocument(second.id, "<p>Different saved content</p>")
  assert.equal(store.getState().documentDraftsById[second.id], "<p>Newer draft</p>")
})

test("import/reset clear drafts; invalid import preserves them; deletion prunes only owned drafts", () => {
  const { store, documents } = setup()
  const first = documents[0]
  const other = documents.find(document => document.projectId !== first.projectId)
  const backup = store.getState().exportBackup()
  store.getState().updateDocumentDraft(first.id, "draft")
  assert.equal(store.getState().importBackup("bad").ok, false)
  assert.equal(store.getState().documentDraftsById[first.id], "draft")
  assert.equal(store.getState().importBackup(backup).ok, true)
  assert.deepEqual(store.getState().documentDraftsById, {})
  store.getState().updateDocumentDraft(first.id, "draft")
  store.getState().resetDemo()
  assert.deepEqual(store.getState().documentDraftsById, {})
  store.getState().updateDocumentDraft(first.id, "draft")
  store.getState().updateDocumentDraft(other.id, "other draft")
  assert.equal(store.getState().deleteProject(first.projectId), true)
  assert.deepEqual(store.getState().documentDraftsById, { [other.id]: "other draft" })
  store.getState().resetDemo()
  store.getState().updateDocumentDraft(first.id, "draft")
  assert.equal(store.getState().deleteWorkspace(store.getState().projectsById[first.projectId].workspaceId), true)
  assert.deepEqual(store.getState().documentDraftsById, {})
})

test("hidden drafts keep beforeunload protection even after exporting saved data", () => {
  const { store, documents: [first] } = setup()
  const handlers = new Set()
  const cleanup = watchUnexportedChanges(store, {
    addEventListener: (_, handler) => handlers.add(handler),
    removeEventListener: (_, handler) => handlers.delete(handler),
  })
  store.getState().updateDocumentDraft(first.id, "draft")
  assert.equal(handlers.size, 1)
  store.getState().markBackupDownloaded(store.getState().exportBackup())
  assert.equal(handlers.size, 1)
  store.getState().discardDocumentDraft(first.id)
  assert.equal(handlers.size, 0)
  cleanup()
})
