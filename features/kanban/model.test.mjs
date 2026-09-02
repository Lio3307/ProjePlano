import assert from "node:assert/strict"
import test from "node:test"

import {
  findKanbanCard,
  getKanbanDropDestination,
  moveKanbanCard,
} from "./model.ts"
import { INITIAL_KANBAN_COLUMNS } from "./mock-data.ts"

function createColumns() {
  return [
    {
      id: "backlog",
      title: "Backlog",
      cards: [
        createCard("card-a", "Card A"),
        createCard("card-b", "Card B"),
        createCard("card-c", "Card C"),
      ],
    },
    {
      id: "doing",
      title: "In Progress",
      cards: [createCard("card-d", "Card D")],
    },
    {
      id: "done",
      title: "Done",
      cards: [],
    },
  ]
}

function createCard(id, title) {
  return {
    id,
    title,
    description: title + " description",
    priority: "medium",
    assignee: {
      name: "Test User",
      initials: "TU",
    },
    dueDate: "2026-09-12",
    labels: ["Test"],
    checklist: [
      {
        id: id + "-check",
        label: "Verify " + title,
        completed: false,
      },
    ],
  }
}

test("reorders a card within the same column", () => {
  const columns = createColumns()

  const result = moveKanbanCard(columns, "card-a", {
    columnId: "backlog",
    index: 2,
  })

  assert.deepEqual(
    result[0].cards.map((card) => card.id),
    ["card-b", "card-c", "card-a"]
  )
  assert.deepEqual(
    columns[0].cards.map((card) => card.id),
    ["card-a", "card-b", "card-c"]
  )
})

test("moves a card to a requested position in another column", () => {
  const columns = createColumns()

  const result = moveKanbanCard(columns, "card-b", {
    columnId: "doing",
    index: 1,
  })

  assert.deepEqual(
    result[0].cards.map((card) => card.id),
    ["card-a", "card-c"]
  )
  assert.deepEqual(
    result[1].cards.map((card) => card.id),
    ["card-d", "card-b"]
  )
})

test("moves a card into an empty column", () => {
  const result = moveKanbanCard(createColumns(), "card-c", {
    columnId: "done",
    index: 0,
  })

  assert.deepEqual(
    result[2].cards.map((card) => card.id),
    ["card-c"]
  )
})

test("appends when the destination index is after the final card", () => {
  const result = moveKanbanCard(createColumns(), "card-a", {
    columnId: "doing",
    index: 99,
  })

  assert.deepEqual(
    result[1].cards.map((card) => card.id),
    ["card-d", "card-a"]
  )
})

test("returns the original state for an unknown card or column", () => {
  const columns = createColumns()

  assert.equal(
    moveKanbanCard(columns, "missing-card", {
      columnId: "doing",
      index: 0,
    }),
    columns
  )
  assert.equal(
    moveKanbanCard(columns, "card-a", {
      columnId: "missing-column",
      index: 0,
    }),
    columns
  )
})

test("preserves every card exactly once after a valid move", () => {
  const result = moveKanbanCard(createColumns(), "card-b", {
    columnId: "done",
    index: 0,
  })

  const ids = result
    .flatMap((column) => column.cards.map((card) => card.id))
    .sort()

  assert.deepEqual(ids, ["card-a", "card-b", "card-c", "card-d"])
})

test("resolves card and column drop targets", () => {
  const columns = createColumns()

  assert.deepEqual(getKanbanDropDestination(columns, "doing"), {
    columnId: "doing",
    index: 1,
  })
  assert.deepEqual(getKanbanDropDestination(columns, "card-c"), {
    columnId: "backlog",
    index: 2,
  })
  assert.equal(getKanbanDropDestination(columns, "missing"), null)
})

test("finds a card with its authoritative column title", () => {
  const result = findKanbanCard(createColumns(), "card-d")

  assert.equal(result?.card.title, "Card D")
  assert.equal(result?.columnId, "doing")
  assert.equal(result?.columnTitle, "In Progress")
})

test("provides six columns and an empty drop target", () => {
  assert.equal(INITIAL_KANBAN_COLUMNS.length, 6)
  assert.equal(
    INITIAL_KANBAN_COLUMNS.some((column) => column.cards.length === 0),
    true
  )
})

test("provides the complete approved detail set for every mock card", () => {
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
