"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { BulkWorkItemChange, BulkWorkItemField } from "../bulk-work-item-history"
import { useProjectStore } from "../store-provider"

const CHANGE_LABELS: Record<BulkWorkItemField, string> = {
  dueDate: "Deadlines changed", priority: "Priorities changed",
  boardId: "Tasks moved", labelIds: "Labels changed",
}

export function BulkTaskUndo({ onUndone }: { onUndone: () => void }) {
  const change = useProjectStore(state => state.lastBulkWorkItemChange)
  const undo = useProjectStore(state => state.undoBulkWorkItemChange)
  const [failedChange, setFailedChange] = useState<BulkWorkItemChange | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  if (!change) return null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4">
      <p role="status" className="min-w-0 flex-1 text-sm">{CHANGE_LABELS[change.field]}: {change.entries.length} tasks</p>
      <Button type="button" variant="outline" onClick={() => {
        if (undo()) {
          onUndone()
        } else {
          setFailedChange(change)
          requestAnimationFrame(() => errorRef.current?.focus())
        }
      }}>Undo bulk change</Button>
      <p ref={errorRef} role="alert" tabIndex={-1} className={failedChange === change ? "w-full text-sm text-destructive" : "sr-only"}>
        {failedChange === change ? "Cannot undo because tasks, dates, labels or Boards have changed. No data was changed." : ""}
      </p>
    </div>
  )
}
