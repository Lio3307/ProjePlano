import assert from "node:assert/strict"
import test from "node:test"

import {
  isValidWorkItem,
  isValidWorkItemDate,
  isValidWorkItemDateRange,
  wouldCreateDependencyCycle,
} from "./model.ts"

function createWorkItem(overrides = {}) {
  return {
    id: "item-a",
    projectId: "project-a",
    boardId: "board-a",
    title: "Build project shell",
    description: "Create the shared project composition boundary.",
    type: "feature",
    priority: "medium",
    assigneeId: "member-project-alpha-maya-chen",
    startDate: "2026-09-02",
    dueDate: "2026-09-08",
    estimate: 3,
    position: 0,
    labelIds: ["label-frontend"],
    checklist: [
      {
        id: "item-a-check",
        label: "Verify the contract",
        completed: false,
      },
    ],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

test("validates real date-only values without timezone conversion", () => {
  assert.equal(isValidWorkItemDate("2024-02-29"), true)
  assert.equal(isValidWorkItemDate("2026-02-29"), false)
  assert.equal(isValidWorkItemDate("2026-13-01"), false)
  assert.equal(isValidWorkItemDate("not-a-date"), false)

  assert.equal(
    isValidWorkItemDateRange("2026-09-02", "2026-09-08"),
    true
  )
  assert.equal(isValidWorkItemDateRange(null, "2026-09-08"), true)
  assert.equal(
    isValidWorkItemDateRange("2026-09-09", "2026-09-08"),
    false
  )
})

test("accepts a complete shared work item", () => {
  const item = createWorkItem()

  assert.equal(isValidWorkItem(item), true)
  assert.equal("status" in item, false)
  assert.equal(
    isValidWorkItem(createWorkItem({ assigneeId: null, estimate: null })),
    true
  )
})

test("rejects invalid identity, scheduling, estimate, and position fields", () => {
  assert.equal(isValidWorkItem(createWorkItem({ title: " " })), false)
  assert.equal(
    isValidWorkItem(createWorkItem({ dueDate: "2026-02-30" })),
    false
  )
  assert.equal(
    isValidWorkItem(
      createWorkItem({ startDate: "2026-09-09", dueDate: "2026-09-08" })
    ),
    false
  )
  assert.equal(isValidWorkItem(createWorkItem({ estimate: -1 })), false)
  assert.equal(isValidWorkItem(createWorkItem({ estimate: 1.5 })), false)
  assert.equal(isValidWorkItem(createWorkItem({ position: 1.5 })), false)
  assert.equal(
    isValidWorkItem(createWorkItem({ assigneeId: " member-a" })),
    false
  )
  assert.equal(
    isValidWorkItem(createWorkItem({ assigneeId: " " })),
    false
  )
  assert.equal(isValidWorkItem(createWorkItem({ boardId: " " })), false)
  assert.equal(
    isValidWorkItem(createWorkItem({ boardId: " board-a" })),
    false
  )
})

test("rejects unnormalized or duplicate label IDs", () => {
  assert.equal(
    isValidWorkItem(createWorkItem({ labelIds: [" label-ui"] })),
    false
  )
  assert.equal(isValidWorkItem(createWorkItem({ labelIds: [""] })), false)
  assert.equal(
    isValidWorkItem(
      createWorkItem({ labelIds: ["label-ui", "label-ui"] })
    ),
    false
  )
})

test("rejects unnormalized or duplicate linked document IDs", () => {
  assert.equal(
    isValidWorkItem(
      createWorkItem({ linkedResourceIds: [" resource-notes"] })
    ),
    false
  )
  assert.equal(
    isValidWorkItem(createWorkItem({ linkedResourceIds: [""] })),
    false
  )
  assert.equal(
    isValidWorkItem(
      createWorkItem({
        linkedResourceIds: ["resource-notes", "resource-notes"],
      })
    ),
    false
  )
})

test("rejects invalid or duplicate checklist items", () => {
  assert.equal(
    isValidWorkItem(
      createWorkItem({
        checklist: [
          { id: "same", label: "First", completed: false },
          { id: "same", label: "Second", completed: true },
        ],
      })
    ),
    false
  )
  assert.equal(
    isValidWorkItem(
      createWorkItem({
        checklist: [{ id: "check", label: " ", completed: false }],
      })
    ),
    false
  )
})

test("detects dependency cycles from the proposed dependency list", () => {
  const workItemsById = {
    "item-a": createWorkItem({ id: "item-a", dependencyIds: ["item-b"] }),
    "item-b": createWorkItem({ id: "item-b", dependencyIds: [] }),
  }

  assert.equal(
    wouldCreateDependencyCycle(workItemsById, "item-a", ["item-b"]),
    false
  )
  assert.equal(
    wouldCreateDependencyCycle(workItemsById, "item-b", ["item-a"]),
    true
  )
  assert.equal(
    wouldCreateDependencyCycle(workItemsById, "item-a", ["item-a"]),
    true
  )
})
