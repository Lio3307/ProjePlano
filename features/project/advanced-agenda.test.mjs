import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import * as selectors from "./selectors.ts"
import { parseBackup } from "./backup.ts"

const first = "work-item-2-audit-onboarding"
const second = "work-item-2-workspace-filters"
const filters = { workspaceId: "", projectId: "", priority: "", undatedOnly: false, blockedOnly: false }

function undo(store) {
  assert.equal(typeof store.getState().undoBulkWorkItemChange, "function")
  return store.getState().undoBulkWorkItemChange()
}

test("bulk deadline Undo restores null dates and preserves later title/priority edits", () => {
  const store = createProjectStore()
  for (const id of [first, second]) store.getState().updateWorkItemDateRange(id, null, null)
  store.getState().updateWorkItemDueDates([first, second], "2026-10-01")
  store.getState().updateWorkItem(first, { title: "Keep my edit", priority: "urgent" })
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(undo(store), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().workItemsById[first].title, "Keep my edit")
  assert.equal(store.getState().workItemsById[first].priority, "urgent")
  for (const id of [first, second]) assert.equal(store.getState().workItemsById[id].dueDate, null)
  assert.equal(undo(store), false)
})

test("Undo rejects later edits to the same field or an invalid restored date atomically", () => {
  for (const conflict of ["dueDate", "startDate", "priority"]) {
    const store = createProjectStore()
    if (conflict === "priority") {
      for (const id of [first, second]) store.getState().updateWorkItem(id, { priority: "low" })
      store.getState().updateWorkItemPriorities([first, second], "high")
      store.getState().updateWorkItem(second, { priority: "urgent" })
    } else {
      for (const id of [first, second]) store.getState().updateWorkItemDateRange(id, null, "2026-09-01")
      store.getState().updateWorkItemDueDates([first, second], "2026-10-01")
      store.getState().updateWorkItemDateRange(second, conflict === "startDate" ? "2026-09-20" : null, conflict === "dueDate" ? "2026-10-02" : "2026-10-01")
    }
    const before = store.getState()
    assert.equal(undo(store), false, conflict)
    assert.strictEqual(store.getState(), before)
  }
})

