import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { WORKSPACES } from "../workspace/mock-data.ts"
import { createProjectSeedState } from "./seed-data.ts"
import { selectWorkspaceById, selectWorkspaces } from "./selectors.ts"

const workspace = {
  id: "personal-workspace", title: " My workspace ",
  description: " My notes ", createdAt: "2026-09-27",
}

test("creates and edits workspace records without changing their identity or creation date", () => {
  const store = createProjectStore()
  assert.equal(typeof store.getState().createWorkspace, "function")
  assert.equal(store.getState().createWorkspace(workspace), true)
  assert.equal(store.getState().workspacesById[workspace.id].title, "My workspace")
  assert.equal(store.getState().updateWorkspace(workspace.id, { title: "Renamed", description: "Updated" }), true)
  assert.deepEqual(store.getState().workspacesById[workspace.id], {
    ...workspace, title: "Renamed", description: "Updated",
  })
  const before = store.getState()
  assert.equal(store.getState().createWorkspace(workspace), false)
  assert.equal(store.getState().updateWorkspace(workspace.id, { title: " ", description: "" }), false)
  assert.equal(store.getState(), before)
})

test("creates projects only in an existing workspace", () => {
  const store = createProjectStore()
  const before = store.getState()
  assert.equal(store.getState().createProjectFromTemplate({
    id: "orphan", workspaceId: "missing", templateId: "empty-project", title: "Orphan", description: "",
  }), false)
  assert.equal(store.getState(), before)
})

test("edits, archives and restores projects while preserving their contents and status", () => {
  const store = createProjectStore()
  assert.equal(typeof store.getState().updateProject, "function")
  const tasks = store.getState().workItemsById
  assert.equal(store.getState().updateProject("2", { title: "Updated project", description: "Notes", status: "paused" }), true)
  assert.equal(store.getState().setProjectArchived("2", true), true)
  assert.equal(store.getState().projectsById["2"].archived, true)
  assert.equal(store.getState().setProjectArchived("2", false), true)
  assert.equal(store.getState().projectsById["2"].status, "paused")
  assert.equal(store.getState().workItemsById, tasks)
})

test("deletes a project and every owned record atomically without touching siblings", () => {
  const initial = createProjectSeedState()
  initial.milestonesById.release = {
    id: "release", projectId: "2", title: "Release", description: "", targetDate: null, status: "planned",
  }
  initial.projectsById["2"].milestoneIds = ["release"]
  initial.workItemsById["work-item-2-audit-onboarding"].milestoneId = "release"
  const store = createProjectStore(initial)
  assert.equal(typeof store.getState().deleteProject, "function")
  assert.equal(store.getState().addProjectView({ id: "owned-table", projectId: "2", type: "table" }), true)
  assert.equal(store.getState().createAndLinkWorkItemDocument({
    id: "owned-document", workItemId: "work-item-2-audit-onboarding", title: "Notes",
  }), true)
  const siblingTable = Object.values(store.getState().projectViewsById).find(view => view.type === "table" && view.projectId !== "2")
  const siblingSnapshot = store.getState().tablesByViewId[siblingTable.id]
  const sibling = store.getState().projectsById["6"]
  let notifications = 0
  store.subscribe(() => notifications++)
  assert.equal(store.getState().deleteProject("2"), true)
  assert.equal(notifications, 1)
  const state = store.getState()
  assert.equal(state.projectsById["2"], undefined)
  assert.equal(state.projectsById["6"], sibling)
  assert.equal(state.tablesByViewId["owned-table"], undefined)
  assert.equal(state.tablesByViewId[siblingTable.id], siblingSnapshot)
  for (const records of [state.projectViewsById, state.taskBoardsById, state.workItemsById, state.resourcesById, state.milestonesById]) {
    assert.equal(Object.values(records).some(record => record.projectId === "2"), false)
  }
  assert.equal(state.projectIdsByWorkspaceId["project-alpha"].includes("2"), false)
  assert.equal(state.importBackup(state.exportBackup()).ok, true)
})

