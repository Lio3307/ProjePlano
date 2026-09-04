import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  selectDocumentLinkedWorkItems,
  selectBoardWorkItems,
  selectProjectById,
  selectProjectBoardView,
  selectProjectDocumentResources,
  selectProjectForWorkspace,
  selectProjectMilestones,
  selectProjectResolvedWorkItems,
  selectProjectResources,
  selectProjectsByWorkspaceId,
  selectSupportedProjectViews,
  selectProjectViews,
  selectProjectWorkItems,
  selectTaskBoard,
  selectTaskBoards,
  selectWorkspaceMembers,
  selectWorkspaceMembersById,
  selectWorkspaceWorkItemAssignments,
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

test("selects ordered members only from their workspace", () => {
  const state = createProjectSeedState()
  const members = selectWorkspaceMembers(state, "project-alpha")
  const membersById = selectWorkspaceMembersById(
    state,
    "project-alpha"
  )

  assert.equal(members[0].name, "Aurelio")
  assert.equal(members.some((member) => member.name === "Maya Chen"), true)
  assert.equal(members.some((member) => member.name === "Sari"), false)
  assert.deepEqual(Object.keys(membersById), members.map((member) => member.id))
  assert.deepEqual(selectWorkspaceMembers(state, "missing"), [])
})

test("selects work items through their owning workspace", () => {
  const state = createProjectSeedState()
  const assignments = selectWorkspaceWorkItemAssignments(
    state,
    "project-alpha"
  )

  assert.equal(assignments.length > 0, true)
  assert.equal(
    assignments.every(
      (assignment) =>
        state.projectsById[assignment.projectId].workspaceId ===
        "project-alpha"
    ),
    true
  )
  assert.equal(
    assignments.every((assignment) => assignment.stage.length > 0),
    true
  )
  assert.deepEqual(
    selectWorkspaceWorkItemAssignments(state, "missing"),
    []
  )
})

test("resolves ordered views, resources, and milestones by project", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    selectProjectViews(state, "2").map((view) => view.type),
    ["board"]
  )
  assert.deepEqual(
    selectProjectResources(state, "1").map((resource) => resource.type),
    ["document", "document", "document"]
  )
  assert.deepEqual(selectProjectMilestones(state, "2"), [])
})

test("sorts project aggregates by ordered Boards and Board positions", () => {
  const state = createProjectSeedState()
  const projectItems = selectProjectWorkItems(state, "2")
  const resolvedItems = selectProjectResolvedWorkItems(state, "2")
  const boards = selectTaskBoards(state, "2", "view-2-board")
  const todoItems = selectBoardWorkItems(
    state,
    "2",
    "task-board-2-todo"
  )

  assert.deepEqual(
    projectItems.slice(0, 2).map((workItem) => workItem.id),
    ["work-item-2-audit-onboarding", "work-item-2-api-error-model"]
  )
  assert.deepEqual(
    resolvedItems.slice(0, 2).map(({ stage }) => stage),
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
  assert.deepEqual(
    boards.map((board) => board.title),
    ["Backlog", "To Do", "In Progress", "Review", "Testing", "Done"]
  )
  assert.equal(
    selectProjectBoardView(state, "2", "view-2-board")?.type,
    "board"
  )
  assert.equal(
    selectTaskBoard(state, "2", "task-board-2-todo")?.stage,
    "todo"
  )
})

test("Board selectors cannot leak tasks from sibling Boards", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    selectBoardWorkItems(
      state,
      "2",
      "task-board-2-todo"
    ).map((workItem) => workItem.id),
    ["work-item-2-workspace-filters", "work-item-2-release-checklist"]
  )
  assert.deepEqual(
    selectBoardWorkItems(state, "2", "task-board-2-backlog").map(
      (workItem) => workItem.id
    ),
    ["work-item-2-audit-onboarding", "work-item-2-api-error-model"]
  )
  assert.equal(selectTaskBoard(state, "2", "view-3-table"), null)
  assert.equal(selectTaskBoard(state, "4", "task-board-2-todo"), null)
})

