import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { resolveBoardLabels } from "../project/board.ts"

const componentUrl = new URL("./components/", import.meta.url)
const dashboardLayoutUrl = new URL(
  "../../app/dashboard/layout.tsx",
  import.meta.url
)
const rootLayoutUrl = new URL(
  "../../app/layout.tsx",
  import.meta.url
)
const projectWorkViewUrl = new URL(
  "../project/components/project-work-view.tsx",
  import.meta.url
)
const projectWorkspaceUrl = new URL(
  "../project/components/project-workspace.tsx",
  import.meta.url
)
const workItemMetaUrl = new URL(
  "../work-item/components/work-item-meta.tsx",
  import.meta.url
)

function readComponent(name) {
  return readFile(new URL(name, componentUrl), "utf8")
}

test("adds a task from each exact user-created Board", async () => {
  const [board, column] = await Promise.all([
    readComponent("kanban-board.tsx"),
    readComponent("kanban-column.tsx"),
  ])

  assert.match(board, /onAddTask=\{onAddTask\}/)
  assert.match(
    column,
    /onAddTask: \(boardId: string, trigger: HTMLElement\) => void/
  )
  assert.match(
    column,
    /onAddTask\(column\.board\.id, event\.currentTarget\)/
  )
  assert.match(column, />\s*Add task\s*<\/Button>/)
})

test("carries the concrete Board ID into a task create session", async () => {
  const source = await readFile(projectWorkViewUrl, "utf8")

  assert.match(
    source,
    /mode: "create"; boardId: string/
  )
  assert.match(
    source,
    /function openCreateDialog\(\s*boardId: string,\s*trigger: HTMLElement\s*\)/
  )
  assert.match(
    source,
    /taskBoard\.id === dialogSession\.boardId/
  )
  assert.match(source, /boardId: dialogBoard\.id/)
  assert.match(source, /onAddTask=\{openCreateDialog\}/)
})

test("removes the obsolete top-level task action", async () => {
  const source = await readFile(projectWorkViewUrl, "utf8")

  assert.doesNotMatch(source, /data-new-work-item-trigger/)
  assert.doesNotMatch(source, />\s*New task\s*</)
})

