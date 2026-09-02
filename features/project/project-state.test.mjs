import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  addProjectDocumentState,
  addProjectViewState,
  createProjectFromTemplateState,
  getProjectDocumentResourceId,
} from "./project-state.ts"
import { PROJECT_TEMPLATES } from "./templates.ts"

test("exposes exactly the five approved Phase 2 templates", () => {
  assert.deepEqual(
    PROJECT_TEMPLATES.map((template) => template.id),
    [
      "web-application",
      "mobile-application",
      "api-service",
      "landing-page",
      "empty-project",
    ]
  )
})

for (const template of PROJECT_TEMPLATES) {
  test("creates the " + template.name + " template atomically", () => {
    const state = createProjectSeedState()
    const projectId = "created-" + template.id
    const next = createProjectFromTemplateState(state, {
      id: projectId,
      workspaceId: "project-beta",
      templateId: template.id,
      title: "  New project  ",
      description: "  Frontend planning workspace  ",
    })

    assert.notStrictEqual(next, state)
    assert.equal(state.projectsById[projectId], undefined)

    const project = next.projectsById[projectId]
    assert.ok(project)
    assert.equal(project.workspaceId, "project-beta")
    assert.equal(project.title, "New project")
    assert.equal(project.description, "Frontend planning workspace")
    assert.equal(project.templateId, template.id)
    assert.equal(project.status, "planned")
    assert.deepEqual(project.milestoneIds, [])
    assert.equal(
      next.projectIdsByWorkspaceId["project-beta"].at(-1),
      projectId
    )
    assert.equal(
      Object.keys(next.projectViewsById).length,
      Object.keys(state.projectViewsById).length + template.viewTypes.length
    )
    assert.equal(
      Object.keys(next.resourcesById).length,
      Object.keys(state.resourcesById).length +
        (template.documentTitle ? 1 : 0)
    )
    assert.strictEqual(next.workItemsById, state.workItemsById)
    assert.strictEqual(next.milestonesById, state.milestonesById)

    assert.deepEqual(
      project.viewIds.map((viewId) => next.projectViewsById[viewId].type),
      template.viewTypes
    )

    if (template.documentTitle) {
      assert.deepEqual(project.resourceIds, [
        getProjectDocumentResourceId(projectId),
      ])
      assert.deepEqual(next.resourcesById[project.resourceIds[0]], {
        id: getProjectDocumentResourceId(projectId),
        projectId,
        title: template.documentTitle,
        type: "document",
        templateId: null,
        isPinned: true,
      })
    } else {
      assert.deepEqual(project.resourceIds, [])
    }
  })
}

test("rejects invalid project creation without mutating state", () => {
  const state = createProjectSeedState()
  const validInput = {
    id: "project-new",
    workspaceId: "project-beta",
    templateId: "web-application",
    title: "New project",
    description: "",
  }

  const invalidInputs = [
    { ...validInput, id: " " },
    { ...validInput, id: "1" },
    { ...validInput, workspaceId: " " },
    { ...validInput, templateId: "unknown-template" },
    { ...validInput, title: "   " },
  ]

  for (const input of invalidInputs) {
    assert.strictEqual(createProjectFromTemplateState(state, input), state)
  }
})

test("rejects project creation when a generated child ID collides", () => {
  const state = createProjectSeedState()
  const collidedState = {
    ...state,
    projectViewsById: {
      ...state.projectViewsById,
      "view-project-new-board": {
        id: "view-project-new-board",
        projectId: "2",
        title: "Existing collision",
        type: "board",
        visibleFieldIds: [],
        groupBy: "status",
        filterIds: [],
      },
    },
  }

  assert.strictEqual(
    createProjectFromTemplateState(collidedState, {
      id: "project-new",
      workspaceId: "project-beta",
      templateId: "web-application",
      title: "New project",
      description: "",
    }),
    collidedState
  )
})

test("adds one missing supported view and rejects duplicates", () => {
  const state = createProjectSeedState()
  const next = addProjectViewState(state, "1", "board")

  assert.notStrictEqual(next, state)
  assert.deepEqual(next.projectsById["1"].viewIds, ["view-1-board"])
  assert.equal(next.projectViewsById["view-1-board"].type, "board")
  assert.strictEqual(addProjectViewState(next, "1", "board"), next)
  assert.strictEqual(addProjectViewState(next, "1", "timeline"), next)
  assert.strictEqual(addProjectViewState(next, "unknown", "table"), next)
})

test("rejects adding a view when its deterministic ID already exists", () => {
  const state = createProjectSeedState()
  const collidedState = {
    ...state,
    projectViewsById: {
      ...state.projectViewsById,
      "view-1-board": {
        id: "view-1-board",
        projectId: "2",
        title: "Existing collision",
        type: "board",
        visibleFieldIds: [],
        groupBy: "status",
        filterIds: [],
      },
    },
  }

  assert.strictEqual(
    addProjectViewState(collidedState, "1", "board"),
    collidedState
  )
})

test("adds one pinned blank Document and rejects duplicates", () => {
  const state = createProjectSeedState()
  const next = addProjectDocumentState(state, "2")
  const resourceId = getProjectDocumentResourceId("2")

  assert.notStrictEqual(next, state)
  assert.deepEqual(next.projectsById["2"].resourceIds, [resourceId])
  assert.deepEqual(next.resourcesById[resourceId], {
    id: resourceId,
    projectId: "2",
    title: "Project notes",
    type: "document",
    templateId: null,
    isPinned: true,
  })
  assert.strictEqual(addProjectDocumentState(next, "2"), next)
  assert.strictEqual(addProjectDocumentState(state, "1"), state)
  assert.strictEqual(
    addProjectDocumentState(state, "unknown-project"),
    state
  )
})

test("rejects adding a Document when its deterministic ID collides", () => {
  const state = createProjectSeedState()
  const resourceId = getProjectDocumentResourceId("2")
  const collidedState = {
    ...state,
    resourcesById: {
      ...state.resourcesById,
      [resourceId]: {
        id: resourceId,
        projectId: "1",
        title: "Existing collision",
        type: "document",
        templateId: null,
        isPinned: false,
      },
    },
  }

  assert.strictEqual(
    addProjectDocumentState(collidedState, "2"),
    collidedState
  )
})
