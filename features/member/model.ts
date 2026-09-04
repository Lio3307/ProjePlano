export const WORKSPACE_MEMBER_ROLES = [
  "owner",
  "editor",
  "viewer",
] as const

export const WORKSPACE_MEMBER_STATUSES = [
  "active",
  "inactive",
] as const

export type WorkspaceMemberRole =
  (typeof WORKSPACE_MEMBER_ROLES)[number]
export type WorkspaceMemberStatus =
  (typeof WORKSPACE_MEMBER_STATUSES)[number]

export type WorkspaceMember = {
  id: string
  workspaceId: string
  name: string
  email: string
  initials: string
  role: WorkspaceMemberRole
  status: WorkspaceMemberStatus
}

export type EditableWorkspaceMemberFields = Pick<
  WorkspaceMember,
  "name" | "email" | "role" | "status"
>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getWorkspaceMemberInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export function isValidWorkspaceMemberEmail(email: string) {
  return (
    email.trim() === email &&
    email.toLocaleLowerCase("en") === email &&
    EMAIL_PATTERN.test(email)
  )
}

export function isValidWorkspaceMember(member: WorkspaceMember) {
  const roleIsValid = WORKSPACE_MEMBER_ROLES.some(
    (role) => role === member.role
  )
  const statusIsValid = WORKSPACE_MEMBER_STATUSES.some(
    (status) => status === member.status
  )

  return (
    isNormalizedIdentity(member.id) &&
    isNormalizedIdentity(member.workspaceId) &&
    isNormalizedName(member.name) &&
    isValidWorkspaceMemberEmail(member.email) &&
    member.initials === getWorkspaceMemberInitials(member.name) &&
    roleIsValid &&
    statusIsValid
  )
}

function isNormalizedIdentity(value: string) {
  return value.length > 0 && value.trim() === value && !/\s/.test(value)
}

function isNormalizedName(value: string) {
  return (
    value.length > 0 &&
    value.trim() === value &&
    value.replace(/\s+/g, " ") === value
  )
}
