import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  selectMissingSupportedViewTypes,
  selectProjectById,
  selectProjectDocumentResources,
  selectProjectForWorkspace,
  selectProjectMilestones,
  selectProjectResources,
  selectProjectsByWorkspaceId,
  selectSupportedProjectViews,
  selectProjectViews,
  selectProjectWorkItems,
  selectWorkItemsByStatus,
} from "./selectors.ts"

test("selects workspace projects in their explicit order", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    selectProjectsByWorkspaceId(state, "project-alpha").map(
      (project) => project.id
    ),
    ["1", "2", "3", "4", "5", "6"]
  )
  assert.equal(selectProjectById(state, "2")?.title, "Sprint Board")
})

test("resolves ordered views, resources, and milestones by project", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    selectProjectViews(state, "2").map((view) => view.type),
    ["board"]
  )
  assert.deepEqual(
    selectProjectResources(state, "1").map((resource) => resource.type),
    ["document"]
  )
  assert.deepEqual(selectProjectMilestones(state, "2"), [])
})

test("sorts work items by workflow status and stored position", () => {
  const state = createProjectSeedState()
  const projectItems = selectProjectWorkItems(state, "2")
  const todoItems = selectWorkItemsByStatus(state, "2", "todo")

  assert.deepEqual(
    projectItems.slice(0, 2).map((workItem) => workItem.status),
    ["backlog", "backlog"]
  )
  assert.deepEqual(
    todoItems.map((workItem) => workItem.id),
    ["work-item-2-workspace-filters", "work-item-2-release-checklist"]
  )
  assert.deepEqual(
    todoItems.map((workItem) => workItem.position),
    [0, 1]
  )
})

test("returns safe empty results and ignores a foreign relationship", () => {
  const state = createProjectSeedState()
  state.projectsById["2"] = {
    ...state.projectsById["2"],
    resourceIds: ["resource-1-document"],
  }

  assert.equal(selectProjectById(state, "missing"), null)
  assert.deepEqual(selectProjectsByWorkspaceId(state, "missing"), [])
  assert.deepEqual(selectProjectViews(state, "missing"), [])
  assert.deepEqual(selectProjectWorkItems(state, "missing"), [])
  assert.deepEqual(selectProjectResources(state, "2"), [])
  assert.deepEqual(selectProjectMilestones(state, "missing"), [])
})

test("constrains a project to its owning workspace", () => {
  const state = createProjectSeedState()

  assert.equal(
    selectProjectForWorkspace(state, "project-alpha", "2")?.title,
    "Sprint Board"
  )
  assert.equal(
    selectProjectForWorkspace(state, "project-beta", "2"),
    null
  )
})

test("selects only supported work views and missing Phase 2 types", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    selectSupportedProjectViews(state, "2").map((view) => view.type),
    ["board"]
  )
  assert.deepEqual(selectMissingSupportedViewTypes(state, "2"), [
    "table",
    "calendar",
  ])
  assert.deepEqual(
    selectProjectDocumentResources(state, "1").map(
      (resource) => resource.id
    ),
    ["resource-1-document"]
  )
  assert.deepEqual(selectProjectDocumentResources(state, "2"), [])

  const crossProjectReference = {
    ...state,
    projectsById: {
      ...state.projectsById,
      "2": {
        ...state.projectsById["2"],
        resourceIds: ["resource-1-document"],
      },
    },
  }

  assert.deepEqual(
    selectProjectDocumentResources(crossProjectReference, "2"),
    []
  )
})
