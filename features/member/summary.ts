import type { WorkspaceMember } from "./model.ts"

export type WorkspaceMemberAssignment = {
  projectId: string
  stage: string
  assigneeId: string | null
}

export type WorkspaceMemberSummary = {
  member: WorkspaceMember
  activeTaskCount: number
  projectCount: number
  assignmentCount: number
}

export function buildWorkspaceMemberSummaries(
  members: readonly WorkspaceMember[],
  assignments: readonly WorkspaceMemberAssignment[]
): WorkspaceMemberSummary[] {
  return members.map((member) => {
    const memberAssignments = assignments.filter(
      (assignment) => assignment.assigneeId === member.id
    )

    return {
      member: { ...member },
      activeTaskCount: memberAssignments.filter(
        (assignment) => assignment.stage !== "done"
      ).length,
      projectCount: new Set(
        memberAssignments.map((assignment) => assignment.projectId)
      ).size,
      assignmentCount: memberAssignments.length,
    }
  })
}

export function countMemberAssignments(
  assignments: readonly WorkspaceMemberAssignment[],
  memberId: string
) {
  return assignments.filter(
    (assignment) => assignment.assigneeId === memberId
  ).length
}
