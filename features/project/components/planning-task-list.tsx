"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DeleteRecordDialog } from "@/components/ui/delete-record-dialog"
import { DEFAULT_TASK_VIEW, type TaskView } from "../planning"
import { selectPlanningTasks } from "../planning-selectors"
import { WORK_ITEM_PRIORITIES } from "@/features/work-item/model"
import type { ProjectWorkspaceState } from "../model"
import type { PlanningAction } from "../planning-state"
import { PlanningField, planningSelectClass } from "./planning-controls"

export function PlanningTaskList({ state, onPlan, onOpenTask, onSchedule }: {
  state: ProjectWorkspaceState; onPlan: (action: PlanningAction) => boolean
  onOpenTask: (id: string) => void; onSchedule: (id: string) => void
}) {
  const [view, setView] = useState<TaskView>({ ...DEFAULT_TASK_VIEW })
  const [selected, setSelected] = useState("")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [deleting, setDeleting] = useState(false)
  const deleteTrigger = useRef<HTMLButtonElement>(null)
  const savedViews = Object.values(state.planning?.views ?? {})
  const tasks = selectPlanningTasks(state, view)
  const groups = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const key = view.group === "project" ? task.projectId : view.group === "status" ? state.taskBoardsById[task.boardId]?.stage ?? "unknown" : "Tasks"
    groups.set(key, [...(groups.get(key) ?? []), task])
  }
  function save(asNew: boolean) {
    if (!name.trim()) { setMessage("Enter a view name."); return }
    const id = asNew || !selected ? crypto.randomUUID() : selected
    const candidate = { ...view, id, name: name.trim() }
    const same = JSON.stringify(state.planning?.views[id]) === JSON.stringify(candidate)
    if (same || onPlan({ type: "view", view: candidate })) { setSelected(id); setView(candidate); setMessage("View saved.") }
    else setMessage("The view could not be saved.")
  }
  return <section className="space-y-5" aria-label="Saved task views">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <PlanningField label="Saved view"><select className={planningSelectClass} value={selected} onChange={event => {
        const id = event.target.value
        setSelected(id)
        const next = state.planning?.views[id] ?? DEFAULT_TASK_VIEW
        setView({ ...next }); setName(id ? next.name : ""); setMessage("")
      }}><option value="">Custom view</option>{savedViews.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></PlanningField>
      <PlanningField label="Search titles"><Input value={view.query} onChange={event => setView({ ...view, query: event.target.value })} /></PlanningField>
      <PlanningField label="Project"><select className={planningSelectClass} value={view.projectId} onChange={event => setView({ ...view, projectId: event.target.value })}>
        <option value="">All projects</option>{Object.values(state.projectsById).filter(project => !project.archived).map(project => <option key={project.id} value={project.id}>{state.workspacesById[project.workspaceId]?.title} / {project.title}</option>)}
        {view.projectId && (!state.projectsById[view.projectId] || state.projectsById[view.projectId].archived) ? <option value={view.projectId}>Unavailable project</option> : null}
      </select></PlanningField>
      <PlanningField label="Priority"><select className={planningSelectClass} value={view.priority} onChange={event => setView({ ...view, priority: WORK_ITEM_PRIORITIES.find(value => value === event.target.value) ?? "" })}>
        <option value="">All priorities</option>{WORK_ITEM_PRIORITIES.map(priority => <option key={priority}>{priority}</option>)}
      </select></PlanningField>
      <PlanningField label="Completion"><select className={planningSelectClass} value={view.status} onChange={event => setView({ ...view, status: event.target.value === "any" ? "any" : event.target.value === "done" ? "done" : "unfinished" })}>
        <option value="unfinished">Unfinished</option><option value="done">Completed</option><option value="any">All</option>
      </select></PlanningField>
      <PlanningField label="Sort"><select className={planningSelectClass} value={view.sort} onChange={event => setView({ ...view, sort: event.target.value === "deadline" ? "deadline" : event.target.value === "priority" ? "priority" : "title" })}>
        <option value="title">Title A–Z</option><option value="deadline">Earliest deadline</option><option value="priority">Highest priority</option>
      </select></PlanningField>
      <PlanningField label="Group"><select className={planningSelectClass} value={view.group} onChange={event => setView({ ...view, group: event.target.value === "project" ? "project" : event.target.value === "status" ? "status" : "none" })}>
        <option value="project">Project</option><option value="status">Workflow stage</option><option value="none">No grouping</option>
      </select></PlanningField>
      <PlanningField label="View name"><Input value={name} onChange={event => setName(event.target.value)} /></PlanningField>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => save(false)} disabled={!name.trim()}>Save view</Button>
      <Button variant="outline" onClick={() => save(true)} disabled={!name.trim() || !selected}>Save as new</Button>
      <Button variant="outline" onClick={() => { setView({ ...DEFAULT_TASK_VIEW }); setSelected(""); setName("") }}>Reset filters</Button>
      <Button ref={deleteTrigger} variant="destructive" disabled={!state.planning?.views[selected]} onClick={() => setDeleting(true)}>Delete view</Button>
    </div>
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
    {[...groups].map(([key, items]) => <section key={key} className="space-y-2">
      <h2 className="font-semibold">{view.group === "project" ? state.projectsById[key]?.title : key} · {items.length}</h2>
      <ul className="divide-y rounded-md border">{items.map(task => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0 flex-1 basis-56"><button className="min-h-11 text-left font-medium hover:underline" onClick={() => onOpenTask(task.id)}>{task.title}</button>
          <p className="text-xs text-muted-foreground">{state.projectsById[task.projectId]?.title} / {state.taskBoardsById[task.boardId]?.title} · {task.priority} · Due {task.dueDate ?? "—"}</p>
        </div>
        <Button variant="outline" onClick={() => onSchedule(task.id)}>Plan & track</Button>
      </li>)}</ul>
    </section>)}
    {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks match these filters.</p> : null}
    {deleting ? <DeleteRecordDialog title="Delete saved view?" description="Only this saved filter and layout will be removed. Tasks remain unchanged." finalFocus={deleteTrigger}
      onClose={() => setDeleting(false)} onDelete={() => { const ok = onPlan({ type: "delete-view", id: selected }); if (ok) { setSelected(""); setName("") } return ok }} /> : null}
  </section>
}
