"use client"

import { useState, type ComponentProps, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createWorkspaceMemberFormValue,
  normalizeWorkspaceMemberFormValue,
} from "../form"
import type {
  EditableWorkspaceMemberFields,
  WorkspaceMember,
} from "../model"
import { WorkspaceMemberForm } from "./workspace-member-form"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

type WorkspaceMemberDialogProps = {
  mode: "create" | "edit"
  open: boolean
  member: WorkspaceMember | null
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onCreate: (fields: EditableWorkspaceMemberFields) => boolean
  onSave: (
    memberId: string,
    fields: EditableWorkspaceMemberFields
  ) => boolean
}

export function WorkspaceMemberDialog({
  mode,
  open,
  member,
  finalFocus,
  onOpenChange,
  onCreate,
  onSave,
}: WorkspaceMemberDialogProps) {
  const [draft, setDraft] = useState(() =>
    createWorkspaceMemberFormValue(member)
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = normalizeWorkspaceMemberFormValue(draft)

    if (!fields) {
      setError("Enter a valid name, email, role, and status.")
      return
    }

    const saved =
      mode === "create"
        ? onCreate(fields)
        : member !== null && onSave(member.id, fields)

    if (!saved) {
      setError(
        "The member could not be saved. Check for a duplicate workspace email."
      )
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={finalFocus}
        className="flex max-w-lg flex-col overflow-hidden p-0"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <DialogHeader className="shrink-0 border-b bg-popover py-5 pl-6 pr-14">
            <DialogTitle>
              {mode === "create" ? "Add member" : "Edit member"}
            </DialogTitle>
          </DialogHeader>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <WorkspaceMemberForm
                value={draft}
                onChange={(value) => {
                  setDraft(value)
                  setError(null)
                }}
              />

              <p
                role="alert"
                aria-live="polite"
                className="min-h-5 text-xs text-destructive"
              >
                {error}
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-popover px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!draft.name.trim() || !draft.email.trim()}
            >
              {mode === "create" ? "Add member" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
