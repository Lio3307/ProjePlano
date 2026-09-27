import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const readSource = path => readFileSync(new URL(path, import.meta.url), "utf8")
const header = readSource("./components/workspace-overview-header.tsx")
const detail = readSource("./components/workspace-detail.tsx")
const page = readSource("../../app/dashboard/workspaces/[workspaceId]/page.tsx")
const projectPage = readSource("../../app/dashboard/workspaces/[workspaceId]/projects/[projectId]/page.tsx")
const actions = readSource("./components/workspace-actions.tsx")

test("keeps route parameters server-owned and resolves mutable workspaces from the session", () => {
  for (const source of [page, projectPage]) {
    assert.doesNotMatch(source, /^"use client"/)
    assert.doesNotMatch(source, /getWorkspaceById|notFound/)
    assert.match(source, /workspaceId={workspaceId}/)
  }
  assert.ok(detail.includes("selectWorkspaceById(state, workspaceId)"))
  assert.ok(detail.includes("if (!workspace) return <MissingWorkspaceState"))
  assert.match(detail, /<WorkspaceOverviewHeader workspace={workspace}/)
  assert.match(detail, /<WorkspaceProjects workspaceId={workspace.id}/)
})

test("shares functional workspace actions between cards and the header without member access", () => {
  const list = readSource("./components/workspace-list.tsx")
  for (const source of [header, list]) {
    assert.match(source, /<WorkspaceActions workspace={workspace}/)
    assert.doesNotMatch(source, /Manage members|WorkspaceMemberPreview/)
  }
  assert.match(actions, /state.updateWorkspace/)
  assert.match(actions, /state.deleteWorkspace/)
  assert.match(actions, /<DeleteRecordDialog/)
  assert.match(actions, /<RecordDetailsDialog/)
  assert.doesNotMatch(actions, /DropdownMenuItem disabled/)
})
