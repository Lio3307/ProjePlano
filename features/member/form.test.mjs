import assert from "node:assert/strict"
import test from "node:test"

import {
  createWorkspaceMemberFormValue,
  normalizeWorkspaceMemberFormValue,
} from "./form.ts"

test("creates independent empty and edit form values", () => {
  const empty = createWorkspaceMemberFormValue(null)
  const member = {
    id: "member-a",
    workspaceId: "workspace-a",
    name: "Maya Chen",
    email: "maya@example.com",
    initials: "MC",
    role: "editor",
    status: "active",
  }
  const edit = createWorkspaceMemberFormValue(member)

  edit.name = "Changed"

  assert.deepEqual(empty, {
    name: "",
    email: "",
    role: "editor",
    status: "active",
  })
  assert.equal(member.name, "Maya Chen")
})

test("normalizes names and email addresses", () => {
  const value = {
    name: "  Maya   Chen  ",
    email: " MAYA@example.com ",
    role: "editor",
    status: "active",
  }

  assert.deepEqual(normalizeWorkspaceMemberFormValue(value), {
    name: "Maya Chen",
    email: "maya@example.com",
    role: "editor",
    status: "active",
  })
})

test("rejects blank names, invalid email, role, and status values", () => {
  const valid = {
    name: "Maya Chen",
    email: "maya@example.com",
    role: "editor",
    status: "active",
  }

  assert.equal(
    normalizeWorkspaceMemberFormValue({ ...valid, name: "   " }),
    null
  )
  assert.equal(
    normalizeWorkspaceMemberFormValue({ ...valid, email: "invalid" }),
    null
  )
  assert.equal(
    normalizeWorkspaceMemberFormValue({ ...valid, role: "admin" }),
    null
  )
  assert.equal(
    normalizeWorkspaceMemberFormValue({ ...valid, status: "pending" }),
    null
  )
})
