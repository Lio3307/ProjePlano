import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  createTaskBoardFormValue,
  haveSameEditableTaskBoardFields,
  normalizeTaskBoardFormValue,
} from "./form.ts"

const formSourceUrl = new URL("./components/board-form.tsx", import.meta.url)
const dialogSourceUrl = new URL(
  "./components/board-dialog.tsx",
  import.meta.url
)

const board = {
  id: "task-board-project-a-delivery",
  projectId: "project-a",
  viewId: "view-project-a-board",
  title: "Delivery",
  description: "Ship the release",
  stage: "in-progress",
  position: 0,
}

test("creates and clones focused TaskBoard form values", () => {
  const empty = createTaskBoardFormValue(null)
  const value = createTaskBoardFormValue(board)

  assert.deepEqual(empty, {
    title: "",
    description: "",
    stage: "todo",
  })
  assert.deepEqual(value, {
    title: "Delivery",
    description: "Ship the release",
    stage: "in-progress",
  })
  assert.notStrictEqual(value, board)
})

test("normalizes Board fields without owning labels", () => {
  assert.deepEqual(
    normalizeTaskBoardFormValue({
      title: "  Delivery  ",
      description: "  Ship the release  ",
      stage: "review",
    }),
    {
      title: "Delivery",
      description: "Ship the release",
      stage: "review",
    }
  )
  assert.equal(
    normalizeTaskBoardFormValue({
      title: " ",
      description: "",
      stage: "todo",
    }),
    null
  )
  assert.equal(
    normalizeTaskBoardFormValue({
      title: "Delivery",
      description: "",
      stage: "blocked",
    }),
    null
  )
})

test("compares only editable TaskBoard settings", () => {
  const fields = createTaskBoardFormValue(board)

  assert.equal(haveSameEditableTaskBoardFields(board, fields), true)
  assert.equal(
    haveSameEditableTaskBoardFields(board, {
      ...fields,
      title: "Ready",
    }),
    false
  )
})

test("uses shared dialog primitives with one scrolling form body", async () => {
  const [dialog, form] = await Promise.all([
    readFile(dialogSourceUrl, "utf8"),
    readFile(formSourceUrl, "utf8"),
  ])
  const source = dialog + form
  const headerIndex = dialog.indexOf("<DialogHeader")
  const scrollIndex = dialog.indexOf(
    'className="no-scrollbar min-h-0 flex-1 overflow-y-auto'
  )
  const footerIndex = dialog.indexOf("<DialogFooter")

  assert.match(dialog, /@\/components\/ui\/dialog/)
  assert.match(source, /@\/components\/ui\/button/)
  assert.match(source, /<Input/)
  assert.match(source, /<Textarea/)
  assert.doesNotMatch(form, /Workflow stage|Tasks inherit this stage/)
  assert.doesNotMatch(form, /<select|WORK_ITEM_STATUSES/)
  assert.doesNotMatch(dialog, /workflow stage/i)
  assert.doesNotMatch(form, /Labels|Add label|BOARD_LABEL/)
  assert.equal(dialog.match(/overflow-y-auto/g)?.length, 1)
  assert.ok(headerIndex >= 0)
  assert.ok(scrollIndex > headerIndex)
  assert.ok(footerIndex > scrollIndex)
})

test("keeps create, settings, validation, and no-change feedback explicit", async () => {
  const source = await readFile(dialogSourceUrl, "utf8")

  assert.match(source, /mode === "create" \? "Create board" : "Board settings"/)
  assert.match(source, /mode === "create" \? "Create board" : "Save changes"/)
  assert.match(source, /role="alert"/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /requestAnimationFrame/)
  assert.match(source, /errorRef\.current\?\.focus\(\)/)
  assert.match(source, /haveSameEditableTaskBoardFields\(board, fields\)/)
  assert.match(source, /onSave\(board\.id, fields\)/)
})
