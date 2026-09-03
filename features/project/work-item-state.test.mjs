import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  createWorkItemState,
  deleteWorkItemState,
  moveWorkItemState,
  saveWorkItemState,
  updateWorkItemDateRangeState,
  updateWorkItemState,
} from "./work-item-state.ts"

function createWorkItem(overrides = {}) {
  return {
    id: "work-item-2-new-item",
    projectId: "2",
    title: "Create the shared dialog",
    description: "Prepare the item for a later UI phase.",
    type: "feature",
    status: "todo",
    priority: "medium",
    assignee: null,
    startDate: null,
    dueDate: "2026-09-20",
    estimate: 3,
    position: 1,
    labels: ["Frontend"],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

function getOrderedIds(state, projectId, status) {
  return Object.values(state.workItemsById)
    .filter(
      (workItem) =>
        workItem.projectId === projectId && workItem.status === status
    )
    .sort((left, right) => left.position - right.position)
    .map((workItem) => workItem.id)
}

function getEditableFields(workItem, overrides = {}) {
  return {
    title: workItem.title,
    description: workItem.description,
    type: workItem.type,
    status: workItem.status,
    priority: workItem.priority,
    assignee: workItem.assignee ? { ...workItem.assignee } : null,
    dueDate: workItem.dueDate,
    estimate: workItem.estimate,
    labels: [...workItem.labels],
    checklist: workItem.checklist.map((item) => ({ ...item })),
    ...overrides,
  }
}

test("creates an item at the requested status position immutably", () => {
  const state = createProjectSeedState()
  const workItem = createWorkItem()
  const result = createWorkItemState(state, workItem)

  workItem.labels.push("Mutated outside state")

  assert.notEqual(result, state)
  assert.equal(state.workItemsById["work-item-2-new-item"], undefined)
  assert.deepEqual(result.workItemsById["work-item-2-new-item"].labels, [
    "Frontend",
  ])
  assert.deepEqual(getOrderedIds(result, "2", "todo"), [
    "work-item-2-workspace-filters",
    "work-item-2-new-item",
    "work-item-2-release-checklist",
  ])
  assert.deepEqual(
    getOrderedIds(state, "2", "todo"),
    ["work-item-2-workspace-filters", "work-item-2-release-checklist"]
  )
})

test("rejects duplicate IDs, unknown projects, invalid dates, and foreign resources", () => {
  const state = createProjectSeedState()
  const stateWithForeignMilestone = {
    ...state,
    milestonesById: {
      "milestone-1": {
        id: "milestone-1",
        projectId: "1",
        title: "Foreign milestone",
        description: "Belongs to another project.",
        targetDate: "2026-09-30",
        status: "planned",
      },
    },
  }

  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ id: "work-item-2-audit-onboarding" })
    ),
    state
  )
  assert.equal(
    createWorkItemState(state, createWorkItem({ projectId: "missing" })),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ dueDate: "2026-02-30" })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ linkedResourceIds: ["resource-1-document"] })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      stateWithForeignMilestone,
      createWorkItem({ milestoneId: "milestone-1" })
    ),
    stateWithForeignMilestone
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ dependencyIds: ["work-item-4-audit-onboarding"] })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ dependencyIds: ["missing-dependency"] })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ dependencyIds: ["work-item-2-new-item"] })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({
        dependencyIds: [
          "work-item-2-audit-onboarding",
          "work-item-2-audit-onboarding",
        ],
      })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({
        projectId: "1",
        linkedResourceIds: [
          "resource-1-document",
          "resource-1-document",
        ],
      })
    ),
    state
  )
})

test("updates details but rejects a proposed dependency cycle", () => {
  const state = createProjectSeedState()
  const firstId = "work-item-2-audit-onboarding"
  const secondId = "work-item-2-api-error-model"
  const updated = updateWorkItemState(state, firstId, {
    title: "Audit onboarding",
    estimate: 5,
    dependencyIds: [secondId],
  })

  assert.equal(updated.workItemsById[firstId].title, "Audit onboarding")
  assert.equal(updated.workItemsById[firstId].estimate, 5)
  assert.deepEqual(updated.workItemsById[firstId].dependencyIds, [secondId])
  assert.equal(
    updateWorkItemState(updated, firstId, { title: "Audit onboarding" }),
    updated
  )
  assert.equal(
    updateWorkItemState(updated, secondId, {
      dependencyIds: [firstId],
    }),
    updated
  )
  assert.equal(updateWorkItemState(updated, "missing", { title: "No" }), updated)
})

