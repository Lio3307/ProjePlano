import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import * as selectors from "./selectors.ts"
import { parseBackup } from "./backup.ts"

const first = "work-item-2-audit-onboarding"
const second = "work-item-2-workspace-filters"

function action(store, name, ...args) {
  assert.equal(typeof store.getState()[name], "function", name + " exists")
  return store.getState()[name](...args)
}

test("agenda filters combine workspace/project/priority without changing order or input", () => {
  const state = createProjectStore().getState()
  const items = selectors.selectSearchWorkItems(state, "", true)
  const target = items.find(item => item.project.id === "2")
  assert.equal(typeof selectors.filterWorkspaceWorkItems, "function")
  const filters = { workspaceId: target.workspace.id, projectId: "2", priority: target.workItem.priority }
  const result = selectors.filterWorkspaceWorkItems(items, filters)
  assert.ok(result.length > 0)
  assert.deepEqual(result, items.filter(item => item.workspace.id === filters.workspaceId && item.project.id === "2" && item.workItem.priority === filters.priority))
  assert.deepEqual(selectors.filterWorkspaceWorkItems(items, { workspaceId: "", projectId: "", priority: "" }), items)
  assert.deepEqual(selectors.filterWorkspaceWorkItems(items, { ...filters, workspaceId: "missing" }), [])
  assert.deepEqual(selectors.filterWorkspaceWorkItems(items, { ...filters, projectId: "missing" }), [])
  assert.strictEqual(selectors.selectSearchWorkItems(state, "", true), items)
})

