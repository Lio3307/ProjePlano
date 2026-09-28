"use client"

import { useState, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { WorkItem } from "@/features/work-item/model"
import type { ProjectWorkspaceState } from "../model"
import type { PlanningAction } from "../planning-state"
import { EMPTY_TASK_PLAN, type Recurrence, type TimeEntry } from "../planning"
import { PlanningField, planningSelectClass } from "./planning-controls"

export function TaskPlanningDialog({ task, state, today, finalFocus, onClose, onPlan, runningTaskId, onStartTimer, onStopTimer }: {
  task: WorkItem; state: ProjectWorkspaceState; today: string; finalFocus: RefObject<HTMLElement | null>
  onClose: () => void; onPlan: (action: PlanningAction) => boolean; runningTaskId: string | null
  onStartTimer: (id: string, date: string) => boolean; onStopTimer: () => boolean
}) {
  const plan = state.planning?.tasks[task.id] ?? EMPTY_TASK_PLAN
  const boards = Object.values(state.taskBoardsById).filter(board => board.projectId === task.projectId && board.stage !== "done")
  const [date, setDate] = useState(plan.date ?? "")
  const [minutes, setMinutes] = useState(plan.minutes === null ? "" : String(plan.minutes))
  const [frequency, setFrequency] = useState<Recurrence["frequency"] | "off">(plan.recurrence?.frequency ?? "off")
  const [interval, setIntervalValue] = useState(String(plan.recurrence?.interval ?? 1))
  const [boardId, setBoardId] = useState(plan.recurrence?.boardId ?? boards.find(board => board.id === task.boardId)?.id ?? boards[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [entryId, setEntryId] = useState<string | null>(null)
  const [entryDate, setEntryDate] = useState(today)
  const [entryMinutes, setEntryMinutes] = useState("30")
  const [note, setNote] = useState("")
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null)
  const entries = Object.values(state.planning?.entries ?? {}).filter(entry => entry.taskId === task.id).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
  const actual = entries.reduce((sum, entry) => sum + entry.minutes, 0)
  function report(ok: boolean, success: string) {
    setError(ok ? "" : "The change could not be saved. Check the values and available records.")
    setMessage(ok ? success : "")
  }
  function editEntry(entry: TimeEntry) {
    setEntryId(entry.id); setEntryDate(entry.date); setEntryMinutes(String(entry.minutes)); setNote(entry.note)
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}>
    <DialogContent finalFocus={finalFocus} className="flex max-w-2xl flex-col overflow-hidden p-0">
      <DialogHeader className="shrink-0 border-b px-6 py-5"><DialogTitle>Plan & track: {task.title}</DialogTitle></DialogHeader>
      <div className="no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {message ? <p role="status" className="text-sm">{message}</p> : null}
        <form className="space-y-3" onSubmit={event => {
          event.preventDefault()
          const plannedDate = date || null
          const plannedMinutes = minutes === "" ? null : Number(minutes)
          report((plannedDate === plan.date && plannedMinutes === plan.minutes) || onPlan({ type: "schedule", taskId: task.id, date: plannedDate, minutes: plannedMinutes }), "Schedule saved.")
        }}>
          <h2 className="font-semibold">Work schedule</h2>
          <p className="text-sm text-muted-foreground">Deadline: {task.dueDate ?? "None"} · Logged: {actual} min · Planned estimate: {plan.minutes ?? "Not set"}{plan.minutes !== null ? " min" : ""}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PlanningField label="Work date"><Input type="date" value={date} onChange={event => setDate(event.target.value)} /></PlanningField>
            <PlanningField label="Estimated minutes"><Input type="number" min="0" max="1440" step="1" value={minutes} onChange={event => setMinutes(event.target.value)} /></PlanningField>
          </div>
          <div className="flex flex-wrap gap-2"><Button type="submit">Save schedule</Button><Button type="button" variant="outline" onClick={() => setDate("")}>Clear work date</Button></div>
        </form>
        <form className="space-y-3 border-t pt-5" onSubmit={event => {
          event.preventDefault()
          const rule: Recurrence | null = frequency === "off" ? null : { frequency, interval: Number(interval), boardId,
            anchorDay: plan.recurrence?.anchorDay ?? Number(task.dueDate?.slice(-2) ?? 1) }
          report(JSON.stringify(rule) === JSON.stringify(plan.recurrence) || onPlan({ type: "recurrence", taskId: task.id, rule }), "Recurrence saved.")
        }}>
          <h2 className="font-semibold">Recurring task</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PlanningField label="Repeat"><select className={planningSelectClass} value={frequency} onChange={event => setFrequency(event.target.value === "daily" ? "daily" : event.target.value === "weekly" ? "weekly" : event.target.value === "monthly" ? "monthly" : "off")}>
              <option value="off">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select></PlanningField>
            <PlanningField label="Every N periods"><Input type="number" min="1" max="365" step="1" required disabled={frequency === "off"} value={interval} onChange={event => setIntervalValue(event.target.value)} /></PlanningField>
            <PlanningField label="Next occurrence Board"><select className={planningSelectClass} disabled={frequency === "off"} value={boardId} onChange={event => setBoardId(event.target.value)}>
              <option value="">Choose an unfinished Board</option>{boards.map(board => <option key={board.id} value={board.id}>{board.title}</option>)}
              {boardId && !boards.some(board => board.id === boardId) ? <option value={boardId}>Board unavailable for recurrence</option> : null}
            </select></PlanningField>
          </div>
          {frequency !== "off" && !task.dueDate ? <p className="text-sm text-destructive">A deadline is required for recurrence.</p> : null}
          <Button type="submit" disabled={frequency !== "off" && (!task.dueDate || !boards.some(board => board.id === boardId))}>Save recurrence</Button>
          {plan.generated ? <p className="text-sm text-muted-foreground">The next occurrence has already been created.</p> : null}
          {plan.recurrence && !plan.generated && state.taskBoardsById[task.boardId]?.stage === "done" ? <Button type="button" variant="outline" onClick={() => report(onPlan({ type: "generate-recurrence", taskId: task.id }), "Next occurrence created.")}>Create next occurrence</Button> : null}
        </form>
        <section className="space-y-3 border-t pt-5" aria-label="Time tracking">
          <h2 className="font-semibold">Time tracking</h2>
          <Button variant="outline" disabled={!!runningTaskId && runningTaskId !== task.id} onClick={() => report(runningTaskId === task.id ? onStopTimer() : onStartTimer(task.id, today), runningTaskId === task.id ? "Timer recorded." : "Timer started.")}>
            {runningTaskId === task.id ? "Stop & log timer" : runningTaskId ? "Another task timer is running" : "Start timer"}
          </Button>
          <form className="space-y-3" onSubmit={event => {
            event.preventDefault()
            const entry = { id: entryId ?? crypto.randomUUID(), taskId: task.id, date: entryDate, minutes: Number(entryMinutes), note }
            const same = entryId && JSON.stringify(state.planning?.entries[entryId]) === JSON.stringify(entry)
            const ok = !!same || onPlan({ type: "entry", entry })
            report(ok, "Time entry saved.")
            if (ok) { setEntryId(null); setNote("") }
          }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanningField label="Log date"><Input type="date" required value={entryDate} onChange={event => setEntryDate(event.target.value)} /></PlanningField>
              <PlanningField label="Minutes worked"><Input type="number" min="1" max="525600" step="1" required value={entryMinutes} onChange={event => setEntryMinutes(event.target.value)} /></PlanningField>
            </div>
            <PlanningField label="Note"><Input value={note} onChange={event => setNote(event.target.value)} /></PlanningField>
            <div className="flex gap-2"><Button type="submit">{entryId ? "Update time entry" : "Add time entry"}</Button>{entryId ? <Button type="button" variant="outline" onClick={() => { setEntryId(null); setNote("") }}>Cancel edit</Button> : null}</div>
          </form>
          <ul className="divide-y">{entries.map(entry => <li key={entry.id} className="space-y-2 py-3 text-sm">
            <p>{entry.date} · {entry.minutes} min · {entry.note}</p>
            {deletingEntry === entry.id ? <div className="flex flex-wrap items-center gap-2"><span>Delete this time entry?</span><Button variant="destructive" onClick={() => {
              const ok = onPlan({ type: "delete-entry", id: entry.id }); report(ok, "Time entry deleted."); if (ok) { setDeletingEntry(null); if (entryId === entry.id) setEntryId(null) }
            }}>Confirm delete</Button><Button variant="outline" onClick={() => setDeletingEntry(null)}>Cancel</Button></div> :
              <div className="flex gap-2"><Button variant="outline" onClick={() => editEntry(entry)}>Edit</Button><Button variant="ghost" onClick={() => setDeletingEntry(entry.id)}>Delete</Button></div>}
          </li>)}</ul>
          {!entries.length ? <p className="text-sm text-muted-foreground">No time entries.</p> : null}
        </section>
      </div>
      <DialogFooter className="shrink-0 border-t px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
