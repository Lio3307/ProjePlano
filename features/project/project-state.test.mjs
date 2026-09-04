import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  addProjectDocumentState,
  addProjectViewState,
  addTaskBoardState,
  createFirstTaskBoardState,
  createProjectFromTemplateState,
  getProjectDocumentResourceId,
  saveProjectDocumentState,
  updateBoardLabelsState,
  updateTaskBoardState,
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
        content: "",
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
        description: "",
        labels: [],
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

test("adds repeated generic views with numbered titles", () => {
  const state = createProjectSeedState()
  const firstInput = {
    id: "view-1-table-custom-1",
    projectId: "1",
    type: "table",
  }
  const secondInput = {
    id: "view-1-table-custom-2",
    projectId: "1",
    type: "table",
  }
  const first = addProjectViewState(state, firstInput)
  const second = addProjectViewState(first, secondInput)

  assert.notStrictEqual(first, state)
  assert.notStrictEqual(second, first)
  assert.deepEqual(state.projectsById["1"].viewIds, [])
  assert.deepEqual(second.projectsById["1"].viewIds, [
    firstInput.id,
    secondInput.id,
  ])
  assert.equal(second.projectViewsById[firstInput.id].id, firstInput.id)
  assert.equal(second.projectViewsById[firstInput.id].projectId, "1")
  assert.equal(second.projectViewsById[firstInput.id].title, "Table")
  assert.equal(second.projectViewsById[firstInput.id].type, "table")
  assert.equal(second.projectViewsById[secondInput.id].title, "Table 2")
  assert.equal(second.projectViewsById[secondInput.id].type, "table")
})

test("rejects invalid view creation without mutating state", () => {
  const state = createProjectSeedState()
  const valid = {
    id: "view-1-table-custom",
    projectId: "1",
    type: "table",
  }

  for (const input of [
    { ...valid, id: " " },
    { ...valid, id: " view-1-table-custom " },
    { ...valid, id: "view-3-table" },
    { ...valid, projectId: "unknown" },
    { ...valid, type: "board" },
    { ...valid, type: "timeline" },
  ]) {
    assert.strictEqual(addProjectViewState(state, input), state)
  }
})

test("creates the first Board view and exactly one Board atomically", () => {
  const state = createProjectSeedState()
  const input = {
    viewId: "view-1-board",
    board: {
      id: "task-board-1-todo",
      projectId: "1",
      title: " Todo ",
      description: " Ready to start ",
      stage: "todo",
    },
  }
  const next = createFirstTaskBoardState(state, input)

  assert.notStrictEqual(next, state)
  assert.deepEqual(next.projectsById["1"].viewIds, [input.viewId])
  assert.deepEqual(next.projectViewsById[input.viewId].boardIds, [
    input.board.id,
  ])
  assert.deepEqual(next.projectViewsById[input.viewId].labels, [])
  assert.deepEqual(next.taskBoardsById[input.board.id], {
    id: input.board.id,
    projectId: "1",
    viewId: input.viewId,
    title: "Todo",
    description: "Ready to start",
    stage: "todo",
    position: 0,
  })
  assert.strictEqual(next.workItemsById, state.workItemsById)
})

test("adds exactly one Board to an existing Kanban view", () => {
  const state = createProjectSeedState()
  const view = state.projectViewsById["view-2-board"]
  const input = {
    id: "task-board-2-blocked",
    projectId: "2",
    viewId: view.id,
    title: " Blocked ",
    description: " Needs attention ",
    stage: "review",
  }
  const next = addTaskBoardState(state, input)

  assert.notStrictEqual(next, state)
  assert.deepEqual(next.projectViewsById[view.id].boardIds, [
    ...view.boardIds,
    input.id,
  ])
  assert.deepEqual(next.taskBoardsById[input.id], {
    ...input,
    title: "Blocked",
    description: "Needs attention",
    position: view.boardIds.length,
  })
  assert.equal(
    Object.keys(next.taskBoardsById).length,
    Object.keys(state.taskBoardsById).length + 1
  )
})

test("rejects invalid or duplicate Board creation without mutation", () => {
  const state = createProjectSeedState()
  const valid = {
    id: "task-board-2-blocked",
    projectId: "2",
    viewId: "view-2-board",
    title: "Blocked",
    description: "",
    stage: "review",
  }

  for (const input of [
    { ...valid, id: " " },
    { ...valid, id: " task-board-2-blocked " },
    { ...valid, projectId: "missing" },
    { ...valid, viewId: "view-3-table" },
    { ...valid, title: "   " },
    { ...valid, stage: "blocked" },
  ]) {
    assert.strictEqual(addTaskBoardState(state, input), state)
  }

  const created = addTaskBoardState(state, valid)
  assert.notStrictEqual(created, state)
  assert.strictEqual(addTaskBoardState(created, valid), created)
  assert.strictEqual(
    addTaskBoardState(created, {
      ...valid,
      id: "task-board-2-blocked-copy",
      title: " BLOCKED ",
    }),
    created
  )
})