test("bulk priority updates only selected tasks across projects with one notification", () => {
  const store = createProjectStore()
  const other = selectors.selectProjectResolvedWorkItems(store.getState(), "6").find(item => item.stage !== "done").workItem.id
  const ids = [first, other]
  for (const id of ids) store.getState().updateWorkItem(id, { priority: "low" })
  const before = store.getState()
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(action(store, "updateWorkItemPriorities", [...ids, first], "urgent"), true)
  assert.equal(notifications, 1)
  for (const [id, item] of Object.entries(before.workItemsById)) {
    assert.deepEqual(store.getState().workItemsById[id], ids.includes(id) ? { ...item, priority: "urgent" } : item)
  }
  assert.equal(action(store, "updateWorkItemPriorities", ids, "urgent"), false)
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("bulk priority rejects invalid/empty/missing/completed/archived batches atomically", () => {
  for (const invalid of ["priority", "empty", "missing", "done", "archived"]) {
    const store = createProjectStore()
    if (invalid === "done") store.getState().completeWorkItem(second, "task-board-2-done")
    if (invalid === "archived") store.getState().setProjectArchived("2", true)
    const before = store.getState()
    const ids = invalid === "empty" ? [] : [first, invalid === "missing" ? "missing" : second]
    assert.equal(action(store, "updateWorkItemPriorities", ids, invalid === "priority" ? "invalid" : "urgent"), false, invalid)
    assert.strictEqual(store.getState(), before)
  }
})

test("bulk move appends in selection order, compacts source Boards and preserves task relationships", () => {
  const store = createProjectStore()
  const target = "task-board-2-done"
  const before = store.getState()
  const existing = selectors.selectBoardWorkItems(before, "2", target)
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(action(store, "moveWorkItems", [second, first, second], target), true)
  assert.equal(notifications, 1)
  const after = store.getState()
  assert.deepEqual(selectors.selectBoardWorkItems(after, "2", target).map(item => item.id), [...existing.map(item => item.id), second, first])
  for (const [index, id] of [second, first].entries()) {
    assert.deepEqual(after.workItemsById[id], { ...before.workItemsById[id], boardId: target, position: existing.length + index })
  }
  for (const boardId of new Set([target, before.workItemsById[first].boardId, before.workItemsById[second].boardId])) {
    selectors.selectBoardWorkItems(after, "2", boardId).forEach((item, index) => assert.equal(item.position, index))
  }
  assert.equal(selectors.selectSearchWorkItems(after, "").some(item => item.workItem.id === first), false)
  assert.equal(parseBackup(after.exportBackup()).ok, true)
})

test("bulk move rejects mixed projects, missing targets/tasks, archived and completed sources without partial writes", () => {
  for (const invalid of ["mixed", "target", "missing", "archived", "done", "foreign", "empty"]) {
    const store = createProjectStore()
    const other = selectors.selectProjectResolvedWorkItems(store.getState(), "6").find(item => item.stage !== "done").workItem.id
    if (invalid === "archived") store.getState().setProjectArchived("2", true)
    if (invalid === "done") store.getState().completeWorkItem(second, "task-board-2-done")
    const before = store.getState()
    const ids = invalid === "empty" ? [] : [first, invalid === "mixed" ? other : invalid === "missing" ? "missing" : second]
    const target = invalid === "target" ? "missing" : invalid === "foreign" ? "task-board-4-done" : "task-board-2-done"
    assert.equal(action(store, "moveWorkItems", ids, target), false, invalid)
    assert.strictEqual(store.getState(), before, invalid)
  }
})

test("bulk move leaves selected destination residents in place and rejects all-resident no-ops", () => {
  const store = createProjectStore()
  const target = store.getState().workItemsById[first].boardId
  const resident = store.getState().workItemsById[first]
  assert.notEqual(store.getState().workItemsById[second].boardId, target)
  assert.equal(action(store, "moveWorkItems", [first], target), false)
  assert.equal(action(store, "moveWorkItems", [first, second], target), true)
  assert.deepEqual(store.getState().workItemsById[first], resident)
  assert.equal(action(store, "moveWorkItems", [first, second], target), false)
})

test("filters preserve Today/Upcoming boundaries and search completion rules after priority changes", () => {
  const store = createProjectStore()
  store.getState().updateWorkItemDateRange(first, null, "2026-09-27")
  store.getState().updateWorkItemDateRange(second, null, "2026-09-28")
  const filters = { workspaceId: "", projectId: "2", priority: "urgent" }
  action(store, "updateWorkItemPriorities", [first, second], "urgent")
  const state = store.getState()
  const today = selectors.filterWorkspaceWorkItems(selectors.selectTodayWorkItems(state, "2026-09-27"), filters)
  const upcoming = selectors.filterWorkspaceWorkItems(selectors.selectUpcomingWorkItems(state, "2026-09-27"), filters)
  assert.ok(today.some(item => item.workItem.id === first))
  assert.ok(!today.some(item => item.workItem.id === second))
  assert.ok(upcoming.some(item => item.workItem.id === second))
  assert.ok(!upcoming.some(item => item.workItem.id === first))
  store.getState().completeWorkItem(first, "task-board-2-done")
  assert.ok(!selectors.filterWorkspaceWorkItems(selectors.selectSearchWorkItems(store.getState(), ""), filters).some(item => item.workItem.id === first))
  assert.ok(selectors.filterWorkspaceWorkItems(selectors.selectSearchWorkItems(store.getState(), "", true), filters).some(item => item.workItem.id === first))
})

test("bulk transitions reject broken ownership and references even after a valid first task", () => {
  for (const invalid of ["target", "source", "dependency"]) {
    const store = createProjectStore()
    const state = store.getState()
    const target = state.taskBoardsById["task-board-2-done"]
    const source = state.taskBoardsById[state.workItemsById[second].boardId]
    if (invalid === "dependency") {
      store.setState({ workItemsById: { ...state.workItemsById, [second]: { ...state.workItemsById[second], dependencyIds: ["missing"] } } })
    } else {
      const removed = invalid === "target" ? target : source
      const view = state.projectViewsById[removed.viewId]
      store.setState({ projectViewsById: { ...state.projectViewsById, [view.id]: { ...view, boardIds: view.boardIds.filter(id => id !== removed.id) } } })
    }
    const before = store.getState()
    assert.equal(action(store, "moveWorkItems", [first, second], target.id), false)
    assert.strictEqual(store.getState(), before)
    if (invalid !== "target") {
      assert.equal(action(store, "updateWorkItemPriorities", [first, second], "urgent"), false)
      assert.strictEqual(store.getState(), before)
    }
  }
})

test("bulk moves clear completion Undo only if its task actually moves", () => {
  const store = createProjectStore()
  const originalBoard = store.getState().workItemsById[first].boardId
  store.getState().completeWorkItem(first, "task-board-2-done")
  const completedBoard = store.getState().taskBoardsById["task-board-2-done"]
  assert.equal(store.getState().updateTaskBoard({ boardId: completedBoard.id, title: completedBoard.title, description: completedBoard.description, stage: "todo" }), true)
  const completion = store.getState().lastWorkItemCompletion
  assert.equal(action(store, "moveWorkItems", [second], completedBoard.id), true)
  assert.strictEqual(store.getState().lastWorkItemCompletion, completion)
  assert.equal(action(store, "moveWorkItems", [first, second], originalBoard), true)
  assert.equal(store.getState().lastWorkItemCompletion, null)
})
