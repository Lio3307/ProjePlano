import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"
import { createProjectStore } from "./store.ts"
import { selectProjectResolvedWorkItems } from "./selectors.ts"
import { createWorkItemFilters, filterWorkItems } from "../work-item/filters.ts"
import { getBlockingDependencyCounts } from "../work-item/dependencies.ts"
import { buildKanbanBoards, getKanbanDropDestination, getKanbanBoardDropId, getKanbanWorkItemDragId } from "../kanban/model.ts"
import { partitionCalendarWorkItems, groupCalendarWorkItemsByMonth } from "../calendar/model.ts"

const source = path => {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, "utf8") : ""
}

test("filtering keeps hidden dependencies in blocker counts and leaves store/backup untouched", () => {
  const store = createProjectStore()
  const before = store.getState()
  const backup = JSON.parse(before.exportBackup()).data
  const tasks = selectProjectResolvedWorkItems(before, "2").map(item => item.workItem)
  const dependent = tasks.find(item => item.id === "work-item-2-workspace-filters")
  const stages = Object.fromEntries(Object.values(before.taskBoardsById).map(board => [board.id, board.stage]))
  const visible = filterWorkItems(tasks, stages, { ...createWorkItemFilters(), query: dependent.title })
  assert.deepEqual(visible.map(item => item.id), [dependent.id])
  assert.equal(getBlockingDependencyCounts(tasks, stages)[dependent.id], 1)
  assert.equal(store.getState(), before)
  assert.deepEqual(JSON.parse(before.exportBackup()).data, backup)
})

test("Kanban drop targets use full task positions even when intermediate tasks are hidden", () => {
  const state = createProjectStore().getState()
  const board = state.taskBoardsById["task-board-2-todo"]
  const template = state.workItemsById["work-item-2-audit-onboarding"]
  const tasks = ["Visible first", "Hidden middle", "Visible last", "Hidden end"].map((title, position) => ({
    ...template, id: "task-" + position, boardId: board.id, title, position,
  }))
  const records = buildKanbanBoards([board], tasks)
  const visible = filterWorkItems(tasks, { [board.id]: board.stage }, { ...createWorkItemFilters(), query: "visible" })
  assert.equal(visible.length, 2)
  assert.deepEqual(getKanbanDropDestination(records, getKanbanWorkItemDragId(visible[1].id)), { boardId: board.id, index: 2 })
  assert.deepEqual(getKanbanDropDestination(records, getKanbanBoardDropId(board.id)), { boardId: board.id, index: 4 })
})

test("Calendar uses one filtered set for scheduled and unscheduled projections", () => {
  const template = createProjectStore().getState().workItemsById["work-item-2-audit-onboarding"]
  const tasks = [
    { ...template, id: "scheduled", priority: "urgent", dueDate: "2026-09-27" },
    { ...template, id: "unscheduled", priority: "urgent", dueDate: null },
    { ...template, id: "hidden", priority: "low", dueDate: "2026-09-27" },
  ]
  const visible = filterWorkItems(tasks, {}, { ...createWorkItemFilters(), priority: "urgent" })
  const { scheduled, unscheduled } = partitionCalendarWorkItems(visible)
  assert.deepEqual(scheduled.map(task => task.id), ["scheduled"])
  assert.deepEqual(unscheduled.map(task => task.id), ["unscheduled"])
  const groups = groupCalendarWorkItemsByMonth(scheduled, { year: 2026, month: 8 })
  assert.equal(groups.length, 1)
})

test("project bridge keeps full task data for renderers and dialogs while passing visibility separately", () => {
  const bridge = source("./components/project-work-view.tsx")
  assert.match(bridge, /<WorkItemFiltersToolbar/)
  assert.equal(bridge.match(/visibleWorkItemIds=\{visibleWorkItemIds\}/g)?.length, 2)
  assert.equal(bridge.match(/workItems=\{workItems\}/g)?.length, 2)
  assert.match(bridge, /projectWorkItems=\{workItems\}/)
  assert.match(bridge, /return searchInputRef\.current/)
  const kanban = source("../kanban/components/kanban-view.tsx")
  assert.match(kanban, /getKanbanDropDestination\(records, targetId\)/)
  assert.match(kanban, /buildKanbanBoards\(boards, workItems\)/)
  const column = source("../kanban/components/kanban-column.tsx")
  assert.match(column, /visibleWorkItemIds\.has\(workItem\.id\)/)
  assert.match(column, /No matching tasks/)
  const calendar = source("../calendar/components/calendar-view.tsx")
  assert.match(calendar, /partitionCalendarWorkItems\(visibleWorkItems\)/)
  assert.match(calendar, /getBlockingDependencyCounts\(workItems, stagesByBoardId\)/)
})

test("filter controls have labels, result feedback, reset and a removed-label state", () => {
  const toolbar = source("../work-item/components/work-item-filters.tsx")
  assert.match(toolbar, /type="search"/)
  assert.equal(toolbar.match(/<select\b/g)?.length, 3)
  assert.equal(toolbar.match(/<label\b/g)?.length, 4)
  assert.match(toolbar, /Clear filters/)
  assert.match(toolbar, /role="status"/)
  assert.match(toolbar, /No matching tasks/)
  assert.match(toolbar, /Removed label/)
  assert.doesNotMatch(toolbar, /useProjectStore|localStorage|sessionStorage/)
})
