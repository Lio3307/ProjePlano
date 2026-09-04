import {
  getWorkspaceMemberInitials,
  isValidWorkspaceMember,
  type EditableWorkspaceMemberFields,
  type WorkspaceMember,
} from "../member/model.ts"
import type { ProjectWorkspaceState } from "./model"

export type CreateWorkspaceMemberInput = {
  id: string
  workspaceId: string
  fields: EditableWorkspaceMemberFields
}

export type UpdateWorkspaceMemberInput = {
  memberId: string
  fields: EditableWorkspaceMemberFields
}

export function createWorkspaceMemberState(
  state: ProjectWorkspaceState,
  input: CreateWorkspaceMemberInput
) {
  const member = createWorkspaceMember(input)

  if (
    state.membersById[member.id] ||
    !Object.hasOwn(state.memberIdsByWorkspaceId, member.workspaceId) ||
    !isValidWorkspaceMember(member) ||
    hasDuplicateWorkspaceEmail(state, member)
  ) {
    return state
  }

  return {
    ...state,
    memberIdsByWorkspaceId: {
      ...state.memberIdsByWorkspaceId,
      [member.workspaceId]: [
        ...state.memberIdsByWorkspaceId[member.workspaceId],
        member.id,
      ],
    },
    membersById: {
      ...state.membersById,
      [member.id]: member,
    },
  }
}

export function updateWorkspaceMemberState(
  state: ProjectWorkspaceState,
  input: UpdateWorkspaceMemberInput
) {
  const current = state.membersById[input.memberId]

  if (!current) {
    return state
  }

  const member: WorkspaceMember = {
    ...current,
    ...structuredClone(input.fields),
    initials: getWorkspaceMemberInitials(input.fields.name),
  }

  if (
    haveSameMemberValue(current, member) ||
    !isValidWorkspaceMember(member) ||
    hasDuplicateWorkspaceEmail(state, member, current.id)
  ) {
    return state
  }

  return {
    ...state,
    membersById: {
      ...state.membersById,
      [member.id]: member,
    },
  }
}

export function removeWorkspaceMemberState(
  state: ProjectWorkspaceState,
  memberId: string
) {
  const member = state.membersById[memberId]

  if (!member) {
    return state
  }

  const membersById = { ...state.membersById }
  delete membersById[memberId]

  let workItemsById = state.workItemsById

  for (const workItem of Object.values(state.workItemsById)) {
    if (workItem.assigneeId === memberId) {
      if (workItemsById === state.workItemsById) {
        workItemsById = { ...state.workItemsById }
      }

      workItemsById[workItem.id] = { ...workItem, assigneeId: null }
    }
  }

  return {
    ...state,
    memberIdsByWorkspaceId: {
      ...state.memberIdsByWorkspaceId,
      [member.workspaceId]: (
        state.memberIdsByWorkspaceId[member.workspaceId] ?? []
      ).filter((id) => id !== memberId),
    },
    membersById,
    workItemsById,
  }
}

function createWorkspaceMember(
  input: CreateWorkspaceMemberInput
): WorkspaceMember {
  const fields = structuredClone(input.fields)

  return {
    id: input.id,
    workspaceId: input.workspaceId,
    ...fields,
    initials: getWorkspaceMemberInitials(fields.name),
  }
}

function hasDuplicateWorkspaceEmail(
  state: ProjectWorkspaceState,
  member: WorkspaceMember,
  ignoredMemberId?: string
) {
  const email = member.email.toLocaleLowerCase("en")
  const memberIds = state.memberIdsByWorkspaceId[member.workspaceId] ?? []

  return memberIds.some((memberId) => {
    const existing = state.membersById[memberId]

    return (
      memberId !== ignoredMemberId &&
      existing?.email.toLocaleLowerCase("en") === email
    )
  })
}

function haveSameMemberValue(
  left: WorkspaceMember,
  right: WorkspaceMember
) {
  return JSON.stringify(left) === JSON.stringify(right)
}
