import assert from "node:assert/strict"
import test from "node:test"

import * as selectors from "./selectors.ts"
import { createProjectSeedState } from "./seed-data.ts"
import { createProjectStore } from "./store.ts"
import { getEditableWorkItemFields } from "../work-item/form.ts"
import { setProjectArchivedState } from "./lifecycle.ts"

function fixture(dates) {
  const state = createProjectSeedState()
  const base = state.workItemsById["work-item-2-workspace-filters"]
  state.workItemsById = Object.fromEntries(dates.map((dueDate, index) => {
    const id = "task-" + index
    return [id, { ...base, id, dueDate }]
  }))
  return state
}

function select(state, today = "2026-09-27") {
  assert.equal(typeof selectors.selectUpcomingWorkItems, "function", "Upcoming selector exists")
  return selectors.selectUpcomingWorkItems(state, today)
}

test("Upcoming includes tomorrow through day seven, excluding today, overdue and invalid dates", () => {
  const state = fixture(["2026-09-26", "2026-09-27", "2026-09-28", "2026-10-04", "2026-10-05", null, "2026-02-30"])
  const before = structuredClone(state)
  assert.deepEqual(select(state).map(item => item.workItem.id), ["task-2", "task-3"])
  assert.deepEqual(state, before)
  assert.deepEqual(select(state, "invalid"), [])
})

test("Upcoming handles year, leap-day and daylight-saving boundaries as calendar dates", () => {
  for (const [today, first, last, outside] of [
    ["2026-12-28", "2026-12-29", "2027-01-04", "2027-01-05"],
    ["2028-02-28", "2028-02-29", "2028-03-06", "2028-03-07"],
    ["2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15"],
  ]) {
    assert.deepEqual(select(fixture([last, first, outside]), today).map(item => item.workItem.dueDate), [first, last])
  }
})

test("Upcoming aggregates workspaces and projects while excluding done, archived and unowned tasks", () => {
  const state = fixture(["2026-09-28", "2026-09-28", "2026-09-28", "2026-09-28"])
  state.workItemsById["task-1"].boardId = "task-board-2-done"
  state.workItemsById["task-2"].boardId = "missing"
  state.workItemsById["task-3"].projectId = "6"
  state.workItemsById["task-3"].boardId = "task-board-6-todo"
  const workspaceId = state.workspaceIds.find(id => id !== "project-alpha")
  state.projectsById["6"] = { ...state.projectsById["6"], workspaceId }
  state.projectIdsByWorkspaceId[workspaceId] = ["6"]
  const items = select(state)
  assert.deepEqual(items.map(item => item.workItem.id), ["task-0", "task-3"])
  assert.equal(items[1].workspace.id, workspaceId)
  assert.equal(items[1].project.id, "6")
  assert.strictEqual(items[1].board, state.taskBoardsById["task-board-6-todo"])
  const archived = setProjectArchivedState(state, "6", true)
  assert.deepEqual(select(archived).map(item => item.workItem.id), ["task-0"])
  assert.equal(select(setProjectArchivedState(archived, "6", false)).length, 2)
  assert.deepEqual(select({ ...state, workspaceIds: [] }), [])
})

test("Upcoming sorts by date, priority and stable task ID", () => {
  const state = fixture(["2026-09-29", "2026-09-28", "2026-09-28", "2026-09-28"])
  state.workItemsById["task-1"].priority = "low"
  state.workItemsById["task-2"].priority = "urgent"
  state.workItemsById["task-3"].priority = "urgent"
  assert.deepEqual(select(state).map(item => item.workItem.id), ["task-2", "task-3", "task-1", "task-0"])
})

test("Upcoming caches snapshots and dates separately from Today and advances at midnight", () => {
  const state = fixture(["2026-09-28", "2026-10-05"])
  const items = select(state)
  assert.strictEqual(select(state), items)
  assert.notStrictEqual(select({ ...state }), items)
  assert.deepEqual(selectors.selectTodayWorkItems(state, "2026-09-27"), [])
  assert.deepEqual(select(state, "2026-09-28").map(item => item.workItem.id), ["task-1"])
  assert.deepEqual(selectors.selectTodayWorkItems(state, "2026-09-28").map(item => item.workItem.id), ["task-0"])
  const empty = select(state, "2030-01-01")
  assert.deepEqual(empty, [])
  assert.strictEqual(select(state, "2030-01-01"), empty)
})

test("editing an Upcoming task updates the list while preserving its live dialog record", () => {
  const store = createProjectStore()
  const id = "work-item-2-workspace-filters"
  assert.equal(store.getState().updateWorkItemDateRange(id, null, "2026-09-28"), true)
  const selected = select(store.getState()).find(item => item.workItem.id === id)
  assert.ok(selected)
  const otherTasks = selectors.selectProjectWorkItems(store.getState(), "6")
  assert.equal(store.getState().saveWorkItem(id, {
    ...getEditableWorkItemFields(selected.workItem), dueDate: "2026-10-05", description: "Edited from Upcoming",
  }), true)
  assert.equal(select(store.getState()).some(item => item.workItem.id === id), false)
  const live = selectors.selectProjectResolvedWorkItems(store.getState(), selected.project.id).find(item => item.workItem.id === id)
  assert.equal(live.workItem.description, "Edited from Upcoming")
  assert.deepEqual(selectors.selectProjectWorkItems(store.getState(), "6"), otherTasks)
})