test("updates Board settings and preserves ordered ownership", () => {
  const state = createProjectSeedState()
  const board = state.taskBoardsById["task-board-2-todo"]
  const next = updateTaskBoardState(state, {
    boardId: board.id,
    title: " Ready ",
    description: " Available work ",
    stage: "backlog",
  })

  assert.notStrictEqual(next, state)
  assert.deepEqual(next.taskBoardsById[board.id], {
    ...board,
    title: "Ready",
    description: "Available work",
    stage: "backlog",
  })
  assert.deepEqual(
    next.projectViewsById[board.viewId].boardIds,
    state.projectViewsById[board.viewId].boardIds
  )
  assert.strictEqual(
    updateTaskBoardState(next, {
      boardId: board.id,
      title: " Ready ",
      description: " Available work ",
      stage: "backlog",
    }),
    next
  )

  const inconsistent = {
    ...state,
    taskBoardsById: {
      ...state.taskBoardsById,
      [board.id]: { ...board, projectId: "3" },
    },
  }

  assert.strictEqual(
    updateTaskBoardState(inconsistent, {
      boardId: board.id,
      title: "Ready",
      description: "Available work",
      stage: "backlog",
    }),
    inconsistent
  )
})

test("shares labels across every Board and clears removed IDs atomically", () => {
  const state = createProjectSeedState()
  const view = state.projectViewsById["view-2-board"]
  const removedLabel = view.labels[0]
  const keptLabel = view.labels[1]
  const siblingItemId = "work-item-2-sibling"
  const withSiblingItem = {
    ...state,
    workItemsById: {
      ...state.workItemsById,
      [siblingItemId]: {
        ...state.workItemsById["work-item-2-workspace-filters"],
        id: siblingItemId,
        labelIds: [removedLabel.id],
      },
    },
  }
  const next = updateBoardLabelsState(withSiblingItem, {
    viewId: view.id,
    labels: view.labels.slice(1),
  })

  assert.notStrictEqual(next, withSiblingItem)
  assert.deepEqual(next.projectViewsById[view.id].labels[0], keptLabel)
  assert.deepEqual(
    next.workItemsById["work-item-2-audit-onboarding"].labelIds,
    [keptLabel.id]
  )
  assert.deepEqual(next.workItemsById[siblingItemId].labelIds, [])
})

test("keeps label IDs on rename and rejects invalid or equivalent catalogs", () => {
  const state = createProjectSeedState()
  const view = state.projectViewsById["view-2-board"]
  const renamedLabels = view.labels.map((label, index) =>
    index === 0
      ? { ...label, name: " Discovery ", color: "red" }
      : label
  )
  const renamed = updateBoardLabelsState(state, {
    viewId: view.id,
    labels: renamedLabels,
  })

  assert.deepEqual(
    renamed.workItemsById["work-item-2-audit-onboarding"].labelIds,
    state.workItemsById["work-item-2-audit-onboarding"].labelIds
  )
  assert.equal(renamed.projectViewsById[view.id].labels[0].id, view.labels[0].id)
  assert.equal(renamed.projectViewsById[view.id].labels[0].name, "Discovery")
  assert.strictEqual(
    updateBoardLabelsState(renamed, {
      viewId: view.id,
      labels: renamed.projectViewsById[view.id].labels,
    }),
    renamed
  )
  assert.strictEqual(
    updateBoardLabelsState(state, {
      viewId: view.id,
      labels: [{ id: " ", name: "Invalid", color: "gray" }],
    }),
    state
  )
  assert.strictEqual(
    updateBoardLabelsState(state, {
      viewId: view.id,
      labels: [
        { id: "label-a", name: "Same", color: "gray" },
        { id: "label-b", name: " same ", color: "blue" },
      ],
    }),
    state
  )
})

test("adds multiple documents to an existing project", () => {
  const state = createProjectSeedState()
  const initialCount = state.projectsById["1"].resourceIds.length
  const input = {
    id: "resource-1-document-release-notes",
    projectId: "1",
    title: "  Release notes  ",
  }
  const next = addProjectDocumentState(state, input)

  assert.notStrictEqual(next, state)
  assert.equal(next.projectsById["1"].resourceIds.at(-1), input.id)
  assert.deepEqual(next.resourcesById[input.id], {
    id: input.id,
    projectId: "1",
    title: "Release notes",
    type: "document",
    templateId: null,
    isPinned: false,
    content: "",
  })

  const third = addProjectDocumentState(next, {
    id: "resource-1-document-runbook",
    projectId: "1",
    title: "Runbook",
  })

  assert.equal(
    third.projectsById["1"].resourceIds.length,
    initialCount + 2
  )
})

test("rejects invalid document creation without mutation", () => {
  const state = createProjectSeedState()
  const valid = {
    id: "resource-2-document-notes",
    projectId: "2",
    title: "Notes",
  }

  for (const input of [
    { ...valid, id: " " },
    { ...valid, id: "resource-1-document" },
    { ...valid, projectId: "missing" },
    { ...valid, title: "   " },
  ]) {
    assert.strictEqual(addProjectDocumentState(state, input), state)
  }
})

test("saves only changed document content", () => {
  const state = createProjectSeedState()
  const resourceId = "resource-1-document"
  const content = "<h1>Updated API design</h1>"
  const next = saveProjectDocumentState(state, resourceId, content)

  assert.notStrictEqual(next, state)
  assert.equal(next.resourcesById[resourceId].content, content)
  assert.strictEqual(
    saveProjectDocumentState(next, resourceId, content),
    next
  )
  assert.strictEqual(
    saveProjectDocumentState(next, "missing-resource", content),
    next
  )

  const canvasId = "resource-1-canvas"
  const stateWithCanvas = {
    ...next,
    resourcesById: {
      ...next.resourcesById,
      [canvasId]: {
        id: canvasId,
        projectId: "1",
        title: "Architecture canvas",
        type: "canvas",
        templateId: null,
        isPinned: false,
      },
    },
  }

  assert.strictEqual(
    saveProjectDocumentState(stateWithCanvas, canvasId, content),
    stateWithCanvas
  )
})
