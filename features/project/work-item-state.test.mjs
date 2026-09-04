import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  createAndLinkWorkItemDocumentState,
  createWorkItemState,
  deleteWorkItemState,
  linkWorkItemDocumentState,
  moveWorkItemState,
  saveWorkItemState,
  unlinkWorkItemDocumentState,
  updateWorkItemDateRangeState,
  updateWorkItemState,
} from "./work-item-state.ts"

function createWorkItem(overrides = {}) {
  return {
    id: "work-item-2-new-item",
    projectId: "2",
    boardId: "task-board-2-todo",
    title: "Create the shared dialog",
    description: "Prepare the item for a later UI phase.",
    type: "feature",
    priority: "medium",
    assigneeId: null,
    startDate: null,
    dueDate: "2026-09-20",
    estimate: 3,
    position: 1,
    labelIds: ["view-2-board-label-5"],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

function getOrderedIds(state, projectId, boardId) {
  return Object.values(state.workItemsById)
    .filter(
      (workItem) =>
        workItem.projectId === projectId &&
        workItem.boardId === boardId
    )
    .sort((left, right) => left.position - right.position)
    .map((workItem) => workItem.id)
}

function getEditableFields(workItem, overrides = {}) {
  return {
    title: workItem.title,
    description: workItem.description,
    type: workItem.type,
    priority: workItem.priority,
    assigneeId: workItem.assigneeId,
    startDate: workItem.startDate,
    dueDate: workItem.dueDate,
    estimate: workItem.estimate,
    labelIds: [...workItem.labelIds],
    checklist: workItem.checklist.map((item) => ({ ...item })),
    dependencyIds: [...workItem.dependencyIds],
    linkedResourceIds: [...workItem.linkedResourceIds],
    ...overrides,
  }
}

test("creates an item at the requested Board position immutably", () => {
  const state = createProjectSeedState()
  const workItem = createWorkItem()
  const result = createWorkItemState(state, workItem)

  workItem.labelIds.push("view-2-board-label-1")

  assert.notEqual(result, state)
  assert.equal(state.workItemsById["work-item-2-new-item"], undefined)
  assert.deepEqual(result.workItemsById["work-item-2-new-item"].labelIds, [
    "view-2-board-label-5",
  ])
  assert.deepEqual(getOrderedIds(result, "2", "task-board-2-todo"), [
    "work-item-2-workspace-filters",
    "work-item-2-new-item",
    "work-item-2-release-checklist",
  ])
  assert.deepEqual(
    getOrderedIds(state, "2", "task-board-2-todo"),
    ["work-item-2-workspace-filters", "work-item-2-release-checklist"]
  )
})

test("rejects duplicate IDs, unknown projects, invalid Boards, labels, dates, and foreign resources", () => {
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
    createWorkItemState(state, createWorkItem({ boardId: "missing" })),
    state
  )
  assert.equal(
    createWorkItemState(state, createWorkItem({ boardId: "view-3-table" })),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ boardId: "task-board-4-todo" })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ labelIds: ["missing-label"] })
    ),
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

test("rejects same-project Board and document map orphans", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const boardId = "task-board-2-orphan"
  const resourceId = "resource-2-document-orphan"
  const withMapOrphans = {
    ...state,
    taskBoardsById: {
      ...state.taskBoardsById,
      [boardId]: {
        ...state.taskBoardsById["task-board-2-todo"],
        id: boardId,
        title: "Unlisted Board",
      },
    },
    resourcesById: {
      ...state.resourcesById,
      [resourceId]: {
        id: resourceId,
        projectId: "2",
        title: "Unlisted notes",
        type: "document",
        templateId: null,
        isPinned: false,
        content: "",
      },
    },
  }

  assert.strictEqual(
    createWorkItemState(
      withMapOrphans,
      createWorkItem({ boardId, labelIds: [] })
    ),
    withMapOrphans
  )
  assert.strictEqual(
    createWorkItemState(
      withMapOrphans,
      createWorkItem({ linkedResourceIds: [resourceId] })
    ),
    withMapOrphans
  )
  assert.strictEqual(
    saveWorkItemState(
      withMapOrphans,
      itemId,
      getEditableFields(withMapOrphans.workItemsById[itemId], {
        title: "Changed title",
        linkedResourceIds: [resourceId],
      })
    ),
    withMapOrphans
  )
  assert.strictEqual(
    linkWorkItemDocumentState(withMapOrphans, itemId, resourceId),
    withMapOrphans
  )

  const withoutBoardOwnership = {
    ...withMapOrphans,
    projectsById: {
      ...withMapOrphans.projectsById,
      "2": {
        ...withMapOrphans.projectsById["2"],
        viewIds: withMapOrphans.projectsById["2"].viewIds.filter(
          (viewId) => viewId !== "view-2-board"
        ),
      },
    },
  }

  assert.strictEqual(
    saveWorkItemState(
      withoutBoardOwnership,
      itemId,
      getEditableFields(withoutBoardOwnership.workItemsById[itemId], {
        title: "Changed title",
      })
    ),
    withoutBoardOwnership
  )
  assert.strictEqual(
    moveWorkItemState(
      withoutBoardOwnership,
      itemId,
      "task-board-2-todo",
      0
    ),
    withoutBoardOwnership
  )
  assert.strictEqual(
    updateWorkItemDateRangeState(
      withoutBoardOwnership,
      itemId,
      null,
      "2026-09-30"
    ),
    withoutBoardOwnership
  )
})