test("project selectors ignore same-project Board map orphans", () => {
  const state = createProjectSeedState()
  const boardId = "task-board-2-orphan"
  const workItemId = "work-item-2-orphan"
  const withOrphans = {
    ...state,
    taskBoardsById: {
      ...state.taskBoardsById,
      [boardId]: {
        ...state.taskBoardsById["task-board-2-todo"],
        id: boardId,
        title: "Unlisted Board",
      },
    },
    workItemsById: {
      ...state.workItemsById,
      [workItemId]: {
        ...state.workItemsById["work-item-2-audit-onboarding"],
        id: workItemId,
        boardId,
        title: "Unlisted Board task",
      },
    },
  }

  assert.equal(selectTaskBoard(withOrphans, "2", boardId), null)
  assert.equal(
    selectProjectWorkItems(withOrphans, "2").some(
      (workItem) => workItem.id === workItemId
    ),
    false
  )
  assert.equal(
    selectProjectWorkItems(withOrphans, "2").some(
      (workItem) => workItem.id === "work-item-2-audit-onboarding"
    ),
    true
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

test("selects only supported work views and document resources", () => {
  const state = createProjectSeedState()

  assert.deepEqual(
    selectSupportedProjectViews(state, "2").map((view) => view.type),
    ["board"]
  )
  assert.deepEqual(
    selectProjectDocumentResources(state, "1").map(
      (resource) => resource.id
    ),
    [
      "resource-1-document",
      "resource-1-endpoint-guidelines",
      "resource-1-decision-log",
    ]
  )
  assert.equal(
    selectProjectDocumentResources(state, "1")[1].content,
    "<h1>Endpoint guidelines</h1><p>Keep routes predictable and errors consistent.</p>"
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

test("selects ordered document backlinks across owned Boards", () => {
  const state = createProjectSeedState()
  const resourceId = "resource-2-document"
  const primaryItemId = "work-item-2-audit-onboarding"
  const siblingItemId = "work-item-2-workspace-filters"
  const invalidItemId = "work-item-2-invalid-board"
  const foreignItemId = "work-item-3-foreign-link"

  state.projectsById["2"] = {
    ...state.projectsById["2"],
    resourceIds: [resourceId],
  }
  state.resourcesById[resourceId] = {
    id: resourceId,
    projectId: "2",
    title: "Release plan",
    type: "document",
    templateId: null,
    isPinned: false,
    content: "<h1>Release plan</h1>",
  }
  state.workItemsById[primaryItemId] = {
    ...state.workItemsById[primaryItemId],
    linkedResourceIds: [resourceId, "resource-1-document"],
  }
  state.workItemsById[siblingItemId] = {
    ...state.workItemsById[siblingItemId],
    linkedResourceIds: [resourceId],
  }
  state.workItemsById[invalidItemId] = {
    ...state.workItemsById[siblingItemId],
    id: invalidItemId,
    boardId: "missing-board",
    title: "Ignore inconsistent task",
    position: 0,
  }
  state.workItemsById[foreignItemId] = {
    ...state.workItemsById[primaryItemId],
    id: foreignItemId,
    projectId: "3",
    boardId: "task-board-2-backlog",
    title: "Ignore cross-project task",
  }

  assert.deepEqual(
    selectDocumentLinkedWorkItems(state, "2", resourceId),
    [
      {
        boardViewId: "view-2-board",
        boardId: "task-board-2-backlog",
        boardTitle: "Backlog",
        workItemId: primaryItemId,
        workItemTitle: "Audit the onboarding flow",
      },
      {
        boardViewId: "view-2-board",
        boardId: "task-board-2-todo",
        boardTitle: "To Do",
        workItemId: siblingItemId,
        workItemTitle: "Build workspace filters",
      },
    ]
  )
  assert.deepEqual(
    selectDocumentLinkedWorkItems(state, "2", "resource-1-document"),
    []
  )
  assert.deepEqual(
    selectDocumentLinkedWorkItems(state, "2", "missing-document"),
    []
  )

  state.resourcesById["resource-2-unlisted"] = {
    ...state.resourcesById[resourceId],
    id: "resource-2-unlisted",
  }
  assert.deepEqual(
    selectDocumentLinkedWorkItems(state, "2", "resource-2-unlisted"),
    []
  )
})

test("caches nested derived results for one immutable store snapshot", () => {
  const state = createProjectSeedState()

  const resolvedWorkItems = selectProjectResolvedWorkItems(state, "2")
  const assignments = selectWorkspaceWorkItemAssignments(
    state,
    "project-alpha"
  )
  const documentLinks = selectDocumentLinkedWorkItems(
    state,
    "1",
    "resource-1-document"
  )

  assert.strictEqual(
    selectProjectResolvedWorkItems(state, "2"),
    resolvedWorkItems
  )
  assert.strictEqual(
    selectWorkspaceWorkItemAssignments(state, "project-alpha"),
    assignments
  )
  assert.strictEqual(
    selectDocumentLinkedWorkItems(
      state,
      "1",
      "resource-1-document"
    ),
    documentLinks
  )

  const nextState = { ...state }

  assert.notStrictEqual(
    selectProjectResolvedWorkItems(nextState, "2"),
    resolvedWorkItems
  )
})
