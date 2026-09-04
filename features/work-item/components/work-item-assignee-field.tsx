"use client"

import { ChevronDown, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WorkspaceMember } from "@/features/member/model"

const UNASSIGNED_VALUE = "unassigned"

interface WorkItemAssigneeFieldProps {
  members: readonly WorkspaceMember[]
  value: string
  disabled?: boolean
  onChange: (memberId: string) => void
}

export function WorkItemAssigneeField({
  members,
  value,
  disabled,
  onChange,
}: WorkItemAssigneeFieldProps) {
  const selectedMember = members.find((member) => member.id === value)
  const availableMembers = members.filter(
    (member) => member.status === "active" || member.id === value
  )

  function handleValueChange(nextValue: string) {
    if (nextValue === UNASSIGNED_VALUE) {
      onChange("")
      return
    }

    const member = members.find((candidate) => candidate.id === nextValue)

    if (member?.status === "active") {
      onChange(member.id)
    }
  }

  return (
    <fieldset className="grid gap-1.5 text-xs font-medium" disabled={disabled}>
      <legend>Assignee</legend>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              disabled={disabled}
            />
          }
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            {selectedMember ? (
              <span
                aria-hidden="true"
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary"
              >
                {selectedMember.initials}
              </span>
            ) : (
              <UserRound aria-hidden="true" />
            )}
            <span className="truncate">
              {selectedMember?.name ?? "Unassigned"}
            </span>
          </span>
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={value || UNASSIGNED_VALUE}
            onValueChange={handleValueChange}
          >
            <DropdownMenuRadioItem value={UNASSIGNED_VALUE}>
              <UserRound aria-hidden="true" />
              Unassigned
            </DropdownMenuRadioItem>
            {availableMembers.map((member) => (
              <DropdownMenuRadioItem
                key={member.id}
                value={member.id}
                disabled={member.status === "inactive"}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary"
                >
                  {member.initials}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {member.name}
                </span>
                {member.status === "inactive" ? (
                  <span className="text-[10px] text-muted-foreground">
                    Inactive
                  </span>
                ) : null}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </fieldset>
  )
}
