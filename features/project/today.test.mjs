import assert from "node:assert/strict"
import test from "node:test"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { readFileSync } from "node:fs"

import * as selectors from "./selectors.ts"
import { createProjectSeedState } from "./seed-data.ts"
import {
  deleteWorkspaceState,
  setProjectArchivedState,
} from "./lifecycle.ts"
import { getProjectViewHref } from "./query-state.ts"
import { useLocalToday } from "./use-local-today.ts"
import { createProjectStore } from "./store.ts"
import { getEditableWorkItemFields } from "../work-item/form.ts"

const today = "2026-09-27"

test("Today waits for the browser date during server rendering", () => {
  function LocalDate() {
    return createElement("span", null, useLocalToday() ?? "Loading tasks")
  }
  assert.equal(renderToString(createElement(LocalDate)), "<span>Loading tasks</span>")
})

function fixture() {
  const state = createProjectSeedState()
  const base = state.workItemsById["work-item-2-workspace-filters"]
  state.workItemsById = {}
  const add = (id, dueDate, fields = {}) => {
    state.workItemsById[id] = { ...base, id, title: id, dueDate, ...fields }
  }
  add("overdue", "2026-09-26")
  add("due-today", today)
  add("future", "2026-09-28")
  add("undated", null)
  add("invalid-date", "2026-02-30")
  add("done", today, { boardId: "task-board-2-done" })
  return { state, add }
}

function select(state, date = today) {
  assert.equal(typeof selectors.selectTodayWorkItems, "function", "Today selector exists")
  return selectors.selectTodayWorkItems(state, date)
}

test("Today selects only unfinished tasks due today or earlier without mutating state", () => {
  const { state } = fixture()
  const before = structuredClone(state)
  const result = select(state)
  assert.deepEqual(result.map(item => item.workItem.id), ["overdue", "due-today"])
  assert.deepEqual(state, before)
  assert.strictEqual(result[0].workItem, state.workItemsById.overdue)
  assert.strictEqual(result[0].board, state.taskBoardsById["task-board-2-todo"])
  assert.strictEqual(result[0].project, state.projectsById["2"])
  assert.strictEqual(result[0].workspace, state.workspacesById["project-alpha"])
  assert.deepEqual(select(state, "invalid"), [])
})

test("Today includes another workspace/project and links to its exact Board Work view", () => {
  const { state, add } = fixture()
  const workspace = state.workspaceIds.find(id => id !== "project-alpha")
  state.projectsById.other = {
    ...state.projectsById["2"], id: "other", workspaceId: workspace,
    viewIds: ["other-view"], status: "completed",
  }
  state.projectIdsByWorkspaceId[workspace] = ["other"]
  state.projectViewsById["other-view"] = {
    ...state.projectViewsById["view-2-board"], id: "other-view",
    projectId: "other", boardIds: ["other-board"],
  }
  state.taskBoardsById["other-board"] = {
    ...state.taskBoardsById["task-board-2-todo"], id: "other-board",
    projectId: "other", viewId: "other-view",
  }
  add("another-task", today, { projectId: "other", boardId: "other-board" })
  const item = select(state).find(item => item.workItem.id === "another-task")
  assert.equal(item.workspace.id, workspace)
  assert.equal(item.project.id, "other")
  assert.equal(getProjectViewHref(item.workspace.id, item.project.id, "board", {
    workViewId: item.board.viewId,
  }), `/dashboard/workspaces/${workspace}/projects/other?view=board&workView=other-view`)
})

test("Today responds to archive, restore and workspace deletion", () => {
  const { state } = fixture()
  const archived = setProjectArchivedState(state, "2", true)
  assert.deepEqual(select(archived), [])
  assert.equal(select(setProjectArchivedState(archived, "2", false)).length, 2)
  assert.deepEqual(select(deleteWorkspaceState(state, "project-alpha")), [])
})

test("Today follows Board completion and changed due dates on each immutable snapshot", () => {
  const { state } = fixture()
  const completed = {
    ...state, taskBoardsById: {
      ...state.taskBoardsById,
      "task-board-2-todo": { ...state.taskBoardsById["task-board-2-todo"], stage: "done" },
    },
  }
  assert.deepEqual(select(completed), [])
  const postponed = {
    ...state, workItemsById: {
      ...state.workItemsById,
      overdue: { ...state.workItemsById.overdue, dueDate: "2026-10-01" },
    },
  }
  assert.deepEqual(select(postponed).map(item => item.workItem.id), ["due-today"])
  assert.equal(select(state).length, 2)
})

