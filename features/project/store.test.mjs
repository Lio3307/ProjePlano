import assert from "node:assert/strict"
import test from "node:test"

import { createProjectStore } from "./store.ts"

function createWorkItem() {
  return {
    id: "work-item-2-store-test",
    projectId: "2",
    boardId: "task-board-2-todo",
    title: "Verify the store",
    description: "Exercise the vanilla action boundary.",
    type: "chore",
    priority: "low",
    startDate: null,
    dueDate: "2026-09-22",
    estimate: 1,
    position: 1,
    labelIds: ["view-2-board-label-7"],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
  }
}

test("creates isolated store instances", () => {
  const first = createProjectStore()
  const second = createProjectStore()
  const itemId = "work-item-2-audit-onboarding"

  assert.equal(
    first.getState().updateWorkItem(itemId, { title: "Changed in first" }),
    true
  )
  assert.equal(first.getState().workItemsById[itemId].title, "Changed in first")
  assert.equal(
    second.getState().workItemsById[itemId].title,
    "Audit the onboarding flow"
  )
})

test("reports rejected actions without notifying subscribers", () => {
  const store = createProjectStore()
  let notifications = 0
  const unsubscribe = store.subscribe(() => {
    notifications += 1
  })
  const before = store.getState()

  assert.equal(store.getState().updateWorkItem("missing", { title: "No" }), false)
  assert.equal(store.getState(), before)
  assert.equal(notifications, 0)

  assert.equal(store.getState().createWorkItem(createWorkItem()), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().createWorkItem(createWorkItem()), false)
  assert.equal(notifications, 1)

  unsubscribe()
})

test("delegates move, date-range, and delete actions", () => {
  const store = createProjectStore()
  const itemId = "work-item-2-audit-onboarding"

  assert.equal(
    store.getState().moveWorkItem(itemId, "task-board-2-todo", 0),
    true
  )
  assert.equal(
    store.getState().workItemsById[itemId].boardId,
    "task-board-2-todo"
  )
  assert.equal(store.getState().workItemsById[itemId].position, 0)

  assert.equal(
    store
      .getState()
      .updateWorkItemDateRange(
        itemId,
        "2026-09-04",
        "2026-09-14"
      ),
    true
  )
  assert.equal(store.getState().workItemsById[itemId].dueDate, "2026-09-14")

  assert.equal(store.getState().deleteWorkItem(itemId), true)
  assert.equal(store.getState().workItemsById[itemId], undefined)
  assert.equal(store.getState().deleteWorkItem(itemId), false)
})

test("notifies once for an atomic save and never for a no-op", () => {
  const store = createProjectStore()
  const itemId = "work-item-2-audit-onboarding"
  const item = store.getState().workItemsById[itemId]
  const fields = {
    title: "Audit onboarding",
    description: item.description,
    type: item.type,
    priority: item.priority,
    startDate: item.startDate,
    dueDate: item.dueDate,
    estimate: item.estimate,
    labelIds: item.labelIds,
    checklist: item.checklist,
    dependencyIds: item.dependencyIds,
    linkedResourceIds: item.linkedResourceIds,
  }
  let notifications = 0
  const unsubscribe = store.subscribe(() => {
    notifications += 1
  })

  assert.equal(store.getState().saveWorkItem(itemId, fields), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().saveWorkItem(itemId, fields), false)
  assert.equal(notifications, 1)

  unsubscribe()
})

test("resets to the store's private baseline without dropping actions", () => {
  const store = createProjectStore()
  const itemId = "work-item-2-audit-onboarding"

  store.getState().updateWorkItem(itemId, { title: "Temporary title" })
  store.getState().resetDemo()

  assert.equal(
    store.getState().workItemsById[itemId].title,
    "Audit the onboarding flow"
  )
  assert.equal(typeof store.getState().createWorkItem, "function")
  assert.equal(typeof store.getState().createFirstTaskBoard, "function")
  assert.equal(typeof store.getState().addTaskBoard, "function")
  assert.equal(typeof store.getState().updateTaskBoard, "function")
  assert.equal(typeof store.getState().updateBoardLabels, "function")
  assert.equal(typeof store.getState().resetDemo, "function")
})

