"use client"

import { useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkItem } from "@/features/work-item/model"
import { useProjectStore } from "../store-provider"

export function BulkTaskDueDate({ workItems, onApplied, onClear }: {
  workItems: readonly WorkItem[]
  onApplied: () => void
  onClear: () => void
}) {
  const updateDueDates = useProjectStore(state => state.updateWorkItemDueDates)
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const conflict = workItems.find(item => item.startDate && item.startDate > dueDate)
    if (conflict || !updateDueDates(workItems.map(item => item.id), dueDate)) {
      setError(conflict
        ? "Deadline is before the start date of " + conflict.title + ". No deadlines changed."
        : "Could not update deadlines. Check the date and selected tasks. No deadlines changed.")
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    onApplied()
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/40 p-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Deadline for {workItems.length} selected tasks
        <Input type="date" required value={dueDate} onChange={event => { setDueDate(event.target.value); setError(null) }} />
      </label>
      <Button type="submit" disabled={!dueDate || workItems.every(item => item.dueDate === dueDate)}>Apply deadline</Button>
      <Button type="button" variant="ghost" onClick={onClear}>Clear selection</Button>
      <p ref={errorRef} role="alert" tabIndex={-1} className={error ? "w-full text-sm text-destructive" : "sr-only"}>{error}</p>
    </form>
  )
}
