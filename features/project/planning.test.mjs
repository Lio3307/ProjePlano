import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { nextRecurringDate, DEFAULT_TASK_VIEW } from "./planning.ts"
import { hasUnexportedChanges } from "./unexported-changes.ts"
import { selectPlanningTasks, getDailyCapacity, planningWeek } from "./planning-selectors.ts"

test("planning actions keep deadlines separate and round-trip through backups", () => {
  const store = createProjectStore()
  const task = Object.values(store.getState().workItemsById)[0]
  assert.equal(store.getState().plan({ type: "schedule", taskId: task.id, date: "2026-09-28", minutes: 90 }), true)
  assert.equal(store.getState().workItemsById[task.id].dueDate, task.dueDate)
  assert.equal(store.getState().plan({ type: "capacity", date: "2026-09-28", minutes: 120 }), true)
  const backup = store.getState().exportBackup()
  const restored = createProjectStore()
  assert.equal(restored.getState().importBackup(backup).ok, true)
  assert.equal(restored.getState().planning.tasks[task.id].date, "2026-09-28")
  assert.equal(restored.getState().planning.capacity["2026-09-28"], 120)
  const before = store.getState()
  assert.equal(store.getState().plan({ type: "schedule", taskId: task.id, date: "2026-02-30", minutes: 90 }), false)
  assert.equal(store.getState(), before)
})

test("recurrence clamps month ends, resets checklist, and does not duplicate after completion Undo", () => {
  const store = createProjectStore()
  const task = Object.values(store.getState().workItemsById).find(task => store.getState().taskBoardsById[task.boardId].stage !== "done")
  const done = Object.values(store.getState().taskBoardsById).find(board => board.projectId === task.projectId && board.stage === "done")
  assert.ok(done)
  store.getState().updateWorkItemDateRange(task.id, "2026-01-29", "2026-01-31")
  const rule = { frequency: "monthly", interval: 1, boardId: task.boardId, anchorDay: 31 }
  assert.equal(nextRecurringDate("2026-01-31", rule), "2026-02-28")
  assert.equal(nextRecurringDate("2026-02-28", rule), "2026-03-31")
  assert.equal(store.getState().plan({ type: "recurrence", taskId: task.id, rule }), true)
  const ids = new Set(Object.keys(store.getState().workItemsById))
  assert.equal(store.getState().completeWorkItem(task.id, done.id), true)
  const created = Object.values(store.getState().workItemsById).filter(item => !ids.has(item.id))
  assert.equal(created.length, 1)
  assert.equal(created[0].dueDate, "2026-02-28")
  assert.equal(created[0].startDate, "2026-02-26")
  assert.deepEqual(created[0].dependencyIds, [])
  assert.ok(created[0].checklist.every(item => !item.completed))
  assert.equal(store.getState().undoCompleteWorkItem(), true)
  store.getState().completeWorkItem(task.id, done.id)
  assert.equal(Object.keys(store.getState().workItemsById).length, ids.size + 1)
  assert.equal(createProjectStore().getState().importBackup(store.getState().exportBackup()).ok, true)
})

test("time logs and schedules survive deletion Undo; active timer is excluded from backups", () => {
  const store = createProjectStore()
  const task = Object.values(store.getState().workItemsById)[0]
  assert.equal(store.getState().startTimer(task.id, "2026-09-28", 1000), true)
  assert.equal(store.getState().startTimer(task.id, "2026-09-28", 2000), false)
  assert.equal(JSON.parse(store.getState().exportBackup()).data.runningTimer, undefined)
  assert.equal(store.getState().stopTimer(62000), true)
  assert.equal(Object.values(store.getState().planning.entries)[0].minutes, 2)
  store.getState().plan({ type: "schedule", taskId: task.id, date: "2026-09-28", minutes: 90 })
  assert.equal(hasUnexportedChanges(store.getState()), true)
  store.getState().deleteWorkItem(task.id)
  assert.deepEqual(store.getState().planning.tasks, {})
  assert.deepEqual(store.getState().planning.entries, {})
  assert.equal(store.getState().undoDeleteWorkItem(), true)
  assert.equal(store.getState().planning.tasks[task.id].minutes, 90)
  assert.equal(Object.values(store.getState().planning.entries)[0].minutes, 2)
  store.getState().resetDemo()
  assert.equal(store.getState().planning, undefined)
  assert.equal(store.getState().runningTimer, null)
})

test("milestone deletion unlinks tasks and deletion history; malformed planning import is atomic", () => {
  const store = createProjectStore()
  const task = Object.values(store.getState().workItemsById)[0]
  const milestone = { id: "test-milestone", projectId: task.projectId, title: "Release", description: "", targetDate: "2026-10-10", status: "planned" }
  assert.equal(store.getState().plan({ type: "milestone", milestone }), true)
  assert.equal(store.getState().updateWorkItem(task.id, { milestoneId: milestone.id }), true)
  store.getState().deleteWorkItem(task.id)
  assert.equal(store.getState().plan({ type: "delete-milestone", id: milestone.id }), true)
  assert.equal(store.getState().undoDeleteWorkItem(), true)
  assert.equal(store.getState().workItemsById[task.id].milestoneId, null)
  store.getState().plan({ type: "capacity", date: "2026-09-28", minutes: 120 })
  const backup = JSON.parse(store.getState().exportBackup())
  backup.data.planning.tasks.missing = { date: null, minutes: 60, recurrence: null, generated: false }
  const before = store.getState()
  assert.equal(store.getState().importBackup(JSON.stringify(backup)).ok, false)
  assert.equal(store.getState(), before)
})

