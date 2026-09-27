import assert from "node:assert/strict"
import test from "node:test"

import { createProjectStore } from "./store.ts"

test("exports a versioned backup and restores all data without store actions", () => {
  const source = createProjectStore()
  assert.equal(typeof source.getState().exportBackup, "function")
  const backup = source.getState().exportBackup()
  const payload = JSON.parse(backup)
  assert.equal(payload.schemaVersion, 2)
  assert.equal(payload.app, "projeplano")
  assert.ok(payload.data.workspaceIds.length > 0)
  assert.equal("resetDemo" in payload.data, false)
  const target = createProjectStore()
  assert.equal(target.getState().importBackup(backup).ok, true)
  assert.deepEqual(JSON.parse(target.getState().exportBackup()).data, payload.data)
  assert.equal(typeof target.getState().createWorkItem, "function")
})

test("Table edits belong to a view and survive backup replacement", () => {
  const store = createProjectStore()
  assert.equal(typeof store.getState().updateTable, "function")
  const view = Object.values(store.getState().projectViewsById).find(v => v.type === "table")
  assert.equal(store.getState().updateTable(view.id, table => ({
    ...table,
    rows: [{ id: "my-row", cells: { name: "Saved table edit" } }],
  })), true)
  const backup = store.getState().exportBackup()
  store.getState().resetDemo()
  assert.equal(store.getState().importBackup(backup).ok, true)
  assert.equal(store.getState().tablesByViewId[view.id].rows[0].cells.name, "Saved table edit")
  assert.equal(store.getState().updateTable("missing", t => t), false)
})

test("invalid imports never replace existing records or actions", () => {
  const store = createProjectStore()
  assert.equal(typeof store.getState().importBackup, "function")
  const before = store.getState()
  for (const value of ["{", "null", "[]", '{"schemaVersion":999}']) {
    assert.equal(store.getState().importBackup(value).ok, false)
    assert.equal(store.getState(), before)
  }
})

const invalidBackups = {
  "unknown version": backup => { backup.schemaVersion = 999 },
  "missing workspace record": backup => { delete backup.data.workspacesById["project-alpha"] },
  "duplicate workspace": backup => { backup.data.workspaceIds.push(backup.data.workspaceIds[0]) },
  "unlisted workspace": backup => { backup.data.workspaceIds.pop() },
  "mismatched workspace ID": backup => { backup.data.workspacesById["project-alpha"].id = "wrong" },
  "invalid workspace date": backup => { backup.data.workspacesById["project-alpha"].createdAt = "2026-02-30" },
  "invalid archive value": backup => { backup.data.projectsById["2"].archived = "yes" },
  "foreign workspace": backup => { backup.data.projectsById["2"].workspaceId = "missing" },
  "orphan view": backup => { backup.data.projectsById["2"].viewIds = [] },
  "mismatched identity": backup => { backup.data.projectsById["2"].id = "wrong" },
  "wrong task shape": backup => { Object.values(backup.data.workItemsById)[0].title = null },
  "foreign board": backup => { Object.values(backup.data.workItemsById)[0].boardId = "missing" },
  "missing label": backup => { Object.values(backup.data.workItemsById)[0].labelIds = ["missing"] },
  "missing document": backup => { Object.values(backup.data.workItemsById)[0].linkedResourceIds = ["missing"] },
  "dependency cycle": backup => {
    const [a, b] = Object.values(backup.data.workItemsById).filter(t => t.projectId === "2")
    a.dependencyIds = [b.id]
    b.dependencyIds = [a.id]
  },
  "foreign dependency": backup => {
    const tasks = Object.values(backup.data.workItemsById)
    tasks[0].dependencyIds = [tasks.find(t => t.projectId !== tasks[0].projectId).id]
  },
  "duplicate label": backup => {
    const board = Object.values(backup.data.projectViewsById).find(v => v.type === "board")
    board.labels.push(board.labels[0])
  },
  "extra store action": backup => { backup.data.resetDemo = "unsafe" },
  "missing Table snapshot": backup => { backup.data.tablesByViewId = {} },
  "foreign Table": backup => { backup.data.tablesByViewId.missing = Object.values(backup.data.tablesByViewId)[0] },
  "unsafe attachment": backup => {
    Object.values(backup.data.tablesByViewId)[0].rows[0].cells.attachments = [
      { id: "a", name: "Bad link", type: "", url: "javascript:alert(1)", kind: "link" },
    ]
  },
}

for (const [name, mutate] of Object.entries(invalidBackups)) {
  test(`rejects ${name} without changing state`, () => {
    const store = createProjectStore()
    const backup = JSON.parse(store.getState().exportBackup())
    mutate(backup)
    const before = store.getState()
    assert.equal(store.getState().importBackup(JSON.stringify(backup)).ok, false)
    assert.equal(store.getState(), before)
  })
}

test("replaces data in one notification, detaches preview data, and removes newer records", () => {
  const store = createProjectStore()
  const backup = store.getState().exportBackup()
  assert.equal(store.getState().createProjectFromTemplate({
    id: "new-project", workspaceId: "project-alpha", templateId: "empty-project",
    title: "After the backup", description: "",
  }), true)
  let changes = 0
  const unsubscribe = store.subscribe(() => { changes++ })
  const result = store.getState().importBackup(backup)
  assert.equal(result.ok, true)
  assert.equal(changes, 1)
  assert.equal(store.getState().projectsById["new-project"], undefined)
  result.data.projectsById["2"].title = "Mutated preview"
  assert.notEqual(store.getState().projectsById["2"].title, "Mutated preview")
  unsubscribe()
})

test("round trips created projects, repeated Tables, file bytes, saved documents and relationships", () => {
  const store = createProjectStore()
  assert.equal(store.getState().createProjectFromTemplate({
    id: "personal", workspaceId: "project-beta", templateId: "web-application",
    title: "Personal project", description: "My work",
  }), true)
  assert.equal(store.getState().addProjectView({ id: "extra-table", projectId: "personal", type: "table" }), true)
  assert.equal(store.getState().updateTable("extra-table", table => ({ ...table,
    rows: [{ id: "own-row", cells: { name: "My file", attachments: [{
      id: "attachment", kind: "file", name: "a.txt", type: "text/plain",
      url: "data:application/octet-stream;base64,aGVsbG8=",
    }] } }],
  })), true)
  assert.equal(store.getState().saveProjectDocument("resource-personal-document", "<p>My saved notes</p>"), true)
  assert.equal(store.getState().createAndLinkWorkItemDocument({
    id: "task-notes", workItemId: "work-item-2-audit-onboarding", title: "Task notes",
  }), true)
  const text = store.getState().exportBackup()
  const fresh = createProjectStore()
  assert.equal(fresh.getState().projectsById.personal, undefined)
  assert.equal(fresh.getState().importBackup(text).ok, true)
  assert.deepEqual(JSON.parse(fresh.getState().exportBackup()).data, JSON.parse(text).data)
  assert.equal(fresh.getState().tablesByViewId["view-personal-table"].rows.length, 3)
  assert.equal(fresh.getState().tablesByViewId["extra-table"].rows.length, 1)
  assert.equal(fresh.getState().saveProjectDocument("resource-personal-document", "<p>Continued after import</p>"), true)
})
