import assert from "node:assert/strict"
import test from "node:test"

import { createProjectStore } from "./store.ts"
import { parseBackup } from "./backup.ts"
import { selectTodayWorkItems, selectUpcomingWorkItems, selectProjectResolvedWorkItems } from "./selectors.ts"
import { buildProjectOverviewSummary } from "./overview.ts"

const taskId = "work-item-2-audit-onboarding"
const otherId = "work-item-2-workspace-filters"
const doneId = "task-board-2-done"

function complete(store, id = taskId, boardId = doneId) {
  assert.equal(typeof store.getState().completeWorkItem, "function", "completion action exists")
  return store.getState().completeWorkItem(id, boardId)
}

test("completion moves to the chosen done Board, updates agendas and project progress, and Undo restores order", () => {
  for (const [dueDate, select] of [["2026-09-27", selectTodayWorkItems], ["2026-09-28", selectUpcomingWorkItems]]) {
    const store = createProjectStore()
    assert.equal(store.getState().updateWorkItemDateRange(taskId, null, dueDate), true)
    const before = store.getState()
    const summary = state => buildProjectOverviewSummary({ today: "2026-09-27", workItems: selectProjectResolvedWorkItems(state, "2"), milestones: [], resources: [] })
    const completedBefore = summary(before).completedWorkItems
    assert.equal(select(before, "2026-09-27").some(item => item.workItem.id === taskId), true)
    let notifications = 0
    store.subscribe(() => notifications++)
    assert.equal(complete(store), true)
    assert.equal(notifications, 1)
    assert.equal(store.getState().workItemsById[taskId].boardId, doneId)
    assert.equal(select(store.getState(), "2026-09-27").some(item => item.workItem.id === taskId), false)
    assert.equal(summary(store.getState()).completedWorkItems, completedBefore + 1)
    assert.equal(store.getState().undoCompleteWorkItem(), true)
    assert.equal(notifications, 2)
    assert.deepEqual(store.getState().workItemsById, before.workItemsById)
    assert.equal(store.getState().lastWorkItemCompletion, null)
    assert.equal(store.getState().undoCompleteWorkItem(), false)
    assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
  }
})

test("completion validates the chosen Board and rejects missing, unfinished, foreign, archived or already-done targets", () => {
  const store = createProjectStore()
  for (const target of ["missing", "task-board-2-todo", "task-board-4-done"]) {
    const before = store.getState()
    assert.equal(complete(store, taskId, target), false)
    assert.strictEqual(store.getState(), before)
  }
  assert.equal(complete(store, "missing"), false)
  assert.equal(store.getState().addTaskBoard({ id: "second-done", projectId: "2", viewId: "view-2-board", title: "Released", description: "", stage: "done" }), true)
  assert.equal(complete(store, taskId, "second-done"), true)
  assert.equal(store.getState().workItemsById[taskId].boardId, "second-done")
  assert.equal(complete(store, taskId), false)
  assert.equal(store.getState().setProjectArchived("2", true), true)
  assert.equal(complete(store, otherId), false)
})

test("Undo preserves subsequent task edits and other tasks, and only the latest completion is undoable", () => {
  const store = createProjectStore()
  assert.equal(complete(store), true)
  assert.equal(complete(store, otherId), true)
  const pending = store.getState().lastWorkItemCompletion
  assert.equal(complete(store, "missing"), false)
  assert.strictEqual(store.getState().lastWorkItemCompletion, pending)
  assert.equal(store.getState().updateWorkItem(otherId, { title: "Edited after completion" }), true)
  assert.equal(store.getState().undoCompleteWorkItem(), true)
  assert.equal(store.getState().workItemsById[otherId].title, "Edited after completion")
  assert.equal(store.getState().workItemsById[otherId].boardId, "task-board-2-todo")
  assert.equal(store.getState().workItemsById[taskId].boardId, doneId)
})

test("Undo refuses changed Board stages without modifying records", () => {
  for (const changed of ["source", "target"]) {
    const store = createProjectStore()
    const boardId = changed === "source" ? store.getState().workItemsById[taskId].boardId : doneId
    assert.equal(complete(store), true)
    const board = store.getState().taskBoardsById[boardId]
    assert.equal(store.getState().updateTaskBoard({ boardId, title: board.title, description: board.description, stage: changed === "target" ? "todo" : "done" }), true)
    const before = store.getState()
    assert.equal(store.getState().undoCompleteWorkItem(), false)
    assert.strictEqual(store.getState(), before)
  }
})

test("completion history is session-only and cleared by import, reset, owner deletion, task deletion or a later move", () => {
  for (const clear of ["import", "reset", "project", "workspace", "task", "move"]) {
    const store = createProjectStore()
    assert.equal(complete(store), true)
    const backup = store.getState().exportBackup()
    assert.equal("lastWorkItemCompletion" in JSON.parse(backup).data, false)
    const pending = store.getState().lastWorkItemCompletion
    assert.equal(store.getState().importBackup("invalid").ok, false)
    assert.strictEqual(store.getState().lastWorkItemCompletion, pending)
    if (clear === "import") assert.equal(store.getState().importBackup(backup).ok, true)
    if (clear === "reset") store.getState().resetDemo()
    if (clear === "project") assert.equal(store.getState().deleteProject("2"), true)
    if (clear === "workspace") assert.equal(store.getState().deleteWorkspace("project-alpha"), true)
    if (clear === "task") assert.equal(store.getState().deleteWorkItem(taskId), true)
    if (clear === "move") assert.equal(store.getState().moveWorkItem(taskId, "task-board-2-todo", 0), true)
    assert.equal(store.getState().lastWorkItemCompletion, null, clear)
    assert.equal(store.getState().undoCompleteWorkItem(), false, clear)
  }
})