test("Undo moves restores original Board positions and keeps later descriptions", () => {
  const store = createProjectStore()
  const before = store.getState()
  assert.equal(store.getState().moveWorkItems([second, first], "task-board-2-done"), true)
  store.getState().updateWorkItem(first, { description: "Keep this" })
  assert.equal(undo(store), true)
  for (const id of [first, second]) {
    const actual = store.getState().workItemsById[id]
    assert.equal(actual.boardId, before.workItemsById[id].boardId)
    assert.equal(actual.position, before.workItemsById[id].position)
  }
  assert.equal(store.getState().workItemsById[first].description, "Keep this")
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("latest successful bulk operation replaces Undo; no-op retains it; reset/import clear it", () => {
  const store = createProjectStore()
  store.getState().updateWorkItem(first, { priority: "low" })
  store.getState().updateWorkItemDueDates([first], "2030-01-01")
  store.getState().updateWorkItemPriorities([first], "urgent")
  const history = store.getState().lastBulkWorkItemChange
  assert.ok(history)
  assert.equal(store.getState().updateWorkItemPriorities([first], "urgent"), false)
  assert.strictEqual(store.getState().lastBulkWorkItemChange, history)
  assert.equal(undo(store), true)
  assert.equal(store.getState().workItemsById[first].priority, "low")
  assert.equal(store.getState().workItemsById[first].dueDate, "2030-01-01")
  store.getState().updateWorkItemPriorities([first], "urgent")
  const backup = store.getState().exportBackup()
  assert.ok(!backup.includes("lastBulkWorkItemChange"))
  assert.equal(store.getState().importBackup(backup).ok, true)
  assert.equal(store.getState().lastBulkWorkItemChange, null)
  store.getState().updateWorkItemPriorities([first], "low")
  store.getState().resetDemo()
  assert.equal(store.getState().lastBulkWorkItemChange, null)
})

test("Undo history clears when an affected task or its project/workspace is deleted", () => {
  for (const kind of ["task", "project", "workspace"]) {
    const store = createProjectStore()
    store.getState().updateWorkItemDueDates([first], "2030-01-01")
    const workspaceId = store.getState().projectsById["2"].workspaceId
    if (kind === "task") store.getState().deleteWorkItem(first)
    if (kind === "project") store.getState().deleteProject("2")
    if (kind === "workspace") store.getState().deleteWorkspace(workspaceId)
    assert.equal(store.getState().lastBulkWorkItemChange, null)
  }
})

test("undated and blocker filters compose; hidden dependencies are still counted", () => {
  const store = createProjectStore()
  assert.equal(store.getState().updateWorkItem(second, { dependencyIds: [] }), true)
  assert.equal(store.getState().updateWorkItem(first, { dependencyIds: [second], title: "Unique blocked task" }), true)
  store.getState().updateWorkItemDateRange(first, null, null)
  assert.equal(typeof selectors.selectWorkspaceBlockingCounts, "function")
  const state = store.getState()
  const counts = selectors.selectWorkspaceBlockingCounts(state)
  assert.strictEqual(selectors.selectWorkspaceBlockingCounts(state), counts)
  assert.equal(counts[first], 1)
  const search = selectors.selectSearchWorkItems(state, "Unique blocked task")
  assert.deepEqual(selectors.filterWorkspaceWorkItems(search, { ...filters, undatedOnly: true, blockedOnly: true }, counts).map(item => item.workItem.id), [first])
  store.getState().completeWorkItem(second, "task-board-2-done")
  assert.equal(selectors.selectWorkspaceBlockingCounts(store.getState())[first], 0)
  assert.deepEqual(selectors.filterWorkspaceWorkItems(search, { ...filters, blockedOnly: true }, selectors.selectWorkspaceBlockingCounts(store.getState())), [])
  store.getState().updateWorkItemDateRange(first, null, "2030-01-01")
  assert.deepEqual(selectors.filterWorkspaceWorkItems(selectors.selectSearchWorkItems(store.getState(), "Unique blocked task"), { ...filters, undatedOnly: true }, {}), [])
})

test("search sorts by title, earliest deadline with undated last, or highest priority without mutating cached results", () => {
  const store = createProjectStore()
  store.getState().updateWorkItem(first, { title: "Zebra", priority: "urgent" })
  store.getState().updateWorkItem(second, { title: "Apple", priority: "low" })
  store.getState().updateWorkItemDateRange(first, null, "2030-01-01")
  store.getState().updateWorkItemDateRange(second, null, null)
  const records = selectors.selectSearchWorkItems(store.getState(), "").filter(item => [first, second].includes(item.workItem.id))
  const original = [...records]
  assert.equal(typeof selectors.sortSearchWorkItems, "function")
  assert.deepEqual(selectors.sortSearchWorkItems(records, "title").map(item => item.workItem.id), [second, first])
  for (const order of ["deadline", "priority"]) assert.deepEqual(selectors.sortSearchWorkItems(records, order).map(item => item.workItem.id), [first, second])
  assert.deepEqual(records, original)
})

test("bulk labels add/remove a same-project label atomically and support Undo", () => {
  const store = createProjectStore()
  const board = store.getState().taskBoardsById[store.getState().workItemsById[first].boardId]
  const label = store.getState().projectViewsById[board.viewId].labels[0].id
  for (const id of [first, second]) store.getState().updateWorkItem(id, { labelIds: [] })
  assert.equal(typeof store.getState().updateWorkItemLabels, "function")
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(store.getState().updateWorkItemLabels([first, second, first], label, "add"), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().updateWorkItemLabels([first, second], label, "add"), false)
  for (const id of [first, second]) assert.deepEqual(store.getState().workItemsById[id].labelIds, [label])
  assert.equal(undo(store), true)
  for (const id of [first, second]) assert.deepEqual(store.getState().workItemsById[id].labelIds, [])
  store.getState().updateWorkItemLabels([first, second], label, "add")
  assert.equal(store.getState().updateWorkItemLabels([first, second], label, "remove"), true)
  assert.equal(undo(store), true)
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("bulk labels reject foreign/missing labels, mixed projects, missing and completed tasks", () => {
  for (const invalid of ["label", "mixed", "missing", "done", "operation", "empty"]) {
    const store = createProjectStore()
    const state = store.getState()
    const board = state.taskBoardsById[state.workItemsById[first].boardId]
    const label = state.projectViewsById[board.viewId].labels[0].id
    const other = selectors.selectProjectResolvedWorkItems(state, "6").find(item => item.stage !== "done").workItem.id
    if (invalid === "done") state.completeWorkItem(second, "task-board-2-done")
    const before = store.getState()
    assert.equal(typeof before.updateWorkItemLabels, "function")
    assert.equal(before.updateWorkItemLabels(invalid === "empty" ? [] : [first, invalid === "mixed" ? other : invalid === "missing" ? "missing" : second], invalid === "label" ? "foreign" : label, invalid === "operation" ? "replace" : "add"), false, invalid)
    assert.strictEqual(store.getState(), before)
  }
})

test("move Undo restores multiple tasks from one Board in original order without losing newly added tasks", () => {
  const store = createProjectStore()
  const original = store.getState().workItemsById[first]
  const sibling = { ...original, id: "undo-sibling", position: original.position + 1, dependencyIds: [] }
  assert.equal(store.getState().createWorkItem(sibling), true)
  const beforeIds = selectors.selectBoardWorkItems(store.getState(), "2", original.boardId).map(item => item.id)
  assert.equal(store.getState().moveWorkItems([sibling.id, first], "task-board-2-done"), true)
  assert.equal(store.getState().createWorkItem({ ...original, id: "new-after-move", position: 999, dependencyIds: [] }), true)
  assert.equal(undo(store), true)
  assert.deepEqual(selectors.selectBoardWorkItems(store.getState(), "2", original.boardId).map(item => item.id), [...beforeIds, "new-after-move"])
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("move Undo rejects later Board moves or stage changes and retains the whole current snapshot", () => {
  for (const conflict of ["board", "stage", "archived"]) {
    const store = createProjectStore()
    const sourceId = store.getState().workItemsById[first].boardId
    store.getState().moveWorkItems([first, second], "task-board-2-done")
    if (conflict === "board") store.getState().moveWorkItem(second, sourceId, 0)
    if (conflict === "stage") {
      const board = store.getState().taskBoardsById[sourceId]
      store.getState().updateTaskBoard({ boardId: sourceId, title: board.title, description: board.description, stage: "done" })
    }
    if (conflict === "archived") store.getState().setProjectArchived("2", true)
    const before = store.getState()
    assert.equal(undo(store), false)
    assert.strictEqual(store.getState(), before)
  }
})

test("label Undo preserves later titles but rejects later label edits without changing other tasks", () => {
  const store = createProjectStore()
  const board = store.getState().taskBoardsById[store.getState().workItemsById[first].boardId]
  const labels = store.getState().projectViewsById[board.viewId].labels
  assert.ok(labels.length > 1)
  for (const id of [first, second]) store.getState().updateWorkItem(id, { labelIds: [] })
  store.getState().updateWorkItemLabels([first, second], labels[0].id, "add")
  store.getState().updateWorkItem(first, { title: "Keep title" })
  assert.equal(undo(store), true)
  assert.equal(store.getState().workItemsById[first].title, "Keep title")
  store.getState().updateWorkItemLabels([first, second], labels[0].id, "add")
  store.getState().updateWorkItem(second, { labelIds: [labels[0].id, labels[1].id] })
  const before = store.getState()
  assert.equal(undo(store), false)
  assert.strictEqual(store.getState(), before)
})
