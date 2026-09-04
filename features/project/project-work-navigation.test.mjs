import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const componentPath = new URL("./components/", import.meta.url)
const routePath = new URL(
  "../../app/dashboard/workspaces/[workspaceId]/projects/[projectId]/page.tsx",
  import.meta.url
)

function readComponent(name) {
  return readFileSync(new URL(name, componentPath), "utf8")
}

test("keeps Work as a permanent primary project area", () => {
  const source = readComponent("project-navigation.tsx")

  assert.match(source, /const workIsActive =\s*[\s\S]*"empty-work"/)
  assert.match(
    source,
    /getProjectViewHref\(\s*workspaceId,\s*projectId,\s*"work"\s*\)/
  )
  assert.match(source, />\s*Work\s*<\/ProjectTabLink>/)
  assert.match(source, /\{workIsActive \? \(/)
})

test("puts Work creation in an always-present plus dropdown", () => {
  const source = readComponent("project-navigation.tsx")

  assert.match(source, /aria-label="Add work view"/)
  assert.match(source, /data-add-work-view-trigger/)
  assert.match(source, /onAddBoard/)
  assert.match(source, /data-add-board-menu-item/)
  assert.match(source, /const hasBoardView = workViews\.some/)
  assert.match(source, /\{!hasBoardView \? \(/)
  assert.match(source, /GENERIC_PROJECT_VIEW_TYPES\.map/)
  assert.match(source, /PROJECT_VIEW_DEFINITIONS\[type\]\.title/)
  assert.doesNotMatch(source, /missingViewTypes/)
  assert.doesNotMatch(source, /All work types added/)
})

test("links every Work tab and Overview row to its exact instance", () => {
  const navigation = readComponent("project-navigation.tsx")
  const overview = readComponent("project-overview.tsx")

  for (const source of [navigation, overview]) {
    assert.match(
      source,
      /view\.type,\s*\{\s*workViewId: view\.id,?\s*\}/
    )
  }
})

test("lists owned Work views on Overview instead of build actions", () => {
  const source = readComponent("project-overview.tsx")

  assert.match(source, /workViews: readonly SupportedProjectView\[\]/)
  assert.match(source, /workViews\.map/)
  assert.match(source, /getProjectViewHref/)
  assert.match(source, /Work views/)
  assert.match(source, /No work views yet/)
  assert.doesNotMatch(source, /Build your workspace/)
  assert.doesNotMatch(source, /onAddView/)
})

test("renders a focused empty state for a project without Work views", () => {
  const source = readComponent("project-workspace.tsx")

  assert.match(source, /selection\.kind === "empty-work"/)
  assert.match(source, /data-empty-work-state/)
  assert.match(source, /Add board/)
  assert.match(source, /openCreateBoardDialog/)
  assert.match(source, /workViews=\{workViews\}/)
})

test("routes every Board entry through one controlled dialog", () => {
  const workspace = readComponent("project-workspace.tsx")
  const navigation = readComponent("project-navigation.tsx")
  const projectView = readComponent("project-view.tsx")
  const workView = readComponent("project-work-view.tsx")
  const kanbanBoard = readFileSync(
    new URL("../kanban/components/kanban-board.tsx", import.meta.url),
    "utf8"
  )
  const kanbanColumn = readFileSync(
    new URL("../kanban/components/kanban-column.tsx", import.meta.url),
    "utf8"
  )

  assert.match(navigation, /onAddBoard/)
  assert.match(navigation, /data-add-board-menu-item/)
  assert.match(workspace, /createFirstTaskBoard/)
  assert.match(workspace, /addTaskBoard/)
  assert.match(workspace, /updateTaskBoard/)
  assert.doesNotMatch(workspace, /addProjectBoard|updateProjectBoard/)
  assert.match(workspace, /<BoardDialog/)
  assert.match(workspace, /crypto\.randomUUID\(\)/)
  assert.match(workspace, /onAddBoard=\{openCreateBoardDialog\}/)
  assert.match(projectView, /onAddBoard/)
  assert.match(workView, /onAddBoard/)
  assert.match(workView, /onEditBoard/)
  assert.doesNotMatch(workView, />\s*Add board\s*</)
  assert.doesNotMatch(workView, />\s*Board settings\s*</)
  assert.match(kanbanBoard, />\s*Add board\s*</)
  assert.match(kanbanColumn, />\s*Board settings\s*</)
})

test("keeps Board creation inside Kanban rather than Calendar", () => {
  const workView = readComponent("project-work-view.tsx")
  const calendarView = readFileSync(
    new URL("../calendar/components/calendar-view.tsx", import.meta.url),
    "utf8"
  )

  assert.doesNotMatch(
    workView,
    /<CalendarView[\s\S]*?onAddBoard=\{onAddBoard\}/
  )
  assert.doesNotMatch(calendarView, /onAddBoard|Add board/)
  assert.match(
    calendarView,
    /data-calendar-work-item-count=\{workItems\.length\}/
  )
  assert.doesNotMatch(calendarView, /onAddTask|New task|Add task/)
})

test("creates one first Board atomically and adds later Boards to the same Kanban view", () => {
  const source = readComponent("project-workspace.tsx")

  assert.match(source, /function handleCreateBoard/)
  assert.match(source, /const boardId =\s*"board-"/)
  assert.match(source, /createFirstTaskBoard\(\{[\s\S]*viewId,[\s\S]*board:/)
  assert.match(source, /addTaskBoard\(\{[\s\S]*viewId: boardView\.id/)
  assert.match(source, /workViewId: viewId/)
})

test("manages one shared label catalog beside Add board", () => {
  const workspace = readComponent("project-workspace.tsx")
  const projectView = readComponent("project-view.tsx")
  const workView = readComponent("project-work-view.tsx")
  const kanbanBoard = readFileSync(
    new URL("../kanban/components/kanban-board.tsx", import.meta.url),
    "utf8"
  )

  assert.match(workspace, /<LabelManagerDialog/)
  assert.match(workspace, /updateBoardLabels/)
  assert.match(workspace, /onSetLabels=\{openLabelManagerDialog\}/)
  assert.match(projectView, /onSetLabels/)
  assert.match(workView, /onSetLabels/)
  assert.match(kanbanBoard, />\s*Set labels\s*<\/Button>/)
  assert.ok(kanbanBoard.indexOf("Set labels") < kanbanBoard.indexOf("Add board"))
})

test("keeps generic creation for Table and Calendar only", () => {
  const workspace = readComponent("project-workspace.tsx")
  const route = readFileSync(routePath, "utf8")
  const addHandler = workspace.match(
    /function handleAddView[\s\S]*?\n  }/
  )?.[0]

  assert.ok(addHandler)
  assert.match(addHandler, /crypto\.randomUUID\(\)/)
  assert.match(addHandler, /addProjectView\(\{[\s\S]*id: viewId/)
  assert.match(addHandler, /workViewId: viewId/)
  assert.doesNotMatch(addHandler, /type === "board"|addProjectBoard/)
  assert.match(workspace, /GenericProjectViewType/)
  assert.match(workspace, /workViewQuery: ProjectQueryValue/)
  assert.match(route, /workView\?: ProjectQueryValue/)
  assert.match(route, /workViewQuery=\{query\.workView\}/)
})
