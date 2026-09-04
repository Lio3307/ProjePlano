import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const formSource = readSource(
  "./components/workspace-member-form.tsx"
)
const dialogSource = readSource(
  "./components/workspace-member-dialog.tsx"
)
const removeSource = readSource(
  "./components/remove-workspace-member-dialog.tsx"
)
const tableSource = readSource(
  "./components/workspace-member-table.tsx"
)
const viewSource = readSource(
  "./components/workspace-members-view.tsx"
)

test("uses existing UI primitives and labelled member fields", () => {
  assert.match(formSource, /@\/components\/ui\/input/)
  assert.match(formSource, /htmlFor="workspace-member-name"/)
  assert.match(formSource, /htmlFor="workspace-member-email"/)
  assert.match(formSource, /htmlFor="workspace-member-role"/)
  assert.match(formSource, /htmlFor="workspace-member-status"/)
  assert.match(dialogSource, /@\/components\/ui\/dialog/)
  assert.match(dialogSource, /@\/components\/ui\/button/)
  assert.match(dialogSource, /role="alert"/)
})

test("keeps member presentation controlled and table-like", () => {
  assert.match(tableSource, /@\/components\/ui\/table/)
  assert.match(tableSource, /@\/components\/ui\/dropdown-menu/)
  assert.match(tableSource, /min-w-\[48rem\]/)
  assert.match(tableSource, /"Edit " \+ member\.name/)
  assert.match(tableSource, /"Remove " \+ member\.name/)
  assert.doesNotMatch(tableSource, /useProjectStore/)
  assert.doesNotMatch(dialogSource, /useProjectStore/)
  assert.doesNotMatch(removeSource, /useProjectStore/)
})

test("keeps member dialog chrome outside its scroll region", () => {
  const headerIndex = dialogSource.indexOf("<DialogHeader")
  const scrollIndex = dialogSource.indexOf(
    'className="no-scrollbar min-h-0 flex-1 overflow-y-auto'
  )
  const footerIndex = dialogSource.indexOf("<DialogFooter")

  assert.match(
    dialogSource,
    /flex max-w-lg flex-col overflow-hidden p-0/
  )
  assert.doesNotMatch(dialogSource, /sticky top-0/)
  assert.equal(dialogSource.match(/overflow-y-auto/g)?.length, 1)
  assert.ok(headerIndex >= 0)
  assert.ok(scrollIndex > headerIndex)
  assert.ok(footerIndex > scrollIndex)
  assert.match(dialogSource, /<DialogHeader[^>]*shrink-0/)
  assert.match(dialogSource, /<DialogFooter[^>]*shrink-0/)
})

test("explains destructive assignment cleanup", () => {
  assert.match(removeSource, /assignments will be cleared/)
  assert.match(removeSource, /role="alert"/)
})

test("keeps store access at the member view boundary", () => {
  assert.match(viewSource, /useProjectStore/)
  assert.match(viewSource, /selectWorkspaceWorkItemAssignments/)
  assert.match(viewSource, /buildWorkspaceMemberSummaries/)
  assert.match(viewSource, /crypto\.randomUUID\(\)/)
  assert.match(viewSource, /data-workspace-members=/)
})

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}