test("rejects missing and foreign-workspace assignee references", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const current = state.workItemsById[itemId]
  const foreignMemberId = "member-project-beta-sari"

  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ assigneeId: "missing-member" })
    ),
    state
  )
  assert.equal(
    createWorkItemState(
      state,
      createWorkItem({ assigneeId: foreignMemberId })
    ),
    state
  )
  assert.equal(
    updateWorkItemState(state, itemId, { assigneeId: "missing-member" }),
    state
  )
  assert.equal(
    updateWorkItemState(state, itemId, { assigneeId: foreignMemberId }),
    state
  )
  assert.equal(
    saveWorkItemState(
      state,
      itemId,
      getEditableFields(current, { assigneeId: foreignMemberId })
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

test("accepts dependencies owned by another Board in the same project", () => {
  const state = createProjectSeedState()
  const dependencyId = "work-item-2-audit-onboarding"
  const created = createWorkItemState(
    state,
    createWorkItem({ dependencyIds: [dependencyId] })
  )

  assert.notStrictEqual(created, state)
  assert.deepEqual(
    created.workItemsById["work-item-2-new-item"].dependencyIds,
    [dependencyId]
  )
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
      assigneeId: "member-project-alpha-hadi-pratama",
      dueDate: "2026-09-20",
      estimate: 5,
      labelIds: ["view-2-board-label-5", "view-2-board-label-6"],
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
  assert.deepEqual(result.workItemsById[itemId].labelIds, [
    "view-2-board-label-5",
    "view-2-board-label-6",
  ])
})

test("does not move an atomically saved item to another Board", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const current = state.workItemsById[itemId]
  const result = saveWorkItemState(
    state,
    itemId,
    getEditableFields(current, {
      title: "Audit complete",
      dueDate: "2026-09-22",
    })
  )

  assert.deepEqual(getOrderedIds(result, "2", "task-board-2-backlog"), [
    itemId,
    "work-item-2-api-error-model",
  ])
  assert.equal(result.workItemsById[itemId].boardId, current.boardId)
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

test("moves and reorders items while reindexing only affected Boards", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const targetBoardId = "task-board-2-todo"
  const moved = moveWorkItemState(state, itemId, targetBoardId, 1)

  assert.deepEqual(getOrderedIds(moved, "2", "task-board-2-backlog"), [
    "work-item-2-api-error-model",
  ])
  assert.deepEqual(getOrderedIds(moved, "2", targetBoardId), [
    "work-item-2-workspace-filters",
    itemId,
    "work-item-2-release-checklist",
  ])
  assert.equal(moved.workItemsById[itemId].boardId, targetBoardId)

  const reordered = moveWorkItemState(moved, itemId, targetBoardId, 0)
  assert.deepEqual(getOrderedIds(reordered, "2", targetBoardId), [
    itemId,
    "work-item-2-workspace-filters",
    "work-item-2-release-checklist",
  ])
  assert.equal(
    moveWorkItemState(reordered, itemId, targetBoardId, 0),
    reordered
  )
  assert.equal(
    moveWorkItemState(reordered, "missing", "task-board-2-done", 0),
    reordered
  )
  assert.equal(
    moveWorkItemState(reordered, itemId, "task-board-4-done", 0),
    reordered
  )
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

test("links only existing project documents without duplicates", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const resourceId = "resource-2-task-notes"
  const prepared = {
    ...state,
    projectsById: {
      ...state.projectsById,
      "2": {
        ...state.projectsById["2"],
        resourceIds: [resourceId, "resource-2-canvas"],
      },
    },
    resourcesById: {
      ...state.resourcesById,
      [resourceId]: {
        id: resourceId,
        projectId: "2",
        title: "Task notes",
        type: "document",
        templateId: null,
        isPinned: false,
        content: "<p>Keep this content.</p>",
      },
      "resource-2-canvas": {
        id: "resource-2-canvas",
        projectId: "2",
        title: "Task canvas",
        type: "canvas",
        templateId: null,
        isPinned: false,
      },
    },
  }

  const linked = linkWorkItemDocumentState(prepared, itemId, resourceId)

  assert.notStrictEqual(linked, prepared)
  assert.deepEqual(linked.workItemsById[itemId].linkedResourceIds, [
    resourceId,
  ])
  assert.strictEqual(
    linkWorkItemDocumentState(linked, itemId, resourceId),
    linked
  )
  assert.strictEqual(
    linkWorkItemDocumentState(prepared, itemId, "missing-resource"),
    prepared
  )
  assert.strictEqual(
    linkWorkItemDocumentState(prepared, "missing-task", resourceId),
    prepared
  )
  assert.strictEqual(
    linkWorkItemDocumentState(prepared, itemId, "resource-2-canvas"),
    prepared
  )
  assert.strictEqual(
    linkWorkItemDocumentState(
      prepared,
      itemId,
      "resource-1-document"
    ),
    prepared
  )
})

test("unlinks a document without deleting its resource or content", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const resourceId = "resource-2-task-notes"
  const content = "<h1>Persistent notes</h1>"
  const prepared = {
    ...state,
    projectsById: {
      ...state.projectsById,
      "2": {
        ...state.projectsById["2"],
        resourceIds: [resourceId],
      },
    },
    resourcesById: {
      ...state.resourcesById,
      [resourceId]: {
        id: resourceId,
        projectId: "2",
        title: "Task notes",
        type: "document",
        templateId: null,
        isPinned: false,
        content,
      },
    },
    workItemsById: {
      ...state.workItemsById,
      [itemId]: {
        ...state.workItemsById[itemId],
        linkedResourceIds: [resourceId],
      },
    },
  }

  const unlinked = unlinkWorkItemDocumentState(
    prepared,
    itemId,
    resourceId
  )

  assert.deepEqual(unlinked.workItemsById[itemId].linkedResourceIds, [])
  assert.equal(unlinked.resourcesById[resourceId].content, content)
  assert.deepEqual(unlinked.projectsById["2"].resourceIds, [resourceId])
  assert.strictEqual(
    unlinkWorkItemDocumentState(unlinked, itemId, resourceId),
    unlinked
  )
})

test("creates and links a document atomically", () => {
  const state = createProjectSeedState()
  const itemId = "work-item-2-audit-onboarding"
  const resourceId = "resource-2-new-task-notes"
  const created = createAndLinkWorkItemDocumentState(state, {
    id: resourceId,
    workItemId: itemId,
    title: " Task notes ",
  })

  assert.notStrictEqual(created, state)
  assert.equal(created.resourcesById[resourceId].title, "Task notes")
  assert.deepEqual(created.projectsById["2"].resourceIds, [resourceId])
  assert.deepEqual(created.workItemsById[itemId].linkedResourceIds, [
    resourceId,
  ])

  for (const input of [
    { id: resourceId, workItemId: itemId, title: "Duplicate" },
    { id: "resource-orphan-a", workItemId: "missing", title: "Orphan" },
    { id: "resource-orphan-b", workItemId: itemId, title: " " },
  ]) {
    const result = createAndLinkWorkItemDocumentState(created, input)

    assert.strictEqual(result, created)
    assert.equal(created.resourcesById[input.id]?.title, input.id === resourceId ? "Task notes" : undefined)
  }

  const invalidState = {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [itemId]: {
        ...state.workItemsById[itemId],
        linkedResourceIds: ["resource-1-document"],
      },
    },
  }
  const rejectedAfterCreate = createAndLinkWorkItemDocumentState(
    invalidState,
    {
      id: "resource-2-rolled-back",
      workItemId: itemId,
      title: "Rolled back",
    }
  )

  assert.strictEqual(rejectedAfterCreate, invalidState)
  assert.equal(
    rejectedAfterCreate.resourcesById["resource-2-rolled-back"],
    undefined
  )
})

test("create, save, move, and delete leave unrelated Boards untouched", () => {
  const state = createProjectSeedState()
  const siblingId = "work-item-2-editor-shortcuts"
  const sibling = state.workItemsById[siblingId]

  const created = createWorkItemState(state, createWorkItem())
  const saved = saveWorkItemState(
    created,
    "work-item-2-new-item",
    getEditableFields(created.workItemsById["work-item-2-new-item"], {
      title: "Updated task",
    })
  )
  const moved = moveWorkItemState(
    saved,
    "work-item-2-new-item",
    "task-board-2-review",
    0
  )
  const deleted = deleteWorkItemState(moved, "work-item-2-new-item")

  for (const candidate of [created, saved, moved, deleted]) {
    assert.strictEqual(candidate.workItemsById[siblingId], sibling)
  }
})