test("workspace deletion removes all children, including Tables, and leaves a valid backup", () => {
  const store = createProjectStore()
  assert.equal(typeof store.getState().deleteWorkspace, "function")
  const preserved = store.getState().workspacesById["project-beta"]
  assert.equal(store.getState().deleteWorkspace("project-alpha"), true)
  const state = store.getState()
  assert.equal(state.workspaceIds.includes("project-alpha"), false)
  assert.equal(state.projectIdsByWorkspaceId["project-alpha"], undefined)
  for (const records of [state.projectsById, state.projectViewsById, state.taskBoardsById, state.workItemsById, state.resourcesById, state.milestonesById, state.tablesByViewId]) {
    assert.deepEqual(Object.keys(records), [])
  }
  assert.equal(state.workspacesById["project-beta"], preserved)
  assert.equal(state.importBackup(state.exportBackup()).ok, true)
})

test("imports a version 1 backup and defaults projects to unarchived", () => {
  const store = createProjectStore()
  const old = JSON.parse(store.getState().exportBackup())
  old.schemaVersion = 1
  old.workspaces = WORKSPACES
  delete old.data.workspaceIds
  delete old.data.workspacesById
  for (const project of Object.values(old.data.projectsById)) delete project.archived
  assert.equal(store.getState().importBackup(JSON.stringify(old)).ok, true)
  assert.deepEqual(store.getState().workspaceIds, WORKSPACES.map(w => w.id))
  assert.equal(store.getState().projectsById["2"].archived, false)
})

test("backs up custom workspaces and archived projects, then restores their full contents", () => {
  const store = createProjectStore()
  assert.equal(store.getState().createWorkspace(workspace), true)
  assert.equal(store.getState().createProjectFromTemplate({
    id: "custom-project", workspaceId: workspace.id, templateId: "web-application", title: "Custom", description: "",
  }), true)
  store.getState().setProjectArchived("custom-project", true)
  const backup = store.getState().exportBackup()
  const expected = JSON.parse(backup).data
  store.getState().deleteWorkspace(workspace.id)
  assert.equal(store.getState().importBackup(backup).ok, true)
  assert.deepEqual(JSON.parse(store.getState().exportBackup()).data, expected)
  assert.equal(store.getState().setProjectArchived("custom-project", false), true)
  assert.equal(store.getState().projectsById["custom-project"].status, "planned")
})

test("rejects missing identities, invalid input and no-op lifecycle actions without notification", () => {
  const store = createProjectStore()
  const before = store.getState()
  let changes = 0
  store.subscribe(() => changes++)
  for (const id of ["missing", "__proto__", "constructor"]) {
    assert.equal(store.getState().updateWorkspace(id, { title: "Name", description: "" }), false)
    assert.equal(store.getState().deleteWorkspace(id), false)
    assert.equal(store.getState().updateProject(id, { title: "Name", description: "", status: "active" }), false)
    assert.equal(store.getState().setProjectArchived(id, true), false)
    assert.equal(store.getState().deleteProject(id), false)
  }
  assert.equal(store.getState().createWorkspace({ ...workspace, id: "__proto__" }), false)
  assert.equal(store.getState().createWorkspace({ ...workspace, createdAt: "2026-02-30" }), false)
  assert.equal(store.getState().setProjectArchived("2", "yes"), false)
  assert.equal(store.getState().setProjectArchived("2", false), false)
  assert.equal(store.getState().updateProject("2", { ...before.projectsById["2"], status: "invalid" }), false)
  assert.equal(store.getState().updateProject("2", before.projectsById["2"]), false)
  assert.equal(store.getState().updateWorkspace("project-alpha", before.workspacesById["project-alpha"]), false)
  assert.equal(changes, 0)
  assert.equal(store.getState(), before)
})

test("deleting the last workspace leaves a valid empty snapshot", () => {
  const store = createProjectStore()
  for (const id of [...store.getState().workspaceIds]) assert.equal(store.getState().deleteWorkspace(id), true)
  assert.deepEqual(store.getState().workspaceIds, [])
  assert.equal(store.getState().importBackup(store.getState().exportBackup()).ok, true)
  assert.equal(store.getState().createWorkspace(workspace), true)
})

test("workspace selectors return live records in order and reject inherited properties", () => {
  const store = createProjectStore()
  const first = selectWorkspaces(store.getState())
  assert.equal(first[0], store.getState().workspacesById[first[0].id])
  assert.equal(selectWorkspaceById(store.getState(), "constructor"), null)
  assert.equal(selectWorkspaceById(store.getState(), "missing"), null)
  store.getState().createWorkspace(workspace)
  assert.equal(selectWorkspaces(store.getState()).at(-1).id, workspace.id)
  store.getState().updateWorkspace(workspace.id, { title: "Latest", description: "" })
  assert.equal(selectWorkspaceById(store.getState(), workspace.id).title, "Latest")
})
