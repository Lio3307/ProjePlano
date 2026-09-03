import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const tableViewSource = await readFile(
  new URL("./components/table-view.tsx", import.meta.url),
  "utf8"
)
const projectWorkViewSource = await readFile(
  new URL("../project/components/project-work-view.tsx", import.meta.url),
  "utf8"
)

test("TableView uses the feature-local editable table model", () => {
  assert.match(tableViewSource, /useEditableTable/)
  assert.match(tableViewSource, /aria-label="Add column"/)
  assert.match(tableViewSource, /onClick=\{addRow\}/)
  assert.doesNotMatch(tableViewSource, /WorkItem/)
})

test("project controller isolates Table from shared work-item controls", () => {
  assert.match(projectWorkViewSource, /if \(viewType === "table"\)/)
  assert.match(projectWorkViewSource, /<TableView \/>/)
  assert.match(projectWorkViewSource, /function SharedWorkItemView/)
  assert.doesNotMatch(projectWorkViewSource, /<TableView\s+workItems=/)
})
