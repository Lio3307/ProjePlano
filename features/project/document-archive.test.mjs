import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { selectSearchWorkItems, selectProjectResolvedWorkItems } from "./selectors.ts"
import { createWorkItemFilters, filterWorkItems } from "../work-item/filters.ts"

test("duplicates saved document content independently without copying task links", () => {
  const store = createProjectStore()
  const source = Object.values(store.getState().resourcesById).find(r => r.type === "document")
  store.getState().saveProjectDocument(source.id, "<p>Saved content</p>")
  assert.equal(typeof store.getState().duplicateProjectDocument, "function")
  assert.equal(store.getState().duplicateProjectDocument(source.id, "document-copy"), true)
  const copy = store.getState().resourcesById["document-copy"]
  assert.equal(copy.title, source.title + " (copy)")
  assert.equal(copy.content, "<p>Saved content</p>")
  assert.equal(copy.projectId, source.projectId)
  assert.equal(copy.isPinned, false)
  store.getState().saveProjectDocument(copy.id, "<p>Edited copy</p>")
  assert.equal(store.getState().resourcesById[source.id].content, "<p>Saved content</p>")
  assert.equal(Object.values(store.getState().workItemsById).some(t => t.linkedResourceIds.includes(copy.id)), false)
  const before = store.getState()
  assert.equal(before.duplicateProjectDocument(source.id, copy.id), false)
  assert.equal(before.duplicateProjectDocument("missing", "other-copy"), false)
  assert.equal(store.getState(), before)
})

test("archives only completed tasks, hides presentation, retains references and roundtrips backups", () => {
  const store = createProjectStore()
  const tasks = Object.values(store.getState().workItemsById)
  const done = tasks.find(t => store.getState().taskBoardsById[t.boardId].stage === "done")
  const active = tasks.find(t => store.getState().taskBoardsById[t.boardId].stage !== "done")
  assert.ok(done)
  assert.equal(typeof store.getState().setWorkItemArchived, "function")
  assert.equal(store.getState().setWorkItemArchived(active.id, true), false)
  assert.equal(store.getState().setWorkItemArchived(done.id, true), true)
  const archived = store.getState().workItemsById[done.id]
  assert.deepEqual(archived, { ...done, archived: true })
  assert.equal(selectSearchWorkItems(store.getState(), "", true).some(r => r.workItem.id === done.id), false)
  const all = selectProjectResolvedWorkItems(store.getState(), done.projectId)
  assert.ok(all.some(r => r.workItem.id === done.id))
  assert.equal(filterWorkItems(all.map(r => r.workItem), {}, createWorkItemFilters()).some(t => t.id === done.id), false)
  const imported = createProjectStore()
  assert.equal(imported.getState().importBackup(store.getState().exportBackup()).ok, true)
  assert.equal(imported.getState().workItemsById[done.id].archived, true)
  assert.equal(imported.getState().setWorkItemArchived(done.id, false), true)
  assert.equal(selectSearchWorkItems(imported.getState(), "", true).some(r => r.workItem.id === done.id), true)
  const payload = JSON.parse(store.getState().exportBackup())
  payload.data.workItemsById[done.id].archived = "yes"
  assert.equal(imported.getState().importBackup(JSON.stringify(payload)).ok, false)
  payload.data.workItemsById[done.id].archived = true
  payload.data.taskBoardsById[done.boardId].stage = "todo"
  const beforeInvalidImport = imported.getState()
  assert.equal(imported.getState().importBackup(JSON.stringify(payload)).ok, false)
  assert.equal(imported.getState(), beforeInvalidImport)
})

test("archiving clears completion Undo and moving an archived task reopens it visibly", () => {
  const store = createProjectStore()
  const state = store.getState()
  const item = Object.values(state.workItemsById).find(t => state.taskBoardsById[t.boardId].stage !== "done" &&
    Object.values(state.taskBoardsById).some(b => b.projectId === t.projectId && b.stage === "done"))
  const completedBoard = Object.values(state.taskBoardsById).find(b => b.projectId === item.projectId && b.stage === "done")
  assert.equal(store.getState().completeWorkItem(item.id, completedBoard.id), true)
  assert.ok(store.getState().lastWorkItemCompletion)
  assert.equal(store.getState().setWorkItemArchived(item.id, true), true)
  assert.equal(store.getState().lastWorkItemCompletion, null)
  assert.equal(store.getState().moveWorkItem(item.id, item.boardId, item.position), true)
  assert.equal(store.getState().workItemsById[item.id].archived, false)
  assert.equal(store.getState().importBackup(store.getState().exportBackup()).ok, true)
})

test("reopening a Board restores its archived tasks; old backups remain accepted", () => {
  const store = createProjectStore()
  assert.equal(store.getState().importBackup(store.getState().exportBackup()).ok, true)
  const done = Object.values(store.getState().workItemsById).find(t => store.getState().taskBoardsById[t.boardId].stage === "done")
  assert.equal(typeof store.getState().setWorkItemArchived, "function")
  store.getState().setWorkItemArchived(done.id, true)
  const board = store.getState().taskBoardsById[done.boardId]
  assert.equal(store.getState().updateTaskBoard({ boardId: board.id, title: board.title, description: board.description, stage: "todo" }), true)
  assert.equal(store.getState().workItemsById[done.id].archived, false)
  assert.equal(store.getState().importBackup(store.getState().exportBackup()).ok, true)
})
