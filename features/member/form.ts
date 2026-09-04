import {
  WORKSPACE_MEMBER_ROLES,
  WORKSPACE_MEMBER_STATUSES,
  isValidWorkspaceMemberEmail,
  type EditableWorkspaceMemberFields,
  type WorkspaceMember,
  type WorkspaceMemberRole,
  type WorkspaceMemberStatus,
} from "./model.ts"

export type WorkspaceMemberFormValue = {
  name: string
  email: string
  role: WorkspaceMemberRole
  status: WorkspaceMemberStatus
}

export function createWorkspaceMemberFormValue(
  member: WorkspaceMember | null
): WorkspaceMemberFormValue {
  if (!member) {
    return {
      name: "",
      email: "",
      role: "editor",
      status: "active",
    }
  }

  return {
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
  }
}

export function normalizeWorkspaceMemberFormValue(
  value: WorkspaceMemberFormValue
): EditableWorkspaceMemberFields | null {
  const name = value.name.trim().replace(/\s+/g, " ")
  const email = value.email.trim().toLocaleLowerCase("en")
  const roleIsValid = WORKSPACE_MEMBER_ROLES.some(
    (role) => role === value.role
  )
  const statusIsValid = WORKSPACE_MEMBER_STATUSES.some(
    (status) => status === value.status
  )

  if (
    !name ||
    !isValidWorkspaceMemberEmail(email) ||
    !roleIsValid ||
    !statusIsValid
  ) {
    return null
  }

  return {
    name,
    email,
    role: value.role,
    status: value.status,
  }
}
