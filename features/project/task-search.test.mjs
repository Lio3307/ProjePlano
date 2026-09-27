import assert from "node:assert/strict"
import test from "node:test"
import * as selectors from "./selectors.ts"
import { createProjectStore } from "./store.ts"
import { createProjectSeedState } from "./seed-data.ts"

function search(state, query = "", includeCompleted = false) {
  assert.equal(typeof selectors.selectSearchWorkItems, "function", "search selector exists")
  return selectors.selectSearchWorkItems(state, query, includeCompleted)
}

test("search finds undated and future tasks by title across projects and ignores case/outer spaces", () => {
  const store = createProjectStore()
  const id = "work-item-2-audit-onboarding"
  assert.equal(store.getState().updateWorkItem(id, { title: "Find my TASK" }), true)
  assert.equal(store.getState().updateWorkItemDateRange(id, null, null), true)
  const state = store.getState()
  const items = search(state, "  MY task  ")
  assert.deepEqual(items.map(item => item.workItem.id), [id])
  assert.strictEqual(items[0].project, state.projectsById["2"])
  assert.strictEqual(items[0].workspace, state.workspacesById[items[0].project.workspaceId])
  assert.equal(items[0].workItem.dueDate, null)
  assert.equal(store.getState().updateWorkItemDateRange(id, null, "2040-01-01"), true)
  assert.equal(search(store.getState(), "my task").length, 1)
  assert.ok(new Set(search(state).map(item => item.project.id)).size > 1)
})

test("search excludes archived projects, includes done tasks only on request and follows edits/deletion", () => {
  const store = createProjectStore()
  const id = "work-item-2-audit-onboarding"
  assert.equal(store.getState().updateWorkItem(id, { title: "Unique search item" }), true)
  assert.equal(store.getState().completeWorkItem(id, "task-board-2-done"), true)
  assert.deepEqual(search(store.getState(), "unique search"), [])
  assert.equal(search(store.getState(), "unique search", true).length, 1)
  assert.equal(store.getState().setProjectArchived("2", true), true)
  assert.deepEqual(search(store.getState(), "unique search", true), [])
  assert.equal(store.getState().setProjectArchived("2", false), true)
  assert.equal(store.getState().updateWorkItem(id, { title: "Renamed" }), true)
  assert.deepEqual(search(store.getState(), "unique search", true), [])
  assert.equal(store.getState().deleteWorkItem(id), true)
  assert.deepEqual(search(store.getState(), "renamed", true), [])
})

test("search is stable for the same snapshot/query and respects ownership", () => {
  const state = createProjectStore().getState()
  const items = search(state)
  assert.strictEqual(search(state), items)
  const empty = search(state, "no-matching-title-12345")
  assert.strictEqual(search(state, "no-matching-title-12345"), empty)
  assert.deepEqual(empty, [])
  assert.deepEqual(search({ ...state, workspaceIds: [] }), [])
  assert.deepEqual(search({ ...state, projectViewsById: {} }), [])
  assert.strictEqual(search(state), items)
})

test("search resolves the correct workspace when matching projects belong to different workspaces", () => {
  const state = createProjectSeedState()
  const project = state.projectsById["2"]
  const workspaceId = state.workspaceIds.find(id => id !== project.workspaceId)
  assert.ok(workspaceId)
  state.projectIdsByWorkspaceId[project.workspaceId] = state.projectIdsByWorkspaceId[project.workspaceId].filter(id => id !== project.id)
  state.projectIdsByWorkspaceId[workspaceId] = [...(state.projectIdsByWorkspaceId[workspaceId] ?? []), project.id]
  state.projectsById[project.id] = { ...project, workspaceId }
  const item = search(state).find(item => item.project.id === project.id)
  assert.equal(item.workspace.id, workspaceId)
  assert.ok(new Set(search(state).map(item => item.workspace.id)).size > 1)
})
