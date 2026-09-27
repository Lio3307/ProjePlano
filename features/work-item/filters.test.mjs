import assert from "node:assert/strict"
import test from "node:test"
import { createWorkItemFilters, filterWorkItems } from "./filters.ts"

const stages = { planning: "todo", delivered: "done", development: "in-progress" }
const base = {
  projectId: "project", description: "A searchable description should not match",
  type: "feature", startDate: null, dueDate: null, estimate: null, position: 0,
  checklist: [], milestoneId: null, dependencyIds: [], linkedResourceIds: [], customFields: {},
}
const tasks = [
  { ...base, id: "one", title: "Build LOGIN screen", boardId: "planning", priority: "high", labelIds: ["frontend", "release"] },
  { ...base, id: "two", title: "Review login flow", boardId: "delivered", priority: "low", labelIds: ["frontend"] },
  { ...base, id: "three", title: "Ship API", boardId: "development", priority: "urgent", labelIds: ["backend"] },
  { ...base, id: "four", title: "Write docs", boardId: "planning", priority: "medium", labelIds: [] },
]
const filter = (patch = {}, lookup = stages) =>
  filterWorkItems(tasks, lookup, { ...createWorkItemFilters(), ...patch })
const ids = items => items.map(item => item.id)

test("empty filters return every task in order without cloning or mutating records", () => {
  const before = structuredClone(tasks)
  const result = filter()
  assert.deepEqual(result, before)
  for (const [index, task] of result.entries()) assert.equal(task, tasks[index])
  assert.deepEqual(tasks, before)
  const defaults = createWorkItemFilters()
  defaults.query = "changed"
  assert.equal(createWorkItemFilters().query, "")
  assert.deepEqual(ids(filter({ query: "   " })), ids(tasks))
})

test("title search trims input and ignores case, but excludes descriptions", () => {
  assert.deepEqual(ids(filter({ query: "  LOGIN  " })), ["one", "two"])
  assert.deepEqual(ids(filter({ query: "searchable description" })), [])
  assert.deepEqual(ids(filter({ query: "[.*]" })), [])
})

test("categorical filters match label IDs, priority and Board-derived status", () => {
  assert.deepEqual(ids(filter({ labelId: "release" })), ["one"])
  assert.deepEqual(ids(filter({ labelId: "frontend" })), ["one", "two"])
  assert.deepEqual(ids(filter({ priority: "urgent" })), ["three"])
  assert.deepEqual(ids(filter({ status: "done" })), ["two"])
  assert.deepEqual(ids(filter({ status: "todo" })), ["one", "four"])
  assert.deepEqual(ids(filter({ labelId: "deleted" })), [])
})

test("all selected criteria combine with AND and clearing restores results", () => {
  const selected = { query: "login", labelId: "frontend", priority: "high", status: "todo" }
  assert.deepEqual(ids(filter(selected)), ["one"])
  assert.deepEqual(ids(filter({ ...selected, status: "done" })), [])
  assert.deepEqual(ids(filter(createWorkItemFilters())), ids(tasks))
})

test("status filtering responds to Board completion and never guesses a missing stage", () => {
  assert.deepEqual(ids(filter({ status: "done" }, { ...stages, planning: "done" })), ["one", "two", "four"])
  assert.deepEqual(ids(filter({ status: "todo" }, {})), [])
  assert.equal(filter({}, {}).length, tasks.length)
})
