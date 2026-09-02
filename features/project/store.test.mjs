import assert from "node:assert/strict"
import test from "node:test"

import { createProjectStore } from "./store.ts"

function createWorkItem() {
  return {
    id: "work-item-2-store-test",
    projectId: "2",
    title: "Verify the store",
    description: "Exercise the vanilla action boundary.",
    type: "chore",
    status: "todo",
    priority: "low",
    assignee: null,
    startDate: null,
    dueDate: "2026-09-22",
    estimate: 1,
    position: 1,
    labels: ["Quality"],
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

  assert.equal(store.getState().moveWorkItem(itemId, "todo", 0), true)
  assert.equal(store.getState().workItemsById[itemId].status, "todo")
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
  assert.equal(typeof store.getState().resetDemo, "function")
})

test("delegates atomic project, view, and Document actions", () => {
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

  assert.equal(
    store.getState().addProjectView("project-created", "board"),
    true
  )
  assert.equal(notifications, 2)
  assert.equal(
    store.getState().addProjectView("project-created", "board"),
    false
  )
  assert.equal(notifications, 2)

  assert.equal(
    store.getState().addProjectDocument("project-created"),
    true
  )
  assert.equal(notifications, 3)
  assert.equal(
    store.getState().addProjectDocument("project-created"),
    false
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
  assert.equal(typeof store.getState().addProjectDocument, "function")
})
