"use client"

import { useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "../store-provider"
import { useLocalToday } from "../use-local-today"
import { PlanningField, planningSelectClass } from "./planning-controls"
import { WeeklyPlanner } from "./weekly-planner"
import { PlanningTaskList } from "./planning-task-list"
import { TaskPlanningDialog } from "./task-planning-dialog"
import { ProjectWorkItemDialog } from "./project-work-item-dialog"
import { ProjectPlanningPanel } from "./project-planning-panel"
import { TaskTemplatePanel } from "./task-template-panel"
import { TaskCsvPanel } from "./task-csv-panel"

const PANELS = ["Week", "Tasks & views", "Projects", "Templates", "CSV", "Time report"] as const
type Panel = typeof PANELS[number]

export function PlanningDashboard() {
  const today = useLocalToday()
  return <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
    <h1 className="text-2xl font-semibold">Planning</h1>
    {today ? <PlanningContent today={today} /> : <p role="status">Loading planning…</p>}
  </div>
}

function PlanningContent({ today }: { today: string }) {
  const state = useProjectStore(useShallow(state => ({
    workspaceIds: state.workspaceIds, workspacesById: state.workspacesById,
    projectIdsByWorkspaceId: state.projectIdsByWorkspaceId, projectsById: state.projectsById,
    projectViewsById: state.projectViewsById, taskBoardsById: state.taskBoardsById,
    workItemsById: state.workItemsById, resourcesById: state.resourcesById,
    milestonesById: state.milestonesById, tablesByViewId: state.tablesByViewId, planning: state.planning,
  })))
  const actions = useProjectStore(useShallow(state => ({ plan: state.plan, updateTask: state.updateWorkItem, duplicate: state.duplicateProject, startTimer: state.startTimer, stopTimer: state.stopTimer })))
  const timer = useProjectStore(state => state.runningTimer)
  const [panel, setPanel] = useState<Panel>("Week")
  const [chosenProject, setChosenProject] = useState("")
  const [chosenBoard, setChosenBoard] = useState("")
  const [taskId, setTaskId] = useState<string | null>(null)
  const [plannedTaskId, setPlannedTaskId] = useState<string | null>(null)
  const projects = Object.values(state.projectsById).filter(project => !project.archived)
  const projectId = projects.some(project => project.id === chosenProject) ? chosenProject : projects[0]?.id ?? ""
  const boards = Object.values(state.taskBoardsById).filter(board => board.projectId === projectId).sort((a, b) => a.position - b.position)
  const boardId = boards.some(board => board.id === chosenBoard) ? chosenBoard : boards[0]?.id ?? ""
  const projectTasks = Object.values(state.workItemsById).filter(task => task.projectId === projectId)
  const trigger = useRef<HTMLElement | null>(null)
  const fallback = useRef<HTMLDivElement>(null)
  const task = taskId ? state.workItemsById[taskId] : null
  const plannedTask = plannedTaskId ? state.workItemsById[plannedTaskId] : null
  function openTask(id: string, planning = false) {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : fallback.current
    if (planning) setPlannedTaskId(id)
    else setTaskId(id)
  }
  const finalFocus = () => trigger.current?.isConnected ? trigger.current : fallback.current
  return <div ref={fallback} tabIndex={-1} className="min-w-0 space-y-5 outline-none">
    {timer ? <RunningTimer title={state.workItemsById[timer.taskId]?.title ?? "Task"} startedAt={timer.startedAt} onStop={actions.stopTimer} /> : null}
    <nav aria-label="Planning sections" className="flex gap-1 overflow-x-auto border-b pb-2">
      {PANELS.map(name => <Button key={name} variant={panel === name ? "secondary" : "ghost"} aria-pressed={panel === name} onClick={() => setPanel(name)}>{name}</Button>)}
    </nav>
    {panel === "Projects" || panel === "Templates" || panel === "CSV" ? <div className="grid gap-3 sm:grid-cols-2">
      <PlanningField label="Project"><select className={planningSelectClass} value={projectId} onChange={event => { setChosenProject(event.target.value); setChosenBoard("") }}>
        {!projects.length ? <option value="">No active projects</option> : null}
        {projects.map(project => <option key={project.id} value={project.id}>{state.workspacesById[project.workspaceId]?.title} / {project.title}</option>)}
      </select></PlanningField>
      {panel !== "Projects" ? <PlanningField label="Destination Board"><select className={planningSelectClass} value={boardId} onChange={event => setChosenBoard(event.target.value)}>
        {!boards.length ? <option value="">No Boards available</option> : null}
        {boards.map(board => <option key={board.id} value={board.id}>{board.title}{board.stage === "done" ? " (Completed)" : ""}</option>)}
      </select></PlanningField> : null}
    </div> : null}
    {panel === "Week" ? <WeeklyPlanner state={state} today={today} onPlan={actions.plan} onOpenTask={id => openTask(id)} onSchedule={id => openTask(id, true)} /> : null}
    {panel === "Tasks & views" ? <PlanningTaskList state={state} onPlan={actions.plan} onOpenTask={id => openTask(id)} onSchedule={id => openTask(id, true)} /> : null}
    {panel === "Projects" ? <ProjectPlanningPanel key={projectId} state={state} projectId={projectId} today={today} onPlan={actions.plan} onUpdateTask={actions.updateTask} onDuplicate={actions.duplicate} onOpenTask={id => openTask(id)} /> : null}
    {panel === "Templates" ? <TaskTemplatePanel templates={Object.values(state.planning?.templates ?? {})} tasks={projectTasks} boardId={boardId} onPlan={actions.plan} /> : null}
    {panel === "CSV" ? <TaskCsvPanel key={projectId + boardId} tasks={projectTasks} projectId={projectId} boardId={boardId} onImport={tasks => actions.plan({ type: "import-tasks", tasks })} /> : null}
    {panel === "Time report" ? <section className="space-y-3" aria-label="Time report">
      <h2 className="font-semibold">Recorded time by task</h2>
      <ul className="divide-y rounded border">{Object.values(state.workItemsById).filter(item => Object.values(state.planning?.entries ?? {}).some(entry => entry.taskId === item.id)).map(item => {
        const actual = Object.values(state.planning?.entries ?? {}).filter(entry => entry.taskId === item.id).reduce((sum, entry) => sum + entry.minutes, 0)
        const estimate = state.planning?.tasks[item.id]?.minutes
        return <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div><button className="min-h-11 text-left font-medium hover:underline" onClick={() => openTask(item.id)}>{item.title}</button><p className="text-xs text-muted-foreground">{state.projectsById[item.projectId]?.title} · {actual} min logged · {estimate ?? "No"} estimate{estimate != null ? ` min · ${actual - estimate} min variance` : ""}</p></div>
          <Button variant="outline" onClick={() => openTask(item.id, true)}>Manage entries</Button>
        </li>
      })}</ul>
      {!Object.keys(state.planning?.entries ?? {}).length ? <p className="text-sm text-muted-foreground">No recorded time. Use Plan & track on a task to start.</p> : null}
    </section> : null}
    {task ? <ProjectWorkItemDialog projectId={task.projectId} session={{ key: task.id, mode: "view", workItemId: task.id }} finalFocus={finalFocus} onOpenChange={open => { if (!open) setTaskId(null) }} /> : null}
    {plannedTask ? <TaskPlanningDialog key={plannedTask.id} task={plannedTask} state={state} today={today} finalFocus={trigger} onClose={() => setPlannedTaskId(null)} onPlan={actions.plan}
      runningTaskId={timer?.taskId ?? null} onStartTimer={actions.startTimer} onStopTimer={actions.stopTimer} /> : null}
  </div>
}

function RunningTimer({ title, startedAt, onStop }: { title: string; startedAt: number; onStop: () => boolean }) {
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState(false)
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])
  return <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
    <p className="min-w-0 flex-1 text-sm">Timer: {title} · {Math.floor(seconds / 60)}m {seconds % 60}s</p>
    <Button onClick={() => setError(!onStop())}>Stop & log</Button>
    {error ? <p role="alert" className="text-sm text-destructive">Timer could not be recorded. Check the device clock.</p> : null}
  </div>
}
