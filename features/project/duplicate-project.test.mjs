import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import { addProjectViewState } from "./project-state.ts"
import { duplicateProjectState } from "./duplicate-project.ts"
import { parseBackup, serializeBackup } from "./backup.ts"

function fixture() {
  let state = addProjectViewState(createProjectSeedState(), {
    id: "source-table", projectId: "2", type: "table",
  })
  state = structuredClone(state)
  state.projectsById["2"].archived = true
  state.projectsById["2"].resourceIds.push("source-document")
  state.resourcesById["source-document"] = {
    id: "source-document", projectId: "2", title: "Notes", type: "document",
    templateId: null, isPinned: true, content: "<p>Saved text</p>",
  }
  state.projectsById["2"].milestoneIds.push("source-milestone")
  state.milestonesById["source-milestone"] = {
    id: "source-milestone", projectId: "2", title: "Release", description: "Target",
    targetDate: "2026-10-12", status: "in-progress",
  }
  const task = state.workItemsById["work-item-2-workspace-filters"]
  task.linkedResourceIds = ["source-document"]
  task.milestoneId = "source-milestone"
  task.startDate = "2026-10-01"
  task.dueDate = "2026-10-12"
  state.tablesByViewId["source-table"].rows = [{
    id: "row", cells: { name: "Saved", attachments: [{
      id: "file", name: "notes.txt", type: "text/plain", kind: "file",
      url: "data:application/octet-stream;base64,aGVsbG8=",
    }] },
  }]
  assert.equal(parseBackup(serializeBackup(state)).ok, true)
  return state
}

function ids() {
  let index = 0
  return () => `copied-${++index}`
}

test("duplicates saved project records across workspaces with remapped relationships", () => {
  const source = fixture()
  const before = structuredClone(source)
  const next = duplicateProjectState(source, "2", "project-beta", "  Copied project  ", ids())
  assert.notEqual(next, source)
  assert.deepEqual(source, before)
  const copy = next.projectsById[next.projectIdsByWorkspaceId["project-beta"].at(-1)]
  assert.equal(copy.title, "Copied project")
  assert.equal(copy.workspaceId, "project-beta")
  assert.equal(copy.archived, false)
  assert.equal(copy.description, before.projectsById["2"].description)
  assert.equal(copy.status, before.projectsById["2"].status)
  assert.equal(copy.viewIds.length, before.projectsById["2"].viewIds.length)
  const sourceBoardView = before.projectViewsById[before.projectsById["2"].viewIds[0]]
  const boardView = next.projectViewsById[copy.viewIds[0]]
  assert.notEqual(boardView.id, sourceBoardView.id)
  assert.deepEqual(boardView.labels.map(label => [label.name, label.color]), sourceBoardView.labels.map(label => [label.name, label.color]))
  assert.equal(boardView.labels.some(label => sourceBoardView.labels.some(old => old.id === label.id)), false)
  assert.deepEqual(boardView.boardIds.map(id => next.taskBoardsById[id].stage), sourceBoardView.boardIds.map(id => before.taskBoardsById[id].stage))
  const tasks = Object.values(next.workItemsById).filter(task => task.projectId === copy.id)
  assert.equal(tasks.length, Object.values(before.workItemsById).filter(task => task.projectId === "2").length)
  const task = tasks.find(item => item.title === before.workItemsById["work-item-2-workspace-filters"].title)
  assert.equal(task.boardId, boardView.boardIds.find(id => next.taskBoardsById[id].title === before.taskBoardsById[before.workItemsById["work-item-2-workspace-filters"].boardId].title))
  assert.equal(task.dependencyIds.length, 1)
  assert.equal(next.workItemsById[task.dependencyIds[0]].projectId, copy.id)
  assert.equal(task.linkedResourceIds[0], copy.resourceIds[0])
  assert.equal(task.milestoneId, copy.milestoneIds[0])
  assert.equal(task.startDate, "2026-10-01")
  assert.equal(task.dueDate, "2026-10-12")
  assert.deepEqual(task.checklist.map(item => [item.label, item.completed]), before.workItemsById["work-item-2-workspace-filters"].checklist.map(item => [item.label, item.completed]))
  assert.equal(task.checklist.some(item => before.workItemsById["work-item-2-workspace-filters"].checklist.some(old => old.id === item.id)), false)
  const tableId = copy.viewIds.find(id => next.projectViewsById[id].type === "table")
  assert.deepEqual(next.tablesByViewId[tableId], before.tablesByViewId["source-table"])
  assert.notEqual(next.tablesByViewId[tableId], before.tablesByViewId["source-table"])
  assert.notEqual(next.tablesByViewId[tableId].rows[0].cells.attachments, before.tablesByViewId["source-table"].rows[0].cells.attachments)
  next.tablesByViewId[tableId].rows[0].cells.attachments[0].name = "Changed clone"
  assert.equal(source.tablesByViewId["source-table"].rows[0].cells.attachments[0].name, "notes.txt")
  assert.equal(next.resourcesById[copy.resourceIds[0]].content, "<p>Saved text</p>")
  assert.equal(parseBackup(serializeBackup(next)).ok, true)
})

test("rejects invalid inputs and generated ID collisions without changing source", () => {
  const source = fixture()
  for (const [sourceId, workspaceId, title, makeId] of [
    ["missing", "project-beta", "Copy", ids()],
    ["2", "missing", "Copy", ids()],
    ["2", "project-beta", "  ", ids()],
    ["2", "project-beta", "Copy", () => "__proto__"],
    ["2", "project-beta", "Copy", () => "2"],
    ["2", "project-beta", "Copy", () => "same"],
  ]) {
    assert.equal(duplicateProjectState(source, sourceId, workspaceId, title, makeId), source)
  }
  let allocation = 0
  assert.equal(duplicateProjectState(source, "2", "project-beta", "Copy", () =>
    ++allocation === 5 ? "source-document" : `new-${allocation}`), source)
  assert.deepEqual(source, fixture())
})
