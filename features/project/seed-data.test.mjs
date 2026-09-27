import assert from "node:assert/strict"
import test from "node:test"

import { INITIAL_CALENDAR_TASKS } from "../calendar/mock-data.ts"
import { INITIAL_KANBAN_COLUMNS } from "../kanban/mock-data.ts"
import {
  isValidWorkItem,
  wouldCreateDependencyCycle,
} from "../work-item/model.ts"
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
  assert.equal(Object.keys(state.projectViewsById).length, 5)
  assert.equal(Object.keys(state.resourcesById).length, 4)
  assert.equal(Object.keys(state.milestonesById).length, 0)
})

test("maps each legacy renderer to its first view or resource", () => {
  const state = createProjectSeedState()

  const boardViewId = state.projectsById["2"].viewIds[0]
  const tableViewId = state.projectsById["3"].viewIds[0]
  const calendarViewId = state.projectsById["6"].viewIds[1]
  const documentResourceId = state.projectsById["1"].resourceIds[0]

  assert.equal(state.projectViewsById[boardViewId].type, "board")
  assert.equal(state.projectViewsById[tableViewId].type, "table")
  assert.equal(state.projectViewsById[calendarViewId].type, "calendar")
  assert.deepEqual(state.projectsById["6"].viewIds, [
    "view-6-board",
    "view-6-calendar",
  ])
  assert.deepEqual(state.projectsById["1"].viewIds, [])
  assert.equal(state.resourcesById[documentResourceId].type, "document")
  assert.equal(state.resourcesById[documentResourceId].title, "API Design")
  assert.deepEqual(state.projectsById["1"].resourceIds, [
    "resource-1-document",
    "resource-1-endpoint-guidelines",
    "resource-1-decision-log",
  ])
  assert.deepEqual(
    state.projectsById["1"].resourceIds.map((resourceId) => ({
      id: resourceId,
      title: state.resourcesById[resourceId].title,
      content: state.resourcesById[resourceId].content,
    })),
    [
      {
        id: "resource-1-document",
        title: "API Design",
        content:
          "<h1>API Design</h1><p>Capture endpoints, payloads, and response contracts.</p>",
      },
      {
        id: "resource-1-endpoint-guidelines",
        title: "Endpoint guidelines",
        content:
          "<h1>Endpoint guidelines</h1><p>Keep routes predictable and errors consistent.</p>",
      },
      {
        id: "resource-1-decision-log",
        title: "Decision log",
        content:
          "<h1>Decision log</h1><p>Record technical decisions and their trade-offs.</p>",
      },
    ]
  )
  assert.deepEqual(state.projectsById["5"].resourceIds, [
    "resource-5-document",
  ])
  assert.equal(
    state.resourcesById["resource-5-document"].content,
    "<h1>Team Wiki</h1><p>Keep shared project knowledge in one place.</p>"
  )
})

test("creates explicit ordered Boards for every seeded Board view", () => {
  const state = createProjectSeedState()
  const view = state.projectViewsById["view-2-board"]

  assert.equal(view.type, "board")
  assert.deepEqual(
    view.boardIds.map((boardId) => state.taskBoardsById[boardId].title),
    ["Backlog", "To Do", "In Progress", "Review", "Testing", "Done"]
  )
  assert.deepEqual(
    view.boardIds.map((boardId) => state.taskBoardsById[boardId].stage),
    ["backlog", "todo", "in-progress", "review", "testing", "done"]
  )
})

test("converts every current task fixture for its owning project", () => {
  const state = createProjectSeedState()
  const kanbanCardCount = INITIAL_KANBAN_COLUMNS.reduce(
    (total, column) => total + column.cards.length,
    0
  )
  const expectedTotal =
    kanbanCardCount * 2 + INITIAL_CALENDAR_TASKS.length

  assert.equal(getProjectWorkItems(state, "2").length, kanbanCardCount)
  assert.equal(getProjectWorkItems(state, "4").length, kanbanCardCount)
  assert.deepEqual(getProjectWorkItems(state, "3"), [])
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
  assert.deepEqual(
    state.workItemsById["work-item-2-workspace-filters"].dependencyIds,
    ["work-item-2-audit-onboarding"]
  )
  assert.deepEqual(
    state.workItemsById["work-item-6-regression-pass"].dependencyIds,
    ["work-item-6-release-notes"]
  )
  assert.deepEqual(
    state.workItemsById["work-item-6-readiness-review"].dependencyIds,
    ["work-item-6-regression-pass"]
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
    const project = state.projectsById[workItem.projectId]
    const board = state.taskBoardsById[workItem.boardId]
    const boardView = state.projectViewsById[board?.viewId]

    assert.ok(project)
    assert.equal(board?.projectId, workItem.projectId)
    assert.equal(boardView?.type, "board")
    assert.equal(boardView?.projectId, workItem.projectId)
    assert.equal(boardView?.boardIds.includes(board.id), true)
    assert.equal(isValidWorkItem(workItem), true)
    assert.equal("status" in workItem, false)

    for (const labelId of workItem.labelIds) {
      assert.equal(
        boardView.labels.some((label) => label.id === labelId),
        true
      )
    }

    for (const dependencyId of workItem.dependencyIds) {
      assert.equal(
        state.workItemsById[dependencyId]?.projectId,
        workItem.projectId
      )
    }

    assert.equal(
      wouldCreateDependencyCycle(
        state.workItemsById,
        workItem.id,
        workItem.dependencyIds
      ),
      false
    )
  }
})

test("returns a fresh object graph for every seed request", () => {
  const first = createProjectSeedState()
  const second = createProjectSeedState()
  const workItemId = "work-item-2-audit-onboarding"

  first.projectsById["2"].viewIds.push("mutated-view")
  first.workItemsById[workItemId].title = "Mutated title"
  first.workItemsById[workItemId].labelIds.push("mutated-label")

  assert.deepEqual(second.projectsById["2"].viewIds, ["view-2-board"])
  assert.equal(
    second.workItemsById[workItemId].title,
    "Audit the onboarding flow"
  )
  assert.deepEqual(second.workItemsById[workItemId].labelIds, [
    "view-2-board-label-1",
    "view-2-board-label-2",
  ])
})

test("builds deterministic Board label catalogs in first-seen order", () => {
  const state = createProjectSeedState()

  assert.deepEqual(state.projectViewsById["view-2-board"].labels, [
    { id: "view-2-board-label-1", name: "Research", color: "gray" },
    { id: "view-2-board-label-2", name: "UX", color: "orange" },
    { id: "view-2-board-label-3", name: "Backend", color: "yellow" },
    { id: "view-2-board-label-4", name: "API", color: "green" },
    { id: "view-2-board-label-5", name: "Frontend", color: "blue" },
    { id: "view-2-board-label-6", name: "Docs", color: "purple" },
    { id: "view-2-board-label-7", name: "Quality", color: "pink" },
    { id: "view-2-board-label-8", name: "Product", color: "red" },
    { id: "view-2-board-label-9", name: "Security", color: "gray" },
  ])
})
