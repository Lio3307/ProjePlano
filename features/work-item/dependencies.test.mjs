import assert from "node:assert/strict"
import test from "node:test"

import {
  getBlockingDependencyCounts,
  getBlockingDependencies,
  wouldAcceptDependencySelection,
} from "./dependencies.ts"

function createWorkItem(overrides = {}) {
  return {
    id: "item-a",
    projectId: "project-a",
    boardId: "board-a",
    title: "Build dependency UI",
    description: "Expose the existing dependency model.",
    type: "feature",
    priority: "medium",
    startDate: null,
    dueDate: null,
    estimate: null,
    position: 0,
    labelIds: [],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

test("returns unfinished project blockers across Boards in dependency order", () => {
  const item = createWorkItem({
    dependencyIds: [
      "item-b",
      "item-c",
      "item-foreign",
      "item-other-board",
      "missing",
    ],
  })
  const itemsById = {
    "item-a": item,
    "item-b": createWorkItem({ id: "item-b" }),
    "item-c": createWorkItem({ id: "item-c", boardId: "board-done" }),
    "item-foreign": createWorkItem({
      id: "item-foreign",
      projectId: "project-b",
    }),
    "item-other-board": createWorkItem({
      id: "item-other-board",
      boardId: "board-b",
    }),
  }
  const stagesByBoardId = {
    "board-a": "todo",
    "board-b": "review",
    "board-done": "done",
  }

  assert.deepEqual(
    getBlockingDependencies(item, itemsById, stagesByBoardId).map(
      (dependency) => dependency.id
    ),
    ["item-b", "item-other-board"]
  )
})

test("builds a blocker count for every work item", () => {
  const items = [
    createWorkItem({ id: "item-a", dependencyIds: ["item-b"] }),
    createWorkItem({ id: "item-b" }),
    createWorkItem({ id: "item-c", boardId: "board-done" }),
  ]

  assert.deepEqual(
    getBlockingDependencyCounts(items, {
      "board-a": "review",
      "board-done": "done",
    }),
    {
    "item-a": 1,
    "item-b": 0,
    "item-c": 0,
    }
  )
})

test("accepts valid edit and create dependency selections", () => {
  const itemsById = {
    "item-a": createWorkItem({ id: "item-a" }),
    "item-b": createWorkItem({ id: "item-b" }),
  }

  assert.equal(
    wouldAcceptDependencySelection(
      itemsById,
      "item-a",
      "project-a",
      ["item-b"]
    ),
    true
  )
  assert.equal(
    wouldAcceptDependencySelection(
      itemsById,
      null,
      "project-a",
      ["item-a", "item-b"]
    ),
    true
  )
})

test("rejects invalid dependency references", () => {
  const itemsById = {
    "item-a": createWorkItem({ id: "item-a" }),
    "item-b": createWorkItem({ id: "item-b" }),
    "item-foreign": createWorkItem({
      id: "item-foreign",
      projectId: "project-b",
    }),
    "item-other-board": createWorkItem({
      id: "item-other-board",
      boardId: "board-b",
    }),
  }

  for (const dependencyIds of [
    ["item-a"],
    ["item-b", "item-b"],
    ["missing"],
    ["item-foreign"],
  ]) {
    assert.equal(
      wouldAcceptDependencySelection(
        itemsById,
        "item-a",
        "project-a",
        dependencyIds
      ),
      false
    )
  }
})

test("rejects a dependency selection that creates a cycle", () => {
  const itemsById = {
    "item-a": createWorkItem({ id: "item-a" }),
    "item-b": createWorkItem({
      id: "item-b",
      dependencyIds: ["item-a"],
    }),
  }

  assert.equal(
    wouldAcceptDependencySelection(
      itemsById,
      "item-a",
      "project-a",
      ["item-b"]
    ),
    false
  )
})