test("delegates atomic first Board creation with one notification", () => {
  const store = createProjectStore()
  const input = {
    viewId: "view-1-board",
    board: {
      id: "task-board-1-todo",
      projectId: "1",
      title: "Todo",
      description: "Ready work",
      stage: "todo",
    },
  }
  let notifications = 0
  const unsubscribe = store.subscribe(() => {
    notifications += 1
  })

  assert.equal(store.getState().createFirstTaskBoard(input), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().createFirstTaskBoard(input), false)
  assert.equal(notifications, 1)
  assert.deepEqual(store.getState().projectViewsById[input.viewId].boardIds, [
    input.board.id,
  ])

  unsubscribe()
})

test("delegates Board and shared-label updates with one notification each", () => {
  const store = createProjectStore()
  const view = store.getState().projectViewsById["view-2-board"]
  const boardInput = {
    id: "task-board-2-blocked",
    projectId: "2",
    viewId: view.id,
    title: "Blocked",
    description: "Needs attention",
    stage: "review",
  }
  const updateInput = {
    boardId: "task-board-2-todo",
    title: "Ready",
    description: "Available work",
    stage: "todo",
  }
  const labelInput = {
    viewId: view.id,
    labels: view.labels.slice(1),
  }
  let notifications = 0
  const unsubscribe = store.subscribe(() => {
    notifications += 1
  })

  assert.equal(store.getState().addTaskBoard(boardInput), true)
  assert.equal(notifications, 1)
  assert.equal(store.getState().addTaskBoard(boardInput), false)
  assert.equal(notifications, 1)
  assert.equal(store.getState().updateTaskBoard(updateInput), true)
  assert.equal(notifications, 2)
  assert.equal(store.getState().updateTaskBoard(updateInput), false)
  assert.equal(notifications, 2)
  assert.equal(store.getState().updateBoardLabels(labelInput), true)
  assert.equal(notifications, 3)
  assert.equal(store.getState().updateBoardLabels(labelInput), false)
  assert.equal(notifications, 3)

  unsubscribe()
})

test("preserves shared label IDs when a Board is edited", () => {
  const store = createProjectStore()
  const board = store.getState().taskBoardsById["task-board-2-todo"]
  const input = {
    boardId: board.id,
    title: "Ready",
    description: board.description,
    stage: board.stage,
  }
  const labelsBefore = store.getState().projectViewsById[board.viewId].labels

  assert.equal(store.getState().updateTaskBoard(input), true)
  assert.strictEqual(
    store.getState().projectViewsById[board.viewId].labels,
    labelsBefore
  )
})

