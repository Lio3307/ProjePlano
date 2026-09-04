import assert from "node:assert/strict"
import test from "node:test"

import {
  buildKanbanBoards,
  getKanbanBoardDropId,
  getKanbanDropDestination,
  getKanbanWorkItemDragId,
  parseKanbanWorkItemDragId,
} from "./model.ts"
import { INITIAL_KANBAN_COLUMNS } from "./mock-data.ts"

function createTaskBoard(id, stage, position) {
  return {
    id,
    projectId: "project-a",
    viewId: "view-project-a-board",
    title: id,
    description: "",
    stage,
    position,
  }
}

function createWorkItem(id, boardId, position) {
  return {
    id,
    projectId: "project-a",
    boardId,
    title: "Task " + id,
    description: "Description " + id,
    type: "feature",
    priority: "medium",
    assigneeId: null,
    startDate: null,
    dueDate: null,
    estimate: null,
    position,
    labelIds: [],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
  }
}

test("builds only the Boards supplied by the owning view", () => {
  const todo = createTaskBoard("board-todo", "todo", 0)
  const boards = buildKanbanBoards(
    [todo],
    [createWorkItem("todo-a", todo.id, 0)]
  )

  assert.deepEqual(boards.map((record) => record.board.id), [todo.id])
  assert.deepEqual(boards[0].workItems.map((item) => item.id), ["todo-a"])
})

test("sorts each Board by position and stable ID", () => {
  const todo = createTaskBoard("board-todo", "todo", 0)
  const boards = buildKanbanBoards(
    [todo],
    [
      createWorkItem("b", todo.id, 0),
      createWorkItem("a", todo.id, 0),
      createWorkItem("c", todo.id, 1),
    ]
  )

  assert.deepEqual(
    boards[0].workItems.map((item) => item.id),
    ["a", "b", "c"]
  )
})

test("creates and parses an unambiguous Board work-item drag ID", () => {
  assert.equal(getKanbanWorkItemDragId("todo-a"), "kanban-item:todo-a")
  assert.equal(parseKanbanWorkItemDragId("kanban-item:todo-a"), "todo-a")
  assert.equal(parseKanbanWorkItemDragId("kanban-board:board-todo"), null)
  assert.equal(parseKanbanWorkItemDragId("kanban-item:"), null)
})

test("resolves a Board drop target to its end", () => {
  const todo = createTaskBoard("board-todo", "todo", 0)
  const boards = buildKanbanBoards(
    [todo],
    [
      createWorkItem("todo-a", todo.id, 0),
      createWorkItem("todo-b", todo.id, 1),
    ]
  )

  assert.deepEqual(
    getKanbanDropDestination(boards, getKanbanBoardDropId(todo.id)),
    { boardId: todo.id, index: 2 }
  )
})

test("resolves a work-item drop target to its current Board index", () => {
  const todo = createTaskBoard("board-todo", "todo", 0)
  const boards = buildKanbanBoards(
    [todo],
    [
      createWorkItem("todo-a", todo.id, 0),
      createWorkItem("todo-b", todo.id, 1),
    ]
  )

  assert.deepEqual(
    getKanbanDropDestination(
      boards,
      getKanbanWorkItemDragId("todo-b")
    ),
    { boardId: todo.id, index: 1 }
  )
  assert.equal(getKanbanDropDestination(boards, "missing"), null)
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
    assert.ok(card.assigneeId)
    assert.match(card.dueDate, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(card.labels.length > 0)
    assert.ok(card.checklist.length > 0)
  }
})