test("saves every dialog field without moving its position", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-workspace-filters"
  const current = state.workItemsById[itemId]
  const result = saveWorkItemState(
    state,
    itemId,
    getEditableFields(current, {
      title: "Workspace filters ready",
      type: "bug",
      priority: "urgent",
      assignee: { name: "Ada Lovelace", initials: "AL" },
      dueDate: "2026-09-20",
      estimate: 5,
      labels: ["Frontend", "Quality"],
      checklist: [
        {
          id: "verify",
          label: "Verify filters",
          completed: true,
        },
      ],
    })
  )

  assert.notEqual(result, state)
  assert.equal(result.workItemsById[itemId].position, current.position)
  assert.equal(
    result.workItemsById[itemId].title,
    "Workspace filters ready"
  )
  assert.equal(result.workItemsById[itemId].priority, "urgent")
  assert.deepEqual(result.workItemsById[itemId].labels, [
    "Frontend",
    "Quality",
  ])
})

test("moves an atomically saved item to the end of its new status", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const current = state.workItemsById[itemId]
  const result = saveWorkItemState(
    state,
    itemId,
    getEditableFields(current, {
      title: "Audit complete",
      status: "todo",
      dueDate: "2026-09-22",
    })
  )

  assert.deepEqual(getOrderedIds(result, "2", "backlog"), [
    "work-item-2-api-error-model",
  ])
  assert.deepEqual(getOrderedIds(result, "2", "todo"), [
    "work-item-2-workspace-filters",
    "work-item-2-release-checklist",
    itemId,
  ])
  assert.equal(result.workItemsById[itemId].title, "Audit complete")
  assert.equal(result.workItemsById[itemId].dueDate, "2026-09-22")
})

test("preserves state identity for invalid and value-equivalent saves", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const current = state.workItemsById[itemId]

  assert.equal(
    saveWorkItemState(state, itemId, getEditableFields(current)),
    state
  )
  assert.equal(
    saveWorkItemState(
      state,
      itemId,
      getEditableFields(current, { title: " " })
    ),
    state
  )
  assert.equal(
    saveWorkItemState(
      state,
      itemId,
      getEditableFields(current, { dueDate: "2026-02-29" })
    ),
    state
  )
})

test("moves and reorders items while reindexing only affected groups", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const moved = moveWorkItemState(state, itemId, "todo", 1)

  assert.deepEqual(getOrderedIds(moved, "2", "backlog"), [
    "work-item-2-api-error-model",
  ])
  assert.deepEqual(getOrderedIds(moved, "2", "todo"), [
    "work-item-2-workspace-filters",
    itemId,
    "work-item-2-release-checklist",
  ])
  assert.equal(moved.workItemsById[itemId].status, "todo")

  const reordered = moveWorkItemState(moved, itemId, "todo", 0)
  assert.deepEqual(getOrderedIds(reordered, "2", "todo"), [
    itemId,
    "work-item-2-workspace-filters",
    "work-item-2-release-checklist",
  ])
  assert.equal(moveWorkItemState(reordered, itemId, "todo", 0), reordered)
  assert.equal(moveWorkItemState(reordered, "missing", "done", 0), reordered)
})

test("updates only valid inclusive date ranges", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const updated = updateWorkItemDateRangeState(
    state,
    itemId,
    "2026-09-03",
    "2026-09-12"
  )

  assert.equal(updated.workItemsById[itemId].startDate, "2026-09-03")
  assert.equal(updated.workItemsById[itemId].dueDate, "2026-09-12")
  assert.equal(
    updateWorkItemDateRangeState(
      updated,
      itemId,
      "2026-09-13",
      "2026-09-12"
    ),
    updated
  )
  assert.equal(
    updateWorkItemDateRangeState(
      updated,
      itemId,
      "2026-09-03",
      "2026-09-12"
    ),
    updated
  )
})

test("deletes an item, removes dependency references, and closes its order gap", () => {
  const state = createProjectSeedState()
  const deletedId = "work-item-2-audit-onboarding"
  const dependentId = "work-item-2-api-error-model"
  const linked = updateWorkItemState(state, dependentId, {
    dependencyIds: [deletedId],
  })
  const result = deleteWorkItemState(linked, deletedId)

  assert.equal(result.workItemsById[deletedId], undefined)
  assert.deepEqual(result.workItemsById[dependentId].dependencyIds, [])
  assert.equal(result.workItemsById[dependentId].position, 0)
  assert.equal(deleteWorkItemState(result, "missing"), result)
})
