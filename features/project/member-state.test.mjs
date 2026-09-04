import assert from "node:assert/strict"
import test from "node:test"

import { createProjectSeedState } from "./seed-data.ts"
import {
  createWorkspaceMemberState,
  removeWorkspaceMemberState,
  updateWorkspaceMemberState,
} from "./member-state.ts"

function createInput(overrides = {}) {
  return {
    id: "member-project-alpha-raka-putra",
    workspaceId: "project-alpha",
    fields: {
      name: "Raka Putra",
      email: "raka.putra@example.com",
      role: "editor",
      status: "active",
    },
    ...overrides,
  }
}

test("creates a detached member and appends its ID to the workspace", () => {
  const state = createProjectSeedState()
  const input = createInput()
  const result = createWorkspaceMemberState(state, input)

  input.fields.name = "Changed outside state"

  assert.notEqual(result, state)
  assert.equal(state.membersById[input.id], undefined)
  assert.equal(result.membersById[input.id].name, "Raka Putra")
  assert.equal(result.membersById[input.id].initials, "RP")
  assert.equal(
    result.memberIdsByWorkspaceId["project-alpha"].at(-1),
    input.id
  )
})

test("rejects duplicate IDs, unknown workspaces, and invalid fields", () => {
  const state = createProjectSeedState()

  assert.equal(
    createWorkspaceMemberState(
      state,
      createInput({ id: "member-project-alpha-aurelio" })
    ),
    state
  )
  assert.equal(
    createWorkspaceMemberState(
      state,
      createInput({ workspaceId: "missing-workspace" })
    ),
    state
  )
  assert.equal(
    createWorkspaceMemberState(
      state,
      createInput({
        fields: { ...createInput().fields, email: "not-an-email" },
      })
    ),
    state
  )
})

test("rejects duplicate workspace email case-insensitively", () => {
  const state = createProjectSeedState()
  const existingId = "member-project-alpha-aurelio"
  const stateWithUppercaseFixture = {
    ...state,
    membersById: {
      ...state.membersById,
      [existingId]: {
        ...state.membersById[existingId],
        email: "AURELIO@example.com",
      },
    },
  }

  assert.equal(
    createWorkspaceMemberState(
      stateWithUppercaseFixture,
      createInput({
        fields: {
          ...createInput().fields,
          email: "aurelio@example.com",
        },
      })
    ),
    stateWithUppercaseFixture
  )
})

test("allows the same email in another workspace", () => {
  const state = createProjectSeedState()
  const input = createInput({
    id: "member-project-beta-raka-putra",
    workspaceId: "project-beta",
    fields: {
      ...createInput().fields,
      email: "maya.chen@example.com",
    },
  })
  const result = createWorkspaceMemberState(state, input)

  assert.notEqual(result, state)
  assert.equal(result.membersById[input.id].workspaceId, "project-beta")
})

test("updates a member and recomputes initials", () => {
  const state = createProjectSeedState()
  const memberId = "member-project-alpha-maya-chen"
  const fields = {
    name: "Maya Putri",
    email: "maya.putri@example.com",
    role: "viewer",
    status: "inactive",
  }
  const result = updateWorkspaceMemberState(state, {
    memberId,
    fields,
  })

  fields.name = "Changed outside state"

  assert.notEqual(result, state)
  assert.equal(result.membersById[memberId].name, "Maya Putri")
  assert.equal(result.membersById[memberId].initials, "MP")
  assert.equal(state.membersById[memberId].name, "Maya Chen")
})

test("rejects missing, duplicate-email, invalid, and no-op updates", () => {
  const state = createProjectSeedState()
  const member = state.membersById["member-project-alpha-maya-chen"]

  assert.equal(
    updateWorkspaceMemberState(state, {
      memberId: "missing-member",
      fields: createInput().fields,
    }),
    state
  )
  assert.equal(
    updateWorkspaceMemberState(state, {
      memberId: member.id,
      fields: {
        name: member.name,
        email: "hadi.pratama@example.com",
        role: member.role,
        status: member.status,
      },
    }),
    state
  )
  assert.equal(
    updateWorkspaceMemberState(state, {
      memberId: member.id,
      fields: { ...createInput().fields, name: " " },
    }),
    state
  )
  assert.equal(
    updateWorkspaceMemberState(state, {
      memberId: member.id,
      fields: {
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
    }),
    state
  )
})

test("removes a member and clears assignments atomically", () => {
  const state = createProjectSeedState()
  const memberId = "member-project-alpha-maya-chen"
  const workspaceId = "project-alpha"
  const assignedItemId = "work-item-2-audit-onboarding"
  const removed = removeWorkspaceMemberState(state, memberId)

  assert.notEqual(removed, state)
  assert.equal(removed.membersById[memberId], undefined)
  assert.equal(
    removed.memberIdsByWorkspaceId[workspaceId].includes(memberId),
    false
  )
  assert.equal(removed.workItemsById[assignedItemId].assigneeId, null)
  assert.equal(state.workItemsById[assignedItemId].assigneeId, memberId)
  assert.equal(removeWorkspaceMemberState(removed, memberId), removed)
})
