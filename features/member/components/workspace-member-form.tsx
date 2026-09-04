"use client"

import { Input } from "@/components/ui/input"
import type { WorkspaceMemberFormValue } from "../form"
import {
  WORKSPACE_MEMBER_ROLES,
  WORKSPACE_MEMBER_STATUSES,
} from "../model"

const CONTROL_CLASS =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"

type WorkspaceMemberFormProps = {
  value: WorkspaceMemberFormValue
  disabled?: boolean
  onChange: (value: WorkspaceMemberFormValue) => void
}

export function WorkspaceMemberForm({
  value,
  disabled,
  onChange,
}: WorkspaceMemberFormProps) {
  function setField<Key extends keyof WorkspaceMemberFormValue>(
    key: Key,
    nextValue: WorkspaceMemberFormValue[Key]
  ) {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="workspace-member-name"
          className="text-xs font-medium"
        >
          Name
        </label>
        <Input
          id="workspace-member-name"
          name="memberName"
          value={value.name}
          required
          autoFocus
          autoComplete="name"
          disabled={disabled}
          placeholder="Maya Chen"
          onChange={(event) => setField("name", event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="workspace-member-email"
          className="text-xs font-medium"
        >
          Email
        </label>
        <Input
          id="workspace-member-email"
          name="memberEmail"
          type="email"
          value={value.email}
          required
          autoComplete="email"
          disabled={disabled}
          placeholder="maya@example.com"
          onChange={(event) => setField("email", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="workspace-member-role"
            className="text-xs font-medium"
          >
            Role
          </label>
          <select
            id="workspace-member-role"
            name="memberRole"
            className={CONTROL_CLASS}
            value={value.role}
            disabled={disabled}
            onChange={(event) => {
              const role = WORKSPACE_MEMBER_ROLES.find(
                (candidate) => candidate === event.target.value
              )

              if (role) {
                setField("role", role)
              }
            }}
          >
            {WORKSPACE_MEMBER_ROLES.map((role) => (
              <option key={role} value={role}>
                {formatOptionLabel(role)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="workspace-member-status"
            className="text-xs font-medium"
          >
            Status
          </label>
          <select
            id="workspace-member-status"
            name="memberStatus"
            className={CONTROL_CLASS}
            value={value.status}
            disabled={disabled}
            onChange={(event) => {
              const status = WORKSPACE_MEMBER_STATUSES.find(
                (candidate) => candidate === event.target.value
              )

              if (status) {
                setField("status", status)
              }
            }}
          >
            {WORKSPACE_MEMBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatOptionLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function formatOptionLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
