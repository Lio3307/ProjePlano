import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const headerSource = readSource(
  "./components/workspace-overview-header.tsx"
)
const pageSource = readSource(
  "../../app/dashboard/workspaces/[workspaceId]/page.tsx"
)

test("keeps the workspace route server-owned and delegates its header", () => {
  assert.doesNotMatch(pageSource, /^"use client"/)
  assert.match(
    pageSource,
    /import \{ WorkspaceOverviewHeader \} from "@\/features\/workspace\/components\/workspace-overview-header"/
  )
  assert.match(
    pageSource,
    /<WorkspaceOverviewHeader workspace=\{workspace\} \/>/
  )
  assert.match(
    pageSource,
    /className="min-w-0 space-y-6 p-4 sm:p-6"/
  )
  assert.match(pageSource, /if \(!workspace\) notFound\(\)/)
  assert.doesNotMatch(pageSource, /CircleUserRound|EllipsisVertical/)
})

test("exposes honest workspace actions without member access", () => {
  assert.match(headerSource, /<DropdownMenu>/)
  assert.match(headerSource, /<DropdownMenuTrigger/)
  assert.match(headerSource, /<DropdownMenuContent align="end"/)
  assert.doesNotMatch(headerSource, /Manage members|WorkspaceMemberPreview|useProjectStore/)
  assert.match(
    headerSource,
    /<DropdownMenuItem disabled>[\s\S]*?Edit workspace/
  )
  assert.match(headerSource, /<DropdownMenuSeparator \/>/)
  assert.match(
    headerSource,
    /<DropdownMenuItem[^>]*variant="destructive"[^>]*disabled>/
  )
  assert.match(headerSource, /Delete workspace/)
  assert.match(
    headerSource,
    /aria-label=\{"Open actions for " \+ workspace\.title\}/
  )
})

function readSource(relativePath) {
  const file = new URL(relativePath, import.meta.url)
  return existsSync(file) ? readFileSync(file, "utf8") : ""
}