test("templates reset progress and relationships; importing a batch is all or nothing", () => {
  const store = createProjectStore()
  const task = Object.values(store.getState().workItemsById)[0]
  const template = { id: "template", name: "Release", title: "Publish", description: "Notes", type: "chore", priority: "high", estimate: 2, checklist: ["Test", "Ship"] }
  assert.equal(store.getState().plan({ type: "template", template }), true)
  assert.equal(store.getState().plan({ type: "use-template", templateId: template.id, boardId: task.boardId, id: "from-template" }), true)
  const copy = store.getState().workItemsById["from-template"]
  assert.equal(copy.title, "Publish")
  assert.deepEqual(copy.checklist.map(item => item.completed), [false, false])
  assert.deepEqual(copy.dependencyIds, [])
  const before = store.getState()
  assert.equal(store.getState().plan({ type: "import-tasks", tasks: [{ ...copy, id: "valid-import" }, { ...copy, id: "bad-import", dueDate: "bad" }] }), false)
  assert.equal(store.getState(), before)
})

test("planning rejects inherited references without replacing current data", () => {
  const store = createProjectStore()
  store.getState().plan({ type: "capacity", date: "2026-09-28", minutes: 100 })
  const backup = JSON.parse(store.getState().exportBackup())
  for (const modify of [
    data => { data.tasks.toString = { date: null, minutes: 60, recurrence: null, generated: false } },
    data => { data.entries.bad = { id: "bad", taskId: "toString", date: "2026-09-28", minutes: 30, note: "" } },
    data => { data.views.bad = { ...DEFAULT_TASK_VIEW, id: "bad", projectId: "toString" } },
  ]) {
    const malformed = structuredClone(backup)
    modify(malformed.data.planning)
    const before = store.getState()
    assert.equal(store.getState().importBackup(JSON.stringify(malformed)).ok, false)
    assert.equal(store.getState(), before)
  }
  assert.equal(store.getState().startTimer("toString", "2026-09-28"), false)
})

test("saved views combine filters and capacity includes explicit unknown estimates", () => {
  const store = createProjectStore()
  const task = Object.values(store.getState().workItemsById).find(task => store.getState().taskBoardsById[task.boardId].stage !== "done")
  store.getState().plan({ type: "schedule", taskId: task.id, date: "2026-09-28", minutes: null })
  store.getState().plan({ type: "capacity", date: "2026-09-28", minutes: 0 })
  const day = getDailyCapacity(store.getState(), "2026-09-28")
  assert.equal(day.unknown, 1)
  assert.equal(day.minutes, 0)
  assert.equal(day.capacity, 0)
  assert.deepEqual(planningWeek("2026-10-04"), ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"])
  const view = { ...DEFAULT_TASK_VIEW, id: "my-view", name: "Focus", projectId: task.projectId, priority: task.priority, query: task.title }
  assert.equal(store.getState().plan({ type: "view", view }), true)
  assert.ok(selectPlanningTasks(store.getState(), view).some(item => item.id === task.id))
  assert.deepEqual(selectPlanningTasks(store.getState(), { ...view, status: "done" }), [])
  const restored = createProjectStore()
  assert.equal(restored.getState().importBackup(store.getState().exportBackup()).ok, true)
  assert.deepEqual(restored.getState().planning.views[view.id], view)
  store.getState().deleteProject(task.projectId)
  assert.equal(store.getState().planning.views[view.id], undefined)
  assert.equal(store.getState().planning.tasks[task.id], undefined)
})

test("bulk completion creates successors and Undo keeps valid Board order; old backup clears planning", () => {
  const store = createProjectStore()
  const oldBackup = store.getState().exportBackup()
  const task = Object.values(store.getState().workItemsById).find(task => store.getState().taskBoardsById[task.boardId].stage !== "done")
  const done = Object.values(store.getState().taskBoardsById).find(board => board.projectId === task.projectId && board.stage === "done")
  store.getState().updateWorkItemDateRange(task.id, null, "2026-09-28")
  store.getState().plan({ type: "recurrence", taskId: task.id, rule: { frequency: "weekly", interval: 2, boardId: task.boardId, anchorDay: 28 } })
  const count = Object.keys(store.getState().workItemsById).length
  assert.equal(store.getState().moveWorkItems([task.id], done.id), true)
  assert.equal(Object.keys(store.getState().workItemsById).length, count + 1)
  assert.equal(store.getState().undoBulkWorkItemChange(), true)
  assert.equal(createProjectStore().getState().importBackup(store.getState().exportBackup()).ok, true)
  assert.equal(store.getState().importBackup(oldBackup).ok, true)
  assert.equal(store.getState().planning, undefined)
  assert.equal(Object.keys(store.getState().workItemsById).length, count)
})
