"use client"

import {
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type RefObject,
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
import type { BoardLabel } from "@/features/project/board"
import {
  createDuplicateWorkItemFormValue,
  createWorkItemFormValue,
  getEditableWorkItemFields,
  haveSameEditableWorkItemFields,
  validateWorkItemFormValue,
} from "../form"
import type {
  EditableWorkItemFields,
  WorkItem,
  WorkItemStatus,
} from "../model"
import type { WorkItemStagesByBoardId } from "../dependencies"
import { WorkItemDetails } from "./work-item-details"
import type { WorkItemDocumentOption } from "./work-item-documents-field"
import { WorkItemForm } from "./work-item-form"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

type ExistingTaskScreen = "view" | "edit" | "duplicate"

interface WorkItemDialogProps {
  mode: "create" | "view"
  open: boolean
  projectId: string
  boardTitle: string
  boardStage: WorkItemStatus
  boardLabels: readonly BoardLabel[]
  projectWorkItems: readonly WorkItem[]
  stagesByBoardId: WorkItemStagesByBoardId
  documents: readonly WorkItemDocumentOption[]
  workItem: WorkItem | null
  initialDueDate?: string
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onCreate: (fields: EditableWorkItemFields) => boolean
  onSave: (
    workItemId: string,
    fields: EditableWorkItemFields
  ) => boolean
  onDelete: (workItemId: string) => boolean
  onLinkDocument: (workItemId: string, resourceId: string) => boolean
  onUnlinkDocument: (workItemId: string, resourceId: string) => boolean
  onCreateAndLinkDocument: (
    workItemId: string,
    title: string
  ) => boolean
}

export function WorkItemDialog({
  mode,
  open,
  projectId,
  boardTitle,
  boardStage,
  boardLabels,
  projectWorkItems,
  stagesByBoardId,
  documents,
  workItem,
  initialDueDate = "",
  finalFocus,
  onOpenChange,
  onCreate,
  onSave,
  onDelete,
  onLinkDocument,
  onUnlinkDocument,
  onCreateAndLinkDocument,
}: WorkItemDialogProps) {
  const [existingTaskScreen, setExistingTaskScreen] =
    useState<ExistingTaskScreen>("view")
  const [draft, setDraft] = useState(() =>
    createWorkItemFormValue(workItem, mode === "create" ? initialDueDate : "")
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const errorRef = useRef<HTMLParagraphElement | null>(null)
  const isCreating = mode === "create" || existingTaskScreen === "duplicate"
  const isFormScreen = isCreating || existingTaskScreen === "edit"

  function focusError(message: string) {
    setError(message)
    requestAnimationFrame(() => {
      errorRef.current?.focus()
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateWorkItemFormValue(draft)

    if (!validation.ok) {
      focusError(validation.message)
      return
    }

    const fields = validation.fields

    if (
      !isCreating &&
      workItem &&
      haveSameEditableWorkItemFields(
        getEditableWorkItemFields(workItem),
        fields
      )
    ) {
      focusError("Change at least one field before saving.")
      return
    }

    const saved =
      isCreating
        ? onCreate(fields)
        : workItem !== null && onSave(workItem.id, fields)

    if (!saved) {
      focusError(
        "The task could not be saved because a selected label, dependency, or document is no longer valid."
      )
      return
    }

    setError(null)

    if (isCreating) {
      onOpenChange(false)
      return
    }

    setConfirmingDelete(false)
    setExistingTaskScreen("view")
  }

  function handleStartEditing() {
    if (!workItem) {
      return
    }

    setDraft(createWorkItemFormValue(workItem))
    setError(null)
    setConfirmingDelete(false)
    setExistingTaskScreen("edit")
  }

  function handleDuplicate() {
    if (!workItem) return

    setDraft(createDuplicateWorkItemFormValue(workItem))
    setError(null)
    setConfirmingDelete(false)
    setExistingTaskScreen("duplicate")
  }

  function handleCancel() {
    setError(null)
    setConfirmingDelete(false)

    if (mode === "create") {
      onOpenChange(false)
      return
    }

    setExistingTaskScreen("view")
  }

  function handleConfirmDelete() {
    if (!workItem || !onDelete(workItem.id)) {
      focusError("The task could not be deleted.")
      return
    }

    onOpenChange(false)
  }

  if (mode === "view" && !workItem) {
    return null
  }

  let dialogTitle = "Create task"

  if (existingTaskScreen === "duplicate") {
    dialogTitle = "Duplicate task"
  } else if (mode === "view") {
    dialogTitle =
      existingTaskScreen === "edit"
        ? "Edit task"
        : `View task: ${workItem?.title}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={finalFocus}
        className="flex max-w-3xl flex-col overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b bg-popover py-5 pl-6 pr-14">
          <DialogTitle className="wrap-anywhere">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="wrap-anywhere">
            Board: {boardTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 wrap-anywhere">
          {isFormScreen ? (
            <form
              id="work-item-form"
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              <WorkItemForm
                value={draft}
                projectId={projectId}
                boardLabels={boardLabels}
                documents={documents}
                workItemId={isCreating ? null : workItem?.id ?? null}
                projectWorkItems={projectWorkItems}
                stagesByBoardId={stagesByBoardId}
                onChange={(value) => {
                  setDraft(value)
                  setError(null)
                }}
              />
              <DialogError errorRef={errorRef}>{error}</DialogError>
            </form>
          ) : workItem ? (
            <WorkItemDetails
              workItem={workItem}
              boardTitle={boardTitle}
              boardStage={boardStage}
              boardLabels={boardLabels}
              projectWorkItems={projectWorkItems}
              stagesByBoardId={stagesByBoardId}
              documents={documents}
              onLinkDocument={onLinkDocument}
              onUnlinkDocument={onUnlinkDocument}
              onCreateAndLinkDocument={onCreateAndLinkDocument}
            />
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t bg-popover px-6 py-4 sm:items-center sm:justify-between">
          {isFormScreen ? (
            <>
              <div>
                {mode === "view" &&
                existingTaskScreen === "edit" &&
                workItem ? (
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
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="work-item-form"
                  disabled={!draft.title.trim()}
                >
                  {isCreating ? "Create task" : "Save changes"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDuplicate}>
                  Duplicate
                </Button>
                <Button type="button" onClick={handleStartEditing}>
                  Edit task
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogError({
  children,
  errorRef,
}: {
  children: string | null
  errorRef: RefObject<HTMLParagraphElement | null>
}) {
  return (
    <p
      ref={errorRef}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
      className="min-h-5 text-xs text-destructive"
    >
      {children}
    </p>
  )
}
