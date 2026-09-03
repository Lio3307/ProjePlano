import assert from "node:assert/strict"
import test from "node:test"

import {
  buildKanbanColumns,
  getKanbanColumnDropId,
  getKanbanDropDestination,
  getKanbanWorkItemDragId,
  parseKanbanWorkItemDragId,
} from "./model.ts"
import { INITIAL_KANBAN_COLUMNS } from "./mock-data.ts"

function createWorkItem(id, status, position) {
  return {
    id,
    projectId: "project-a",
    title: "Task " + id,
    description: "Description " + id,
    type: "feature",
    status,
    priority: "medium",
    assignee: null,
    startDate: null,
    dueDate: null,
    estimate: null,
    position,
    labels: [],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
  }
}

test("builds all six work-item status columns", () => {
  const columns = buildKanbanColumns([
    createWorkItem("todo-a", "todo", 0),
    createWorkItem("done-a", "done", 0),
  ])

  assert.deepEqual(
    columns.map((column) => column.status),
    ["backlog", "todo", "in-progress", "review", "testing", "done"]
  )
  assert.deepEqual(columns[4].workItems, [])
})

test("sorts each Board status by position and stable ID", () => {
  const columns = buildKanbanColumns([
    createWorkItem("b", "todo", 0),
    createWorkItem("a", "todo", 0),
    createWorkItem("c", "todo", 1),
  ])

  assert.deepEqual(
    columns[1].workItems.map((item) => item.id),
    ["a", "b", "c"]
  )
})

test("creates and parses an unambiguous Board work-item drag ID", () => {
  assert.equal(getKanbanWorkItemDragId("todo-a"), "kanban-item:todo-a")
  assert.equal(parseKanbanWorkItemDragId("kanban-item:todo-a"), "todo-a")
  assert.equal(parseKanbanWorkItemDragId("kanban-column:todo"), null)
  assert.equal(parseKanbanWorkItemDragId("kanban-item:"), null)
})

test("resolves a column drop target to its end", () => {
  const columns = buildKanbanColumns([
    createWorkItem("todo-a", "todo", 0),
    createWorkItem("todo-b", "todo", 1),
  ])

  assert.deepEqual(
    getKanbanDropDestination(columns, getKanbanColumnDropId("todo")),
    { status: "todo", index: 2 }
  )
})

test("resolves a work-item drop target to its current index", () => {
  const columns = buildKanbanColumns([
    createWorkItem("todo-a", "todo", 0),
    createWorkItem("todo-b", "todo", 1),
  ])

  assert.deepEqual(
    getKanbanDropDestination(
      columns,
      getKanbanWorkItemDragId("todo-b")
    ),
    { status: "todo", index: 1 }
  )
  assert.equal(getKanbanDropDestination(columns, "missing"), null)
})

test("provides six seed columns and an empty drop target", () => {
  assert.equal(INITIAL_KANBAN_COLUMNS.length, 6)
  assert.equal(
    INITIAL_KANBAN_COLUMNS.some((column) => column.cards.length === 0),
    true
  )
})

test("provides complete seed details for every card", () => {
  for (const card of INITIAL_KANBAN_COLUMNS.flatMap(
    (column) => column.cards
  )) {
    assert.ok(card.title)
    assert.ok(card.description)
    assert.ok(card.assignee.name)
    assert.ok(card.assignee.initials)
    assert.match(card.dueDate, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(card.labels.length > 0)
    assert.ok(card.checklist.length > 0)
  }
})
