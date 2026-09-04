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
import { Input } from "@/components/ui/input"
import type { WorkItemDocumentOption } from "./work-item-documents-field"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

interface WorkItemDocumentDialogProps {
  open: boolean
  workItemId: string
  documents: readonly WorkItemDocumentOption[]
  linkedResourceIds: readonly string[]
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onLink: (workItemId: string, resourceId: string) => boolean
  onUnlink: (workItemId: string, resourceId: string) => boolean
  onCreateAndLink: (workItemId: string, title: string) => boolean
}

export function WorkItemDocumentDialog({
  open,
  workItemId,
  documents,
  linkedResourceIds,
  finalFocus,
  onOpenChange,
  onLink,
  onUnlink,
  onCreateAndLink,
}: WorkItemDocumentDialogProps) {
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleDocumentChange(resourceId: string, checked: boolean) {
    const changed = checked
      ? onLink(workItemId, resourceId)
      : onUnlink(workItemId, resourceId)

    setError(
      changed
        ? null
        : "The document relationship could not be changed."
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const documentTitle = title.trim()

    if (!documentTitle) {
      setError("Enter a document name.")
      return
    }

    if (!onCreateAndLink(workItemId, documentTitle)) {
      setError("The document could not be created and linked.")
      return
    }

    setTitle("")
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setError(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        finalFocus={finalFocus}
        className="flex max-w-lg flex-col overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b bg-popover py-5 pl-6 pr-14">
          <DialogTitle>Task documents</DialogTitle>
          <DialogDescription>
            Link existing project documents or create a blank document for
            this task.
          </DialogDescription>
        </DialogHeader>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium">
                Project documents
              </legend>
              {documents.length > 0 ? (
                <ul className="space-y-1">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/60">
                        <input
                          type="checkbox"
                          checked={linkedResourceIds.includes(document.id)}
                          onChange={(event) =>
                            handleDocumentChange(
                              document.id,
                              event.target.checked
                            )
                          }
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {document.title}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  This project has no documents yet.
                </p>
              )}
            </fieldset>

            <form
              className="space-y-3 border-t pt-4"
              onSubmit={handleSubmit}
            >
              <label className="grid gap-1.5 text-xs font-medium">
                New blank document
                <Input
                  value={title}
                  autoComplete="off"
                  placeholder="Task notes"
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <Button type="submit" disabled={!title.trim()}>
                Create and link
              </Button>
            </form>

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
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