test("Today orders oldest dates first, then priority and stable task IDs", () => {
  const { state, add } = fixture()
  add("a-urgent", today, { priority: "urgent" })
  add("b-urgent", today, { priority: "urgent" })
  add("high", today, { priority: "high" })
  add("medium", today, { priority: "medium" })
  add("low", today, { priority: "low" })
  delete state.workItemsById["due-today"]
  assert.deepEqual(select(state).map(item => item.workItem.id), [
    "overdue", "a-urgent", "b-urgent", "high", "medium", "low",
  ])
})

test("Today ignores tasks outside the owned workspace/project/view/Board chain", () => {
  const { state, add } = fixture()
  add("missing-board", today, { boardId: "missing" })
  add("foreign-board", today, { projectId: "1" })
  state.taskBoardsById.unlisted = { ...state.taskBoardsById["task-board-2-todo"], id: "unlisted" }
  add("unlisted", today, { boardId: "unlisted" })
  assert.equal(select(state).length, 2)
  assert.deepEqual(select({ ...state, workspaceIds: [] }), [])
  assert.deepEqual(select({ ...state, projectIdsByWorkspaceId: {} }), [])
  assert.deepEqual(select({ ...state, projectViewsById: {} }), [])
})

test("Today caches by snapshot and local date, including empty results", () => {
  const { state } = fixture()
  const result = select(state)
  assert.strictEqual(select(state), result)
  assert.notStrictEqual(select({ ...state }), result)
  assert.equal(select(state, "2026-09-28").length, 3)
  assert.strictEqual(select(state), result)
  const empty = select(state, "2020-01-01")
  assert.deepEqual(empty, [])
  assert.strictEqual(select(state, "2020-01-01"), empty)
})

test("Today opens a shared task dialog independently of its filtered rows", () => {
  const source = readFileSync(new URL("./components/task-agenda-dashboard.tsx", import.meta.url), "utf8")
  assert.match(source, /<ProjectWorkItemDialog/)
  assert.match(source, /projectId=\{selectedTask\.projectId\}/)
  assert.match(source, /workItemId: selectedTask\.workItemId/)
  assert.match(source, /onClick=\{\(event\) => onOpenTask\(project\.id, workItem\.id, event\.currentTarget\)\}/)
  assert.match(source, /data-work-item-open-trigger=\{workItem\.id\}/)
  assert.match(source, /finalFocus=\{finalFocus\}/)
  assert.match(source, /isConnected/)
  assert.match(source, /return remountedTrigger \?\? listRef\.current/)
  assert.doesNotMatch(source, /items\.find\(/)
})

test("an edited task remains available to its dialog after leaving Today", () => {
  const store = createProjectStore()
  const id = "work-item-2-workspace-filters"
  assert.equal(store.getState().updateWorkItemDateRange(id, null, today), true)
  const selected = selectors.selectTodayWorkItems(store.getState(), today).find(item => item.workItem.id === id)
  const otherProjectTasks = selectors.selectProjectWorkItems(store.getState(), "6")
  assert.ok(selected)
  assert.equal(store.getState().saveWorkItem(id, {
    ...getEditableWorkItemFields(selected.workItem), dueDate: "2026-10-01", description: "Edited from Today",
  }), true)
  assert.equal(selectors.selectTodayWorkItems(store.getState(), today).some(item => item.workItem.id === id), false)
  const liveTask = selectors.selectProjectResolvedWorkItems(store.getState(), selected.project.id)
    .find(item => item.workItem.id === id)?.workItem
  assert.equal(liveTask.description, "Edited from Today")
  assert.equal(liveTask.dueDate, "2026-10-01")
  assert.equal(store.getState().saveWorkItem(id, {
    ...getEditableWorkItemFields(liveTask), title: "Continue editing the same task",
  }), true)
  assert.equal(selectors.selectProjectResolvedWorkItems(store.getState(), "6").some(item => item.workItem.id === id), false)
  assert.deepEqual(selectors.selectProjectWorkItems(store.getState(), "6"), otherProjectTasks)
})
