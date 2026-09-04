import assert from "node:assert/strict"
import test from "node:test"

import {
  getWorkspaceMemberInitials,
  isValidWorkspaceMember,
  isValidWorkspaceMemberEmail,
} from "./model.ts"
import {
  WORKSPACE_MEMBER_IDS,
  WORKSPACE_MEMBERS,
} from "./mock-data.ts"

function createMember(overrides = {}) {
  return {
    id: "member-a",
    workspaceId: "project-alpha",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    initials: "MC",
    role: "editor",
    status: "active",
    ...overrides,
  }
}

test("derives at most two uppercase initials", () => {
  assert.equal(getWorkspaceMemberInitials("maya"), "M")
  assert.equal(
    getWorkspaceMemberInitials("  Maya   Chen Putri  "),
    "MC"
  )
  assert.equal(getWorkspaceMemberInitials(" "), "")
})

test("validates normalized member records", () => {
  assert.equal(isValidWorkspaceMember(createMember()), true)
  assert.equal(
    isValidWorkspaceMember(
      createMember({ role: "owner", status: "inactive" })
    ),
    true
  )
})

test("rejects malformed email values", () => {
  assert.equal(isValidWorkspaceMemberEmail("maya@example.com"), true)

  for (const email of [
    "maya",
    "maya@example",
    " maya@example.com",
    "maya @example.com",
  ]) {
    assert.equal(isValidWorkspaceMemberEmail(email), false, email)
    assert.equal(
      isValidWorkspaceMember(createMember({ email })),
      false,
      email
    )
  }
})

test("rejects unnormalized identity and text fields", () => {
  for (const overrides of [
    { id: " member-a" },
    { id: " " },
    { workspaceId: "project-alpha " },
    { workspaceId: " " },
    { name: " Maya Chen" },
    { name: "Maya  Chen" },
    { name: " " },
    { email: "MAYA.CHEN@example.com" },
  ]) {
    assert.equal(isValidWorkspaceMember(createMember(overrides)), false)
  }
})

test("rejects unsupported enums and stale initials", () => {
  assert.equal(
    isValidWorkspaceMember(createMember({ role: "admin" })),
    false
  )
  assert.equal(
    isValidWorkspaceMember(createMember({ status: "invited" })),
    false
  )
  assert.equal(
    isValidWorkspaceMember(createMember({ initials: "XX" })),
    false
  )
})

test("provides valid deterministic mock members for every workspace", () => {
  assert.equal(WORKSPACE_MEMBERS.length, 14)
  assert.equal(
    WORKSPACE_MEMBERS.every(isValidWorkspaceMember),
    true
  )
  assert.equal(
    new Set(WORKSPACE_MEMBERS.map((member) => member.id)).size,
    WORKSPACE_MEMBERS.length
  )
  assert.equal(
    new Set(WORKSPACE_MEMBERS.map((member) => member.email)).size,
    WORKSPACE_MEMBERS.length
  )
  assert.equal(
    WORKSPACE_MEMBERS.find(
      (member) => member.id === WORKSPACE_MEMBER_IDS.bimaSantoso
    )?.status,
    "inactive"
  )
})
