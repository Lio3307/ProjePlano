"use client"

import { useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import { WORK_ITEM_PRIORITIES, type WorkItemPriority, type WorkItem } from "@/features/work-item/model"
import { WORK_ITEM_PRIORITY_LABELS } from "@/features/work-item/components/work-item-meta"
import { selectProjectViews, selectTaskBoards } from "../selectors"
import { useProjectStore } from "../store-provider"
import { BulkTaskDueDate } from "./bulk-task-due-date"

const SELECT_CLASS = "h-11 min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm"

export function BulkTaskActions({ workItems, onApplied, onClear }: {
  workItems: readonly WorkItem[]
  onApplied: (message: string) => void
  onClear: () => void
}) {
  const updatePriorities = useProjectStore(state => state.updateWorkItemPriorities)
  const moveWorkItems = useProjectStore(state => state.moveWorkItems)
  const updateLabels = useProjectStore(state => state.updateWorkItemLabels)
  const [priority, setPriority] = useState<WorkItemPriority | "">("")
  const [boardId, setBoardId] = useState("")
  const [labelId, setLabelId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const projectId = workItems.length > 0 && workItems.every(item => item.projectId === workItems[0].projectId)
    ? workItems[0].projectId : null
  const boards = useProjectStore(useShallow(state => projectId
    ? selectProjectViews(state, projectId).flatMap(view => view.type === "board" ? selectTaskBoards(state, projectId, view.id) : [])
    : []))
  const target = boards.find(board => board.id === boardId)
  const labels = useProjectStore(useShallow(state => projectId
    ? selectProjectViews(state, projectId).flatMap(view => view.type === "board" ? view.labels : []) : []))
  const label = labels.find(candidate => candidate.id === labelId)

  function finish(success: boolean, message: string) {
    if (success) {
      onApplied(message + " for " + workItems.length + " selected tasks.")
      return
    }
    setError("Could not apply the change. Check the selected tasks and destination. No tasks changed.")
    requestAnimationFrame(() => errorRef.current?.focus())
  }

  return (
    <section aria-label="Selected task actions" className="space-y-3">
      <BulkTaskDueDate workItems={workItems} onClear={onClear}
        onApplied={() => onApplied("Deadline updated for " + workItems.length + " selected tasks.")} />
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/40 p-4">
        <form className="flex min-w-0 flex-wrap items-end gap-3" onSubmit={event => {
          event.preventDefault()
          if (priority) finish(updatePriorities(workItems.map(item => item.id), priority), "Priority applied")
        }}>
          <label className="grid min-w-0 gap-1.5 text-sm font-medium">
            New priority
            <select required className={SELECT_CLASS} value={priority} onChange={event => {
              setPriority(WORK_ITEM_PRIORITIES.find(value => value === event.target.value) ?? "")
              setError(null)
            }}>
              <option value="">Select priority</option>
              {WORK_ITEM_PRIORITIES.map(value => <option key={value} value={value}>{WORK_ITEM_PRIORITY_LABELS[value]}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!priority || workItems.every(item => item.priority === priority)}>Apply priority</Button>
        </form>
        <form className="flex min-w-0 flex-wrap items-end gap-3" onSubmit={event => {
          event.preventDefault()
          if (target) finish(moveWorkItems(workItems.map(item => item.id), target.id), "Board applied")
        }}>
          <label className="grid min-w-0 gap-1.5 text-sm font-medium">
            Destination Board
            <select required className={SELECT_CLASS} disabled={!projectId} value={target?.id ?? ""}
              onChange={event => { setBoardId(event.target.value); setError(null) }}>
              <option value="">Select Board</option>
              {boards.map(board => <option key={board.id} value={board.id}>{board.title}{board.stage === "done" ? " (Completed)" : ""}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!target || workItems.every(item => item.boardId === target.id)}>Move tasks</Button>
        </form>
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <label className="grid min-w-0 gap-1.5 text-sm font-medium">
            Label
            <select className={SELECT_CLASS} disabled={!projectId || labels.length === 0} value={label?.id ?? ""}
              onChange={event => { setLabelId(event.target.value); setError(null) }}>
              <option value="">{projectId && labels.length === 0 ? "No labels available" : "Select label"}</option>
              {labels.map(label => <option key={label.id} value={label.id}>{label.name}</option>)}
            </select>
          </label>
          <Button type="button" disabled={!label || workItems.every(item => item.labelIds.includes(label.id))}
            onClick={() => { if (label) finish(updateLabels(workItems.map(item => item.id), label.id, "add"), "Label added: " + label.name) }}>
            Add label
          </Button>
          <Button type="button" variant="outline" disabled={!label || workItems.every(item => !item.labelIds.includes(label.id))}
            onClick={() => { if (label) finish(updateLabels(workItems.map(item => item.id), label.id, "remove"), "Label removed: " + label.name) }}>
            Remove label
          </Button>
        </div>
        {!projectId ? <p className="w-full text-sm text-muted-foreground">Select tasks from one project to move Boards or change labels.</p> : null}
        <p ref={errorRef} role="alert" tabIndex={-1} className={error ? "w-full text-sm text-destructive" : "sr-only"}>{error}</p>
      </div>
    </section>
  )
}
