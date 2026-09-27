import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

import {
  createWorkItemFormValue,
  normalizeWorkItemFormValue,
} from "../work-item/form.ts"
import { createProjectStore } from "./store.ts"

test("personal project state has no member directory or assignment fields", () => {
  const state = createProjectStore().getState()

  for (const key of [
    "membersById",
    "memberIdsByWorkspaceId",
    "createWorkspaceMember",
    "updateWorkspaceMember",
    "removeWorkspaceMember",
  ]) {
    assert.equal(Object.hasOwn(state, key), false, key)
  }
  for (const item of Object.values(state.workItemsById)) {
    assert.equal(Object.hasOwn(item, "assigneeId"), false)
  }
  for (const view of Object.values(state.projectViewsById)) {
    assert.equal(view.visibleFieldIds.includes("assignee"), false)
  }
})

test("personal tasks can be created, edited, moved, scheduled, and linked to documents", () => {
  const store = createProjectStore()
  const draft = createWorkItemFormValue(null)
  assert.equal(Object.hasOwn(draft, "assigneeId"), false)
  const fields = normalizeWorkItemFormValue({
    ...draft,
    title: "Plan my next release",
  })
  assert.ok(fields)
  assert.equal(Object.hasOwn(fields, "assigneeId"), false)

  const item = {
    ...fields,
    id: "personal-task",
    projectId: "2",
    boardId: "task-board-2-todo",
    position: 0,
    milestoneId: null,
    customFields: {},
  }
  assert.equal(store.getState().createWorkItem(item), true)
  assert.equal(
    store.getState().saveWorkItem(item.id, {
      ...fields,
      title: "Ship my next release",
      dependencyIds: ["work-item-2-audit-onboarding"],
    }),
    true
  )
  assert.equal(
    store.getState().moveWorkItem(item.id, "task-board-2-in-progress", 0),
    true
  )
  assert.equal(
    store.getState().updateWorkItemDateRange(
      item.id,
      "2026-09-27",
      "2026-09-30"
    ),
    true
  )
  assert.equal(
    store.getState().createAndLinkWorkItemDocument({
      id: "personal-task-notes",
      workItemId: item.id,
      title: "Release notes",
    }),
    true
  )

  const saved = store.getState().workItemsById[item.id]
  assert.equal(saved.title, "Ship my next release")
  assert.equal(saved.boardId, "task-board-2-in-progress")
  assert.equal(saved.dueDate, "2026-09-30")
  assert.deepEqual(saved.dependencyIds, ["work-item-2-audit-onboarding"])
  assert.deepEqual(saved.linkedResourceIds, ["personal-task-notes"])
  assert.equal(Object.hasOwn(saved, "assigneeId"), false)
})

test("workspace navigation no longer exposes the removed member route", () => {
  const removedRoute = new URL(
    "../../app/dashboard/workspaces/[workspaceId]/members/page.tsx",
    import.meta.url
  )
  assert.equal(existsSync(removedRoute), false)
  for (const path of [
    "../../components/layout/app-sidebar.tsx",
    "../workspace/components/workspace-list.tsx",
    "../workspace/components/workspace-overview-header.tsx",
  ]) {
    assert.doesNotMatch(
      readFileSync(new URL(path, import.meta.url), "utf8"),
      /\/members|Manage members|WorkspaceMemberPreview/
    )
  }
})
