import assert from "node:assert/strict"
import test from "node:test"

import {
  buildWorkspaceMemberSummaries,
  countMemberAssignments,
} from "./summary.ts"

const members = [
  {
    id: "member-a",
    workspaceId: "project-alpha",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    initials: "MC",
    role: "editor",
    status: "active",
  },
  {
    id: "member-b",
    workspaceId: "project-alpha",
    name: "Hadi Pratama",
    email: "hadi.pratama@example.com",
    initials: "HP",
    role: "viewer",
    status: "inactive",
  },
]

const assignments = [
  {
    projectId: "project-a",
    stage: "todo",
    assigneeId: "member-a",
  },
  {
    projectId: "project-a",
    stage: "done",
    assigneeId: "member-a",
  },
  {
    projectId: "project-b",
    stage: "review",
    assigneeId: "member-a",
  },
  {
    projectId: "project-b",
    stage: "done",
    assigneeId: "member-b",
  },
  {
    projectId: "project-c",
    stage: "todo",
    assigneeId: null,
  },
]

test("derives member workload without storing counters", () => {
  const summaries = buildWorkspaceMemberSummaries(members, assignments)

  assert.deepEqual(
    summaries.map((summary) => ({
      memberId: summary.member.id,
      activeTaskCount: summary.activeTaskCount,
      projectCount: summary.projectCount,
      assignmentCount: summary.assignmentCount,
    })),
    [
      {
        memberId: "member-a",
        activeTaskCount: 2,
        projectCount: 2,
        assignmentCount: 3,
      },
      {
        memberId: "member-b",
        activeTaskCount: 0,
        projectCount: 1,
        assignmentCount: 1,
      },
    ]
  )
})

test("counts all assignments for removal confirmation", () => {
  assert.equal(countMemberAssignments(assignments, "member-a"), 3)
  assert.equal(countMemberAssignments(assignments, "missing"), 0)
})

test("returns detached summary records in the supplied member order", () => {
  const summaries = buildWorkspaceMemberSummaries(members, [])

  assert.deepEqual(
    summaries.map((summary) => summary.member.id),
    ["member-a", "member-b"]
  )
  assert.notStrictEqual(summaries[0].member, members[0])
})
