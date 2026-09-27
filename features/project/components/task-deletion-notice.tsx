"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useProjectStore } from "../store-provider"
import type { WorkItemDeletion } from "../work-item-state"

export function TaskDeletionNotice() {
  const deletion = useProjectStore(state => state.lastWorkItemDeletion)
  const undoDeleteWorkItem = useProjectStore(state => state.undoDeleteWorkItem)
  const [restoredTitle, setRestoredTitle] = useState<string | null>(null)
  const [failedDeletion, setFailedDeletion] = useState<WorkItemDeletion | null>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)

  function undo() {
    if (!deletion) return
    if (!undoDeleteWorkItem()) {
      setFailedDeletion(deletion)
      return
    }
    setRestoredTitle(deletion.workItem.title)
    setFailedDeletion(null)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  return (
    <div className={deletion || restoredTitle ? "flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/40 px-4 py-2 sm:px-6" : "sr-only"}>
      <p ref={statusRef} role="status" aria-atomic="true" tabIndex={-1} className="min-w-0 flex-1 break-words text-sm">
        {deletion
          ? "Task deleted: " + deletion.workItem.title
          : restoredTitle ? "Task restored: " + restoredTitle : ""}
      </p>
      {deletion ? (
        <>
          <Button type="button" variant="outline" onClick={undo}>Undo</Button>
          {failedDeletion === deletion ? (
            <p role="alert" className="w-full text-sm text-destructive">
              Could not restore the task because its Board or related records changed. No data was changed.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
