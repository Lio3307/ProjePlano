import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { parseBackup } from "./backup.ts"
import { selectTodayWorkItems, selectUpcomingWorkItems, selectProjectResolvedWorkItems } from "./selectors.ts"
import { createWorkItemFormValue, createDuplicateWorkItemFormValue } from "../work-item/form.ts"

const first = "work-item-2-audit-onboarding"
const second = "work-item-2-workspace-filters"

function reschedule(store, ids, dueDate) {
  assert.equal(typeof store.getState().updateWorkItemDueDates, "function", "bulk date action exists")
  return store.getState().updateWorkItemDueDates(ids, dueDate)
}

test("bulk deadlines publish once, preserve task fields and update both agendas", () => {
  const store = createProjectStore()
  for (const id of [first, second]) assert.equal(store.getState().updateWorkItemDateRange(id, "2026-09-01", "2026-09-27"), true)
  const before = store.getState()
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(reschedule(store, [first, second, first], "2026-09-30"), true)
  assert.equal(notifications, 1)
  for (const id of [first, second]) {
    assert.deepEqual(store.getState().workItemsById[id], { ...before.workItemsById[id], dueDate: "2026-09-30" })
    assert.equal(selectTodayWorkItems(store.getState(), "2026-09-27").some(item => item.workItem.id === id), false)
    assert.equal(selectUpcomingWorkItems(store.getState(), "2026-09-27").some(item => item.workItem.id === id), true)
  }
  assert.equal(parseBackup(store.getState().exportBackup()).ok, true)
})

test("bulk deadlines reject the whole batch on invalid dates, missing/finished/archived tasks or start-date conflicts", () => {
  for (const invalid of ["date", "missing", "done", "archived", "start"]) {
    const store = createProjectStore()
    assert.equal(store.getState().updateWorkItemDateRange(first, null, "2026-09-27"), true)
    assert.equal(store.getState().updateWorkItemDateRange(second, null, "2026-09-27"), true)
    if (invalid === "done") assert.equal(store.getState().completeWorkItem(second, "task-board-2-done"), true)
    if (invalid === "archived") assert.equal(store.getState().setProjectArchived("2", true), true)
    if (invalid === "start") assert.equal(store.getState().updateWorkItemDateRange(second, "2026-10-01", "2026-10-02"), true)
    const before = store.getState()
    assert.equal(reschedule(store, [first, invalid === "missing" ? "missing" : second], invalid === "date" ? "2026-02-30" : "2026-09-30"), false, invalid)
    assert.strictEqual(store.getState(), before, invalid)
  }
})

test("bulk deadlines support mixed unchanged records and reject empty/no-op selections", () => {
  const store = createProjectStore()
  for (const id of [first, second]) assert.equal(store.getState().updateWorkItemDateRange(id, null, "2026-09-27"), true)
  assert.equal(reschedule(store, [], "2026-09-30"), false)
  assert.equal(reschedule(store, [first, second], "2026-09-27"), false)
  assert.equal(store.getState().updateWorkItemDateRange(first, null, "2026-09-30"), true)
  assert.equal(reschedule(store, [first, second], "2026-09-30"), true)
})

test("bulk deadlines update only selected tasks across projects", () => {
  const store = createProjectStore()
  const other = selectProjectResolvedWorkItems(store.getState(), "6").find(item => item.board.stage !== "done").workItem
  for (const id of [first, other.id]) assert.equal(store.getState().updateWorkItemDateRange(id, null, "2026-09-27"), true)
  const before = store.getState()
  assert.equal(reschedule(store, [first, other.id], "2026-10-01"), true)
  for (const [id, item] of Object.entries(before.workItemsById)) {
    assert.deepEqual(store.getState().workItemsById[id], [first, other.id].includes(id) ? { ...item, dueDate: "2026-10-01" } : item)
  }
})

test("quick create may prefill a deadline without changing saved-task or duplicate dates", () => {
  assert.equal(createWorkItemFormValue(null, "2026-09-27").dueDate, "2026-09-27")
  assert.equal(createWorkItemFormValue(null).dueDate, "")
  const workItem = createProjectStore().getState().workItemsById[first]
  assert.equal(createWorkItemFormValue(workItem, "2040-01-01").dueDate, workItem.dueDate ?? "")
  assert.equal(createDuplicateWorkItemFormValue(workItem).dueDate, "")
})
