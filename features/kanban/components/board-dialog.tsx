"use client"

import {
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  EditableTaskBoardFields,
  TaskBoard,
} from "@/features/project/task-board"
import {
  createTaskBoardFormValue,
  haveSameEditableTaskBoardFields,
  normalizeTaskBoardFormValue,
} from "../form"
import { BoardForm } from "./board-form"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

type BoardDialogProps = {
  open: boolean
  mode: "create" | "edit"
  board: TaskBoard | null
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onCreate: (fields: EditableTaskBoardFields) => boolean
  onSave: (
    boardId: string,
    fields: EditableTaskBoardFields
  ) => boolean
}

export function BoardDialog({
  open,
  mode,
  board,
  finalFocus,
  onOpenChange,
  onCreate,
  onSave,
}: BoardDialogProps) {
  const [draft, setDraft] = useState(() =>
    createTaskBoardFormValue(board)
  )
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement | null>(null)

  function focusError(message: string) {
    setError(message)
    requestAnimationFrame(() => {
      errorRef.current?.focus()
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = normalizeTaskBoardFormValue(draft)

    if (!fields) {
      focusError("Enter a Board name.")
      return
    }

    if (
      mode === "edit" &&
      board &&
      haveSameEditableTaskBoardFields(board, fields)
    ) {
      focusError("Change at least one Board field before saving.")
      return
    }

    const saved =
      mode === "create"
        ? onCreate(fields)
        : board !== null && onSave(board.id, fields)

    if (!saved) {
      focusError(
        "The Board could not be saved. Check for a duplicate Board name."
      )
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={finalFocus}
        className="flex max-w-xl flex-col overflow-hidden p-0"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <DialogHeader className="shrink-0 border-b bg-popover py-5 pl-6 pr-14">
            <DialogTitle>
              {mode === "create" ? "Create board" : "Board settings"}
            </DialogTitle>
            <DialogDescription>
              Configure one Board container. Labels are managed separately
              for the whole Kanban view.
            </DialogDescription>
          </DialogHeader>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <BoardForm
                value={draft}
                onChange={(value) => {
                  setDraft(value)
                  setError(null)
                }}
              />

              <p
                ref={errorRef}
                role="alert"
                aria-live="polite"
                tabIndex={-1}
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
            <Button type="submit" disabled={!draft.title.trim()}>
              {mode === "create" ? "Create board" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
