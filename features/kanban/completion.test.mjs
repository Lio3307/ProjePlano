import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import * as form from "./form.ts"
import { createProjectStore } from "../project/store.ts"
import { selectProjectResolvedWorkItems } from "../project/selectors.ts"
import { buildProjectOverviewSummary } from "../project/overview.ts"
import { getBlockingDependencyCounts } from "../work-item/dependencies.ts"

test("Board completion preserves other stages and reopens completed Boards as todo", () => {
  assert.equal(typeof form.setTaskBoardCompleted, "function")
  const draft = { title: "Delivery", description: "", stage: "review" }
  assert.equal(form.setTaskBoardCompleted(draft, false).stage, "review")
  const completed = form.setTaskBoardCompleted(draft, true)
  assert.equal(completed.stage, "done")
  assert.equal(form.setTaskBoardCompleted(completed, false).stage, "todo")
  assert.equal(draft.stage, "review")
})

test("completed Board changes update progress, overdue work and unfinished blockers", () => {
  assert.equal(typeof form.setTaskBoardCompleted, "function")
  const store = createProjectStore()
  const task = store.getState().workItemsById["work-item-2-audit-onboarding"]
  const board = store.getState().taskBoardsById[task.boardId]
  const summary = () => buildProjectOverviewSummary({ today: "2026-12-01",
    workItems: selectProjectResolvedWorkItems(store.getState(), "2"), milestones: [], resources: [],
  })
  const before = summary()
  assert.equal(store.getState().updateTaskBoard({ boardId: board.id,
    ...form.setTaskBoardCompleted(form.createTaskBoardFormValue(board), true),
  }), true)
  assert.ok(summary().completedWorkItems > before.completedWorkItems)
  assert.ok(summary().overdueWorkItems < before.overdueWorkItems)
  const state = store.getState()
  const stages = Object.fromEntries(Object.values(state.taskBoardsById).map(b => [b.id, b.stage]))
  const counts = getBlockingDependencyCounts(Object.values(state.workItemsById), stages)
  assert.equal(counts["work-item-2-workspace-filters"], 0)
  assert.equal(state.importBackup(state.exportBackup()).ok, true)
})

test("Board form exposes one completion checkbox without a workflow-stage selector", () => {
  const source = readFileSync(new URL("./components/board-form.tsx", import.meta.url), "utf8")
  assert.match(source, /type="checkbox"/)
  assert.match(source, /Completed board/)
  assert.match(source, /setTaskBoardCompleted/)
  assert.doesNotMatch(source, /<select|Workflow stage/)
})

test("moving a task into a new completed Board finishes it and moving it back reopens it", () => {
  const store = createProjectStore()
  const taskId = "work-item-2-audit-onboarding"
  const task = store.getState().workItemsById[taskId]
  const originalBoard = store.getState().taskBoardsById[task.boardId]
  const completedFields = form.setTaskBoardCompleted({ ...form.createTaskBoardFormValue(null), title: "Delivered" }, true)
  assert.equal(store.getState().addTaskBoard({
    id: "delivered", projectId: "2", viewId: originalBoard.viewId, ...completedFields,
  }), true)
  const taskStage = () => selectProjectResolvedWorkItems(store.getState(), "2").find(item => item.workItem.id === taskId).stage
  assert.equal(store.getState().moveWorkItem(taskId, "delivered", 0), true)
  assert.equal(taskStage(), "done")
  assert.equal(store.getState().moveWorkItem(taskId, originalBoard.id, 0), true)
  assert.equal(taskStage(), originalBoard.stage)
  assert.equal(Object.hasOwn(store.getState().workItemsById[taskId], "status"), false)
})
