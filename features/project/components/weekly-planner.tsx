"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectWorkspaceState } from "../model"
import type { PlanningAction } from "../planning-state"
import { addPlanningDays, isPlanningDate } from "../planning"
import { getDailyCapacity, planningWeek } from "../planning-selectors"
import { PlanningField } from "./planning-controls"

export function WeeklyPlanner({ state, today, onPlan, onOpenTask, onSchedule }: {
  state: ProjectWorkspaceState; today: string; onPlan: (action: PlanningAction) => boolean
  onOpenTask: (id: string) => void; onSchedule: (id: string) => void
}) {
  const [date, setDate] = useState(today)
  const week = planningWeek(date)
  const available = Object.values(state.workItemsById).filter(task => !task.archived && !state.projectsById[task.projectId]?.archived && state.taskBoardsById[task.boardId]?.stage !== "done" && !state.planning?.tasks[task.id]?.date)
  return <section className="space-y-5" aria-label="Weekly planner">
    <div className="flex flex-wrap items-end gap-3">
      <Button variant="outline" onClick={() => setDate(addPlanningDays(date, -7))}>Previous week</Button>
      <PlanningField label="Week containing"><Input type="date" value={date} onChange={event => { if (isPlanningDate(event.target.value)) setDate(event.target.value) }} /></PlanningField>
      <Button variant="outline" onClick={() => setDate(today)}>This week</Button>
      <Button variant="outline" onClick={() => setDate(addPlanningDays(date, 7))}>Next week</Button>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {week.map(day => <DayPlan key={day} date={day} state={state} onPlan={onPlan} onOpenTask={onOpenTask} onSchedule={onSchedule} />)}
    </div>
    <section className="space-y-3 border-t pt-5" aria-label="Unscheduled tasks">
      <h2 className="font-semibold">Unscheduled · {available.length}</h2>
      <ul className="grid gap-2 md:grid-cols-2">{available.map(task => <li key={task.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border p-3">
        <div className="min-w-0"><button className="min-h-11 text-left text-sm font-medium hover:underline" onClick={() => onOpenTask(task.id)}>{task.title}</button><p className="text-xs text-muted-foreground">{state.projectsById[task.projectId]?.title}</p></div>
        <Button variant="outline" onClick={() => onSchedule(task.id)}>Schedule</Button>
      </li>)}</ul>
      {!available.length ? <p className="text-sm text-muted-foreground">No unscheduled tasks.</p> : null}
    </section>
  </section>
}

function DayPlan({ state, date, onPlan, onOpenTask, onSchedule }: {
  state: ProjectWorkspaceState; date: string; onPlan: (action: PlanningAction) => boolean
  onOpenTask: (id: string) => void; onSchedule: (id: string) => void
}) {
  const daily = getDailyCapacity(state, date)
  const [capacity, setCapacity] = useState(String(daily.capacity))
  const [message, setMessage] = useState("")
  return <section className="min-w-0 space-y-3 rounded-lg border p-4">
    <h2 className="font-semibold"><time dateTime={date}>{new Date(date + "T00:00:00Z").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</time></h2>
    <p className={daily.minutes > daily.capacity ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
      {daily.minutes} / {daily.capacity} min planned{daily.minutes > daily.capacity ? ` · ${daily.minutes - daily.capacity} min over capacity` : ""}
      {daily.unknown ? ` · ${daily.unknown} without an estimate` : ""}
    </p>
    <form className="flex items-end gap-2" onSubmit={event => {
      event.preventDefault()
      const minutes = Number(capacity)
      const ok = minutes === daily.capacity || onPlan({ type: "capacity", date, minutes })
      setMessage(ok ? "Capacity saved." : "Enter whole minutes from 0 to 1440.")
    }}>
      <PlanningField label="Available minutes"><Input type="number" min="0" max="1440" step="1" required value={capacity} onChange={event => setCapacity(event.target.value)} /></PlanningField>
      <Button type="submit" variant="outline">Set</Button>
    </form>
    {message ? <p role="status" className="text-xs text-muted-foreground">{message}</p> : null}
    <ul className="space-y-2">{daily.tasks.map(task => <li key={task.id} className="rounded border p-2">
      <button className="min-h-11 text-left text-sm font-medium hover:underline" onClick={() => onOpenTask(task.id)}>{task.title}</button>
      <p className="text-xs text-muted-foreground">{state.projectsById[task.projectId]?.title} · {state.taskBoardsById[task.boardId]?.stage === "done" ? "Completed" : "Unfinished"} · Due {task.dueDate ?? "—"}</p>
      <Button variant="ghost" onClick={() => onSchedule(task.id)}>Reschedule · {state.planning?.tasks[task.id]?.minutes ?? "?"} min</Button>
    </li>)}</ul>
    {!daily.tasks.length ? <p className="text-sm text-muted-foreground">No tasks scheduled.</p> : null}
  </section>
}
