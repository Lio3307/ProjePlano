import assert from "node:assert/strict"
import test from "node:test"

import { INITIAL_CALENDAR_TASKS } from "../calendar/mock-data.ts"
import { INITIAL_KANBAN_COLUMNS } from "../kanban/mock-data.ts"
import { INITIAL_ROWS } from "../table/mock-data.ts"
import { isValidWorkItem } from "../work-item/model.ts"
import { PROJECTS } from "./mock-data.ts"
import { createProjectSeedState } from "./seed-data.ts"

function getProjectWorkItems(state, projectId) {
  return Object.values(state.workItemsById).filter(
    (workItem) => workItem.projectId === projectId
  )
}

test("creates one normalized container for every current project", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    state.projectIdsByWorkspaceId["project-alpha"],
    PROJECTS.map((project) => project.id)
  )
  assert.equal(Object.keys(state.projectsById).length, PROJECTS.length)
  assert.equal(Object.keys(state.projectViewsById).length, 4)
  assert.equal(Object.keys(state.resourcesById).length, 2)
  assert.equal(Object.keys(state.milestonesById).length, 0)
})

test("maps each legacy renderer to its first view or resource", () => {
  const state = createProjectSeedState()

  const boardViewId = state.projectsById["2"].viewIds[0]
  const tableViewId = state.projectsById["3"].viewIds[0]
  const calendarViewId = state.projectsById["6"].viewIds[0]
  const documentResourceId = state.projectsById["1"].resourceIds[0]

  assert.equal(state.projectViewsById[boardViewId].type, "board")
  assert.equal(state.projectViewsById[tableViewId].type, "table")
  assert.equal(state.projectViewsById[calendarViewId].type, "calendar")
  assert.deepEqual(state.projectsById["1"].viewIds, [])
  assert.equal(state.resourcesById[documentResourceId].type, "document")
  assert.equal(state.resourcesById[documentResourceId].title, "API Design")
})

test("converts every current task fixture for its owning project", () => {
  const state = createProjectSeedState()
  const kanbanCardCount = INITIAL_KANBAN_COLUMNS.reduce(
    (total, column) => total + column.cards.length,
    0
  )
  const expectedTotal =
    kanbanCardCount * 2 + INITIAL_CALENDAR_TASKS.length + INITIAL_ROWS.length

  assert.equal(getProjectWorkItems(state, "2").length, kanbanCardCount)
  assert.equal(getProjectWorkItems(state, "4").length, kanbanCardCount)
  assert.equal(getProjectWorkItems(state, "3").length, INITIAL_ROWS.length)
  assert.equal(
    getProjectWorkItems(state, "6").length,
    INITIAL_CALENDAR_TASKS.length
  )
  assert.equal(Object.keys(state.workItemsById).length, expectedTotal)
  assert.equal(
    state.workItemsById["work-item-2-audit-onboarding"].title,
    "Audit the onboarding flow"
  )
  assert.equal(
    state.workItemsById["work-item-6-launch-kickoff"].dueDate,
    "2026-09-01"
  )
  assert.equal(
    state.workItemsById["work-item-3-r1"].title,
    "Design review"
  )
  assert.deepEqual(
    state.workItemsById["work-item-3-r1"].customFields.attachments,
    []
  )
})

test("keeps every normalized relationship inside its owning project", () => {
  const state = createProjectSeedState()

  for (const project of Object.values(state.projectsById)) {
    for (const viewId of project.viewIds) {
      assert.equal(state.projectViewsById[viewId]?.projectId, project.id)
    }

    for (const resourceId of project.resourceIds) {
      assert.equal(state.resourcesById[resourceId]?.projectId, project.id)
    }

    for (const milestoneId of project.milestoneIds) {
      assert.equal(state.milestonesById[milestoneId]?.projectId, project.id)
    }
  }

  for (const workItem of Object.values(state.workItemsById)) {
    assert.ok(state.projectsById[workItem.projectId])
    assert.equal(isValidWorkItem(workItem), true)
  }
})

test("returns a fresh object graph for every seed request", () => {
  const first = createProjectSeedState()
  const second = createProjectSeedState()
  const workItemId = "work-item-2-audit-onboarding"

  first.projectsById["2"].viewIds.push("mutated-view")
  first.workItemsById[workItemId].title = "Mutated title"
  first.workItemsById[workItemId].labels.push("Mutated label")

  assert.deepEqual(second.projectsById["2"].viewIds, ["view-2-board"])
  assert.equal(
    second.workItemsById[workItemId].title,
    "Audit the onboarding flow"
  )
  assert.deepEqual(second.workItemsById[workItemId].labels, [
    "Research",
    "UX",
  ])
})
