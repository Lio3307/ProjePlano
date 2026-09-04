"use client"

import { useState, type ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WorkspaceMember } from "../model"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

type RemoveWorkspaceMemberDialogProps = {
  member: WorkspaceMember
  assignmentCount: number
  open: boolean
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onConfirm: (memberId: string) => boolean
}

export function RemoveWorkspaceMemberDialog({
  member,
  assignmentCount,
  open,
  finalFocus,
  onOpenChange,
  onConfirm,
}: RemoveWorkspaceMemberDialogProps) {
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (!onConfirm(member.id)) {
      setError("The member could not be removed.")
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent finalFocus={finalFocus} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member?</DialogTitle>
          <DialogDescription>
            {member.name} will be removed from this workspace. This mock
            action resets after a full page reload.
          </DialogDescription>
        </DialogHeader>

        <p className="mt-4 text-sm text-muted-foreground">
          {assignmentCount === 0
            ? "This member has no task assignments."
            : `${assignmentCount} task ${
                assignmentCount === 1 ? "assignment" : "assignments"
              } will be removed; all affected assignments will be cleared.`}
        </p>

        <p
          role="alert"
          aria-live="polite"
          className="mt-3 min-h-5 text-xs text-destructive"
        >
          {error}
        </p>

        <DialogFooter className="mt-5 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            aria-label={"Remove " + member.name}
            onClick={handleConfirm}
          >
            Remove member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