test("lets the page own vertical Board scrolling", async () => {
  const [board, column] = await Promise.all([
    readComponent("kanban-board.tsx"),
    readComponent("kanban-column.tsx"),
  ])

  assert.doesNotMatch(column, /max-h-\[/)
  assert.doesNotMatch(column, /overflow-hidden/)
  assert.doesNotMatch(column, /overflow-y-auto/)
  assert.match(column, /min-h-28/)
  assert.match(board, /overflow-x-auto/)
  assert.match(board, /overscroll-x-contain/)
  assert.match(board, /snap-x/)
  assert.match(board, /snap-proximity/)
  assert.match(column, /snap-start/)
  assert.match(column, /w-\[min\(20rem,calc\(100vw-2rem\)\)\]/)
  assert.match(board, /min-w-max/)
})

test("keeps horizontal Board scrolling inside the project canvas", async () => {
  const [board, workspace] = await Promise.all([
    readComponent("kanban-board.tsx"),
    readFile(projectWorkspaceUrl, "utf8"),
  ])

  assert.match(
    workspace,
    /className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col"/
  )
  assert.match(board, /className="w-full min-w-0 max-w-full space-y-4"/)
  assert.match(
    board,
    /className="w-full min-w-0 max-w-full snap-x snap-proximity overflow-x-auto overscroll-x-contain/
  )
  assert.match(board, /className="flex min-w-max items-start gap-3"/)
})

test("bounds the dashboard main without clipping a wide Board", async () => {
  const [dashboardLayout, rootLayout, workspace] = await Promise.all([
    readFile(dashboardLayoutUrl, "utf8"),
    readFile(rootLayoutUrl, "utf8"),
    readFile(projectWorkspaceUrl, "utf8"),
  ])

  assert.doesNotMatch(rootLayout, /overflow-x-(hidden|clip)/)
  assert.match(dashboardLayout, /<SidebarProvider>/)
  assert.match(
    dashboardLayout,
    /<main className="flex min-h-svh w-0 min-w-0 flex-1 flex-col">/
  )
  assert.doesNotMatch(dashboardLayout, /overflow-x-(hidden|clip)/)
  assert.doesNotMatch(workspace, /overflow-x-(hidden|clip)/)
})

test("keeps shared labels in the canvas toolbar and settings per Board", async () => {
  const [view, board, column, meta] = await Promise.all([
    readComponent("kanban-view.tsx"),
    readComponent("kanban-board.tsx"),
    readComponent("kanban-column.tsx"),
    readFile(workItemMetaUrl, "utf8"),
  ])
  const controlledTree = view + board
  const labelsIndex = board.indexOf("Set labels")
  const addBoardIndex = board.indexOf("Add board")

  assert.match(view, /board: ProjectBoardView/)
  assert.match(view, /boards: readonly TaskBoard\[\]/)
  assert.match(board, /\{board\.title\}/)
  assert.match(board, /<WorkItemLabelList labels=\{board\.labels\}/)
  assert.match(column, />\s*Board settings\s*<\/Button>/)
  assert.match(column, /onEditBoard\(column\.board\.id, event\.currentTarget\)/)
  assert.match(board, />\s*Set labels\s*<\/Button>/)
  assert.match(board, />\s*Add board\s*<\/Button>/)
  assert.ok(labelsIndex >= 0)
  assert.ok(addBoardIndex > labelsIndex)
  assert.doesNotMatch(controlledTree, /useProjectStore|project\/store/)

  for (const color of [
    "gray",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "red",
  ]) {
    assert.match(meta, new RegExp("^  " + color + ":", "m"))
  }
})

test("resolves Board label IDs before rendering colored labels", async () => {
  const [card, meta] = await Promise.all([
    readComponent("kanban-card.tsx"),
    readFile(workItemMetaUrl, "utf8"),
  ])

  const labels = [
    { id: "design", name: "Design", color: "blue" },
    { id: "urgent", name: "Urgent", color: "red" },
  ]
  const resolvedLabels = resolveBoardLabels(labels, [
    "urgent",
    "missing",
    "design",
  ])

  assert.deepEqual(resolvedLabels, [labels[1], labels[0]])
  assert.equal(resolvedLabels[0], labels[1])
  assert.equal(resolvedLabels[1], labels[0])
  assert.deepEqual(resolveBoardLabels(labels, []), [])
  assert.match(
    card,
    /const resolvedLabels = resolveBoardLabels\(labels, workItem\.labelIds\)/
  )
  assert.match(card, /<WorkItemLabelList labels=\{resolvedLabels\}/)
  assert.match(meta, /labels: readonly BoardLabel\[\]/)
  assert.match(meta, /BOARD_LABEL_STYLES\[label\.color\]/)
})

test("keeps one static Board label color-class map", async () => {
  const [form, meta] = await Promise.all([
    readComponent("label-manager-dialog.tsx"),
    readFile(workItemMetaUrl, "utf8"),
  ])

  assert.match(form, /import \{ BOARD_LABEL_STYLES \}/)
  assert.match(form, /BOARD_LABEL_STYLES\[color\]/)
  assert.doesNotMatch(form, /LABEL_COLOR_CLASSES|Record<BoardLabelColor, string>/)
  assert.equal(
    (form + meta).match(/Record<BoardLabelColor, string>/g)?.length,
    1
  )
})

test("shows Board card dates, documents, and existing task signals", async () => {
  const card = await readComponent("kanban-card.tsx")

  assert.match(card, /workItem\.startDate && workItem\.dueDate/)
  assert.match(card, /formatWorkItemDate\(workItem\.startDate\)/)
  assert.match(card, /formatWorkItemDate\(workItem\.dueDate\)/)
  assert.match(card, /workItem\.linkedResourceIds\.length > 0/)
  assert.match(card, /<FileText/)
  assert.match(card, /WorkItemTypeBadge/)
  assert.match(card, /WorkItemPriorityBadge/)
  assert.match(card, /WorkItemBlockedBadge/)
  assert.match(card, /getWorkItemChecklistProgress/)
  assert.doesNotMatch(card, /WorkItemAssignee/)
  assert.equal(card.match(/\[overflow-wrap:anywhere\]/g)?.length, 2)
  assert.equal(card.match(/<button/g)?.length, 2)
  assert.match(card, /ref=\{handleRef\}/)
})
