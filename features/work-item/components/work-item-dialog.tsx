"use client"

import { useState, type ComponentProps, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createWorkItemFormValue,
  getEditableWorkItemFields,
  haveSameEditableWorkItemFields,
  normalizeWorkItemFormValue,
} from "../form"
import type { EditableWorkItemFields, WorkItem } from "../model"
import { WorkItemForm } from "./work-item-form"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

interface WorkItemDialogProps {
  mode: "create" | "edit"
  open: boolean
  workItem: WorkItem | null
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onCreate: (fields: EditableWorkItemFields) => boolean
  onSave: (
    workItemId: string,
    fields: EditableWorkItemFields
  ) => boolean
  onDelete: (workItemId: string) => boolean
}

export function WorkItemDialog({
  mode,
  open,
  workItem,
  finalFocus,
  onOpenChange,
  onCreate,
  onSave,
  onDelete,
}: WorkItemDialogProps) {
  const [draft, setDraft] = useState(() =>
    createWorkItemFormValue(workItem)
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = normalizeWorkItemFormValue(draft)

    if (!fields) {
      setError(
        "Check the title, date, estimate, labels, and checklist values."
      )
      return
    }

    if (
      mode === "edit" &&
      workItem &&
      haveSameEditableWorkItemFields(
        getEditableWorkItemFields(workItem),
        fields
      )
    ) {
      setError("Change at least one field before saving.")
      return
    }

    const saved =
      mode === "create"
        ? onCreate(fields)
        : workItem !== null && onSave(workItem.id, fields)

    if (!saved) {
      setError(
        "The task could not be saved. Review the values and try again."
      )
      return
    }

    onOpenChange(false)
  }

  function handleConfirmDelete() {
    if (!workItem || !onDelete(workItem.id)) {
      setError("The task could not be deleted.")
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={finalFocus}
        className="flex max-w-3xl flex-col overflow-hidden p-0"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DialogHeader
              className="sticky top-0 z-10 border-b bg-popover py-5 pl-6 pr-14"
            >
              <DialogTitle>
                {mode === "create" ? "Create task" : "Edit task"}
              </DialogTitle>
              <DialogDescription>
                Board, Table, Calendar, and Overview use the same task
                record.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              <WorkItemForm
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

          <DialogFooter
            className="shrink-0 border-t bg-popover px-6 py-4 sm:items-center sm:justify-between"
          >
            <div>
              {mode === "edit" && workItem ? (
                confirmingDelete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-destructive">
                      Delete this task?
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleConfirmDelete}
                    >
                      Confirm delete
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Cancel delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete
                  </Button>
                )
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!draft.title.trim()}>
                {mode === "create" ? "Create task" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