test("delegates atomic project, view, and document actions", () => {
  const store = createProjectStore()
  let notifications = 0
  const unsubscribe = store.subscribe(() => {
    notifications += 1
  })
  const input = {
    id: "project-created",
    workspaceId: "project-beta",
    templateId: "empty-project",
    title: "Created project",
    description: "",
  }

  assert.equal(store.getState().createProjectFromTemplate(input), true)
  assert.equal(notifications, 1)
  assert.equal(
    store.getState().projectsById["project-created"].title,
    "Created project"
  )

  assert.equal(store.getState().createProjectFromTemplate(input), false)
  assert.equal(notifications, 1)

  const firstTable = {
    id: "view-project-created-table-1",
    projectId: "project-created",
    type: "table",
  }
  const secondTable = {
    id: "view-project-created-table-2",
    projectId: "project-created",
    type: "table",
  }

  assert.equal(store.getState().addProjectView(firstTable), true)
  assert.equal(notifications, 2)
  assert.equal(store.getState().addProjectView(secondTable), true)
  assert.equal(notifications, 3)
  assert.deepEqual(
    store.getState().projectsById["project-created"].viewIds,
    [firstTable.id, secondTable.id]
  )
  assert.equal(
    store.getState().projectViewsById[firstTable.id].title,
    "Table"
  )
  assert.equal(
    store.getState().projectViewsById[secondTable.id].title,
    "Table 2"
  )
  assert.equal(store.getState().addProjectView(secondTable), false)
  assert.equal(
    store.getState().addProjectView({
      id: "view-project-created-board-generic",
      projectId: "project-created",
      type: "board",
    }),
    false
  )
  assert.equal(notifications, 3)

  const notes = {
    id: "resource-project-created-document-notes",
    projectId: "project-created",
    title: "Notes",
  }
  const runbook = {
    id: "resource-project-created-document-runbook",
    projectId: "project-created",
    title: "Runbook",
  }

  assert.equal(store.getState().addProjectDocument(notes), true)
  assert.equal(notifications, 4)
  assert.equal(store.getState().addProjectDocument(runbook), true)
  assert.equal(notifications, 5)
  assert.equal(store.getState().addProjectDocument(notes), false)
  assert.equal(notifications, 5)
  assert.deepEqual(
    store.getState().projectsById["project-created"].resourceIds,
    [notes.id, runbook.id]
  )

  const content = "<h1>Project notes</h1>"
  assert.equal(store.getState().saveProjectDocument(notes.id, content), true)
  assert.equal(notifications, 6)
  assert.equal(store.getState().resourcesById[notes.id].content, content)
  assert.equal(store.getState().saveProjectDocument(notes.id, content), false)
  assert.equal(notifications, 6)
  assert.equal(
    store.getState().saveProjectDocument("missing-resource", content),
    false
  )
  assert.equal(notifications, 6)

  unsubscribe()
})

test("delegates focused task document relationships atomically", () => {
  const store = createProjectStore()
  const itemId = "work-item-2-audit-onboarding"
  const resourceId = "resource-2-task-notes"
  let notifications = 0
  const unsubscribe = store.subscribe(() => {
    notifications += 1
  })

  assert.equal(
    store.getState().createAndLinkWorkItemDocument({
      id: resourceId,
      workItemId: itemId,
      title: "Task notes",
    }),
    true
  )
  assert.equal(notifications, 1)
  assert.deepEqual(store.getState().workItemsById[itemId].linkedResourceIds, [
    resourceId,
  ])

  assert.equal(
    store.getState().linkWorkItemDocument(itemId, resourceId),
    false
  )
  assert.equal(notifications, 1)
  assert.equal(
    store.getState().unlinkWorkItemDocument(itemId, resourceId),
    true
  )
  assert.equal(notifications, 2)
  assert.ok(store.getState().resourcesById[resourceId])
  assert.equal(
    store.getState().unlinkWorkItemDocument(itemId, resourceId),
    false
  )
  assert.equal(notifications, 2)
  assert.equal(
    store.getState().linkWorkItemDocument(itemId, resourceId),
    true
  )
  assert.equal(notifications, 3)

  unsubscribe()
})

test("reset removes client-created project structure", () => {
  const store = createProjectStore()

  store.getState().createProjectFromTemplate({
    id: "project-created",
    workspaceId: "project-beta",
    templateId: "web-application",
    title: "Created project",
    description: "",
  })
  store.getState().resetDemo()

  assert.equal(store.getState().projectsById["project-created"], undefined)
  assert.equal(
    store.getState().projectIdsByWorkspaceId["project-beta"],
    undefined
  )
  assert.equal(typeof store.getState().createProjectFromTemplate, "function")
  assert.equal(typeof store.getState().addProjectView, "function")
  assert.equal(typeof store.getState().createFirstTaskBoard, "function")
  assert.equal(typeof store.getState().addTaskBoard, "function")
  assert.equal(typeof store.getState().updateTaskBoard, "function")
  assert.equal(typeof store.getState().updateBoardLabels, "function")
  assert.equal(typeof store.getState().addProjectDocument, "function")
  assert.equal(typeof store.getState().saveProjectDocument, "function")
})
