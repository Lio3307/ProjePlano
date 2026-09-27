"use client"

import { useMemo, useRef, useState } from "react"
import { Plus, UsersRound } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  selectWorkspaceMembers,
  selectWorkspaceWorkItemAssignments,
} from "@/features/project/selectors"
import { useProjectStore } from "@/features/project/store-provider"
import type { Workspace } from "@/features/workspace/types"
import type {
  EditableWorkspaceMemberFields,
  WorkspaceMember,
} from "../model"
import { buildWorkspaceMemberSummaries } from "../summary"
import { RemoveWorkspaceMemberDialog } from "./remove-workspace-member-dialog"
import { WorkspaceMemberDialog } from "./workspace-member-dialog"
import {
  WorkspaceMemberList,
  WorkspaceMemberTable,
} from "./workspace-member-table"

type MemberDialogSession =
  | { key: string; mode: "create" }
  | { key: string; mode: "edit"; member: WorkspaceMember }

type RemoveDialogSession = {
  key: string
  member: WorkspaceMember
  assignmentCount: number
}

export function WorkspaceMembersView({
  workspace,
}: {
  workspace: Workspace
}) {
  const members = useProjectStore(
    useShallow((state) => selectWorkspaceMembers(state, workspace.id))
  )
  const assignments = useProjectStore(
    useShallow((state) =>
      selectWorkspaceWorkItemAssignments(state, workspace.id)
    )
  )
  const {
    createWorkspaceMember,
    updateWorkspaceMember,
    removeWorkspaceMember,
  } = useProjectStore(
    useShallow((state) => ({
      createWorkspaceMember: state.createWorkspaceMember,
      updateWorkspaceMember: state.updateWorkspaceMember,
      removeWorkspaceMember: state.removeWorkspaceMember,
    }))
  )
  const summaries = useMemo(
    () => buildWorkspaceMemberSummaries(members, assignments),
    [assignments, members]
  )
  const isMobile = useIsMobile()
  const [memberDialog, setMemberDialog] =
    useState<MemberDialogSession | null>(null)
  const [removeDialog, setRemoveDialog] =
    useState<RemoveDialogSession | null>(null)
  const addMemberRef = useRef<HTMLButtonElement>(null)
  const dialogTriggerRef = useRef<HTMLButtonElement | null>(null)

  function openCreateDialog() {
    dialogTriggerRef.current = addMemberRef.current
    setMemberDialog({ key: crypto.randomUUID(), mode: "create" })
  }

  function openEditDialog(
    member: WorkspaceMember,
    trigger: HTMLButtonElement
  ) {
    dialogTriggerRef.current = trigger
    setMemberDialog({
      key: crypto.randomUUID(),
      mode: "edit",
      member,
    })
  }

  function openRemoveDialog(
    member: WorkspaceMember,
    trigger: HTMLButtonElement
  ) {
    const summary = summaries.find(
      (candidate) => candidate.member.id === member.id
    )

    dialogTriggerRef.current = trigger
    setRemoveDialog({
      key: crypto.randomUUID(),
      member,
      assignmentCount: summary?.assignmentCount ?? 0,
    })
  }

  function handleCreate(fields: EditableWorkspaceMemberFields) {
    return createWorkspaceMember({
      id: "member-" + workspace.id + "-" + crypto.randomUUID(),
      workspaceId: workspace.id,
      fields,
    })
  }

  const finalFocus = () =>
    dialogTriggerRef.current?.isConnected
      ? dialogTriggerRef.current
      : addMemberRef.current

  return (
    <section
      data-workspace-members={workspace.id}
      aria-labelledby="workspace-members-title"
      className="min-w-0 space-y-6 p-4 sm:p-6"
    >
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {workspace.title}
          </p>
          <h1
            id="workspace-members-title"
            className="mt-1 text-2xl font-semibold"
          >
            Members
          </h1>
        </div>

        <Button ref={addMemberRef} type="button" onClick={openCreateDialog}>
          <Plus aria-hidden="true" />
          Add member
        </Button>
      </header>

      {summaries.length > 0 ? (
        isMobile ? (
          <WorkspaceMemberList
            summaries={summaries}
            onEdit={openEditDialog}
            onRemove={openRemoveDialog}
          />
        ) : (
          <WorkspaceMemberTable
            summaries={summaries}
            onEdit={openEditDialog}
            onRemove={openRemoveDialog}
          />
        )
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <UsersRound
            aria-hidden="true"
            className="mx-auto size-5 text-muted-foreground"
          />
          <p className="mt-3 font-medium">No members yet</p>
          <Button className="mt-4" type="button" onClick={openCreateDialog}>
            <Plus aria-hidden="true" />
            Add member
          </Button>
        </div>
      )}

      {memberDialog ? (
        <WorkspaceMemberDialog
          key={memberDialog.key}
          mode={memberDialog.mode}
          open
          member={
            memberDialog.mode === "edit" ? memberDialog.member : null
          }
          finalFocus={finalFocus}
          onOpenChange={(open) => {
            if (!open) {
              setMemberDialog(null)
            }
          }}
          onCreate={handleCreate}
          onSave={(memberId, fields) =>
            updateWorkspaceMember({ memberId, fields })
          }
        />
      ) : null}

      {removeDialog ? (
        <RemoveWorkspaceMemberDialog
          key={removeDialog.key}
          member={removeDialog.member}
          assignmentCount={removeDialog.assignmentCount}
          open
          finalFocus={finalFocus}
          onOpenChange={(open) => {
            if (!open) {
              setRemoveDialog(null)
            }
          }}
          onConfirm={removeWorkspaceMember}
        />
      ) : null}
    </section>
  )
}
