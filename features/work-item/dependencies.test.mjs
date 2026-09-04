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
    title: "Build dependency UI",
    description: "Expose the existing dependency model.",
    type: "feature",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    startDate: null,
    dueDate: null,
    estimate: null,
    position: 0,
    labels: [],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

test("returns only unfinished project-local blockers in dependency order", () => {
  const item = createWorkItem({
    dependencyIds: ["item-b", "item-c", "item-foreign", "missing"],
  })
  const itemsById = {
    "item-a": item,
    "item-b": createWorkItem({ id: "item-b", status: "review" }),
    "item-c": createWorkItem({ id: "item-c", status: "done" }),
    "item-foreign": createWorkItem({
      id: "item-foreign",
      projectId: "project-b",
    }),
  }

  assert.deepEqual(
    getBlockingDependencies(item, itemsById).map(
      (dependency) => dependency.id
    ),
    ["item-b"]
  )
})

test("builds a blocker count for every work item", () => {
  const items = [
    createWorkItem({ id: "item-a", dependencyIds: ["item-b"] }),
    createWorkItem({ id: "item-b", status: "review" }),
    createWorkItem({ id: "item-c", status: "done" }),
  ]

  assert.deepEqual(getBlockingDependencyCounts(items), {
    "item-a": 1,
    "item-b": 0,
    "item-c": 0,
  })
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
