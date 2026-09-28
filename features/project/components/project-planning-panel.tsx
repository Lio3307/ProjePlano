"use client"

import { useRef, useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteRecordDialog } from "@/components/ui/delete-record-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItem } from "@/features/work-item/model"
import type { WorkItemDetailsPatch } from "../work-item-state"
import type { Milestone, ProjectWorkspaceState } from "../model"
import type { PlanningAction } from "../planning-state"
import { DependencyMap } from "./dependency-map"

type ProjectPlanningPanelProps = {
  state: ProjectWorkspaceState
  projectId: string
  today: string
  onPlan: (action: PlanningAction) => boolean
  onUpdateTask: (id: string, patch: WorkItemDetailsPatch) => boolean
  onDuplicate: (sourceId: string, workspaceId: string, title: string) => boolean
  onOpenTask: (id: string) => void
}

const selectClass = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function ProjectPlanningPanel({ state, projectId, today, onPlan, onUpdateTask, onDuplicate, onOpenTask }: ProjectPlanningPanelProps) {
  const project = state.projectsById[projectId]
  const milestones = (project?.milestoneIds ?? []).map(id => state.milestonesById[id]).filter((item): item is Milestone => !!item)
  const projectTasks = Object.values(state.workItemsById).filter(task => task.projectId === projectId)
  const tasks = projectTasks.filter(task => !task.archived)
  const [editing, setEditing] = useState<Milestone | "new" | null>(null)
  const [deleting, setDeleting] = useState<Milestone | null>(null)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const duplicateRef = useRef<HTMLButtonElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)
  if (!project) return <p role="status">Project not found.</p>

  return <div className="space-y-6">
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle><h2 className="text-lg">Milestones</h2></CardTitle>
        <Button ref={addRef} onClick={() => setEditing("new")}><Plus aria-hidden="true" /> Add milestone</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones yet.</p> : null}
        <ul className="grid gap-3 md:grid-cols-2">{milestones.map(milestone => {
          const linked = projectTasks.filter(task => task.milestoneId === milestone.id)
          const completed = linked.filter(task => state.taskBoardsById[task.boardId]?.stage === "done").length
          const overdue = milestone.targetDate !== null && milestone.targetDate < today && milestone.status !== "completed"
          return <li key={milestone.id} className="min-w-0 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold wrap-anywhere">{milestone.title}</h3><p className="text-sm text-muted-foreground">{milestone.status === "in-progress" ? "In progress" : milestone.status === "completed" ? "Completed" : "Planned"}</p></div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={event => { editRef.current = event.currentTarget; setEditing(milestone) }}>Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(milestone)}>Delete</Button></div></div>
            {milestone.description ? <p className="mt-2 text-sm whitespace-pre-wrap">{milestone.description}</p> : null}
            <p className={`mt-2 text-sm ${overdue ? "text-destructive" : "text-muted-foreground"}`}>{milestone.targetDate ? `Target ${milestone.targetDate}${overdue ? " - Overdue" : ""}` : "No target date"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{completed} of {linked.length} linked tasks completed</p>
            <progress
              className="mt-2 h-2 w-full accent-primary"
              value={completed}
              max={Math.max(linked.length, 1)}
              aria-label={`${milestone.title} task progress`}
            />
            {linked.length ? <ul className="mt-3 space-y-1 border-t pt-3">{linked.map(task => <li key={task.id}>{task.archived ? <span className="text-sm text-muted-foreground">{task.title} (archived)</span> : <Button variant="ghost" size="sm" className="h-auto min-h-9 max-w-full justify-start whitespace-normal text-left" onClick={() => onOpenTask(task.id)}>{task.title}</Button>}</li>)}</ul> : null}
          </li>
        })}</ul>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle><h2 className="text-lg">Task milestones</h2></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {tasks.length ? <ul className="grid gap-3 md:grid-cols-2">{tasks.map(task => <TaskAssignment key={task.id} task={task} milestones={milestones} onOpenTask={onOpenTask} onChange={milestoneId => {
          if (!onUpdateTask(task.id, { milestoneId })) setAssignmentError(`Could not update ${task.title}.`)
          else setAssignmentError(null)
        }} />)}</ul> : <p className="text-sm text-muted-foreground">No tasks in this project.</p>}
        {assignmentError ? <p role="alert" className="text-sm text-destructive">{assignmentError}</p> : null}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle><h2 className="text-lg">Dependencies</h2></CardTitle></CardHeader><CardContent><DependencyMap state={state} projectId={projectId} onOpenTask={onOpenTask} /></CardContent></Card>

    <Card><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><CardTitle><h2 className="text-lg">Duplicate project</h2></CardTitle><Button ref={duplicateRef} variant="outline" onClick={() => setDuplicateOpen(true)}>Duplicate project</Button></CardHeader><CardContent><p className="text-sm text-muted-foreground">Copies saved views, Boards, tasks, Table data, documents, and milestones. Unsaved drafts, planning schedules, recurrence rules, and work logs stay with this project.</p>{duplicateMessage ? <p role="status" className="mt-2 text-sm">{duplicateMessage}</p> : null}</CardContent></Card>

    {editing ? <MilestoneDialog key={editing === "new" ? "new" : editing.id} milestone={editing} projectId={projectId} finalFocus={editing === "new" ? addRef : editRef} onClose={() => setEditing(null)} onSave={item => onPlan({ type: "milestone", milestone: item })} /> : null}
    {deleting ? <DeleteRecordDialog title={`Delete ${deleting.title}?`} description="Linked tasks will be unlinked from this milestone. The tasks themselves will remain." finalFocus={addRef} onClose={() => setDeleting(null)} onDelete={() => onPlan({ type: "delete-milestone", id: deleting.id })} /> : null}
    {duplicateOpen ? <DuplicateProjectDialog key={projectId} projectTitle={project.title} projectId={projectId} workspaceId={project.workspaceId} state={state} finalFocus={duplicateRef} onClose={() => setDuplicateOpen(false)} onDuplicate={(sourceId, workspaceId, title) => {
      const created = onDuplicate(sourceId, workspaceId, title)
      if (created) setDuplicateMessage(`Created ${title} in ${state.workspacesById[workspaceId]?.title ?? "the selected workspace"}.`)
      return created
    }} /> : null}
  </div>
}

function TaskAssignment({ task, milestones, onOpenTask, onChange }: { task: WorkItem; milestones: Milestone[]; onOpenTask: (id: string) => void; onChange: (id: string | null) => void }) {
  return <li className="flex min-w-0 items-center gap-2 rounded-md border p-2">
    <Button variant="ghost" className="min-w-0 flex-1 justify-start overflow-hidden text-ellipsis" onClick={() => onOpenTask(task.id)}>{task.title}</Button>
    <label className="min-w-32 flex-1 text-xs text-muted-foreground">Milestone
      <select className={selectClass} value={task.milestoneId ?? ""} onChange={event => onChange(event.target.value || null)}>
        <option value="">None</option>
        {milestones.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </label>
  </li>
}

function MilestoneDialog({ milestone, projectId, finalFocus, onClose, onSave }: { milestone: Milestone | "new"; projectId: string; finalFocus: React.RefObject<HTMLButtonElement | null>; onClose: () => void; onSave: (item: Milestone) => boolean }) {
  const existing = milestone === "new" ? null : milestone
  const [title, setTitle] = useState(existing?.title ?? "")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "")
  const [status, setStatus] = useState<Milestone["status"]>(existing?.status ?? "planned")
  const [error, setError] = useState<string | null>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) { setError("Enter a milestone title."); return }
    const normalizedTitle = title.trim()
    const normalizedDescription = description.trim()
    const normalizedDate = targetDate || null
    if (existing && existing.title === normalizedTitle && existing.description === normalizedDescription &&
      existing.targetDate === normalizedDate && existing.status === status) { onClose(); return }
    if (!onSave({ id: existing?.id ?? `milestone-${crypto.randomUUID()}`, projectId, title: normalizedTitle, description: normalizedDescription, targetDate: normalizedDate, status })) { setError("The milestone could not be saved."); return }
    onClose()
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}>
    <DialogContent finalFocus={finalFocus} className="flex max-w-lg flex-col overflow-hidden p-0">
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <DialogHeader className="shrink-0 border-b px-6 py-5"><DialogTitle>{existing ? "Edit milestone" : "Add milestone"}</DialogTitle></DialogHeader>
        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="block space-y-1 text-sm font-medium">Title
            <Input value={title} onChange={event => setTitle(event.target.value)} required autoFocus />
          </label>
          <label className="block space-y-1 text-sm font-medium">Description
            <Textarea value={description} onChange={event => setDescription(event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm font-medium">Target date
              <Input type="date" value={targetDate} onChange={event => setTargetDate(event.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-medium">Status
              <select className={selectClass} value={status} onChange={event => setStatus(event.target.value as Milestone["status"])}>
                <option value="planned">Planned</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save milestone</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}

function DuplicateProjectDialog({ projectTitle, projectId, workspaceId, state, finalFocus, onClose, onDuplicate }: { projectTitle: string; projectId: string; workspaceId: string; state: ProjectWorkspaceState; finalFocus: React.RefObject<HTMLButtonElement | null>; onClose: () => void; onDuplicate: (sourceId: string, workspaceId: string, title: string) => boolean }) {
  const [title, setTitle] = useState(`${projectTitle} (copy)`)
  const [destination, setDestination] = useState(workspaceId)
  const [error, setError] = useState<string | null>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) { setError("Enter a project title."); return }
    if (!onDuplicate(projectId, destination, title.trim())) { setError("The project could not be duplicated."); return }
    onClose()
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}>
    <DialogContent finalFocus={finalFocus} className="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>Duplicate project</DialogTitle>
          <DialogDescription>Saved views, Boards, tasks, Table data, documents, and milestones are copied. Unsaved drafts, planning schedules, recurrence rules, and work logs stay with this project.</DialogDescription>
        </DialogHeader>
        <label className="block space-y-1 text-sm font-medium">Project title
          <Input value={title} onChange={event => setTitle(event.target.value)} required autoFocus />
        </label>
        <label className="block space-y-1 text-sm font-medium">Destination workspace
          <select className={selectClass} value={destination} onChange={event => setDestination(event.target.value)}>
            {state.workspaceIds.map(id => <option key={id} value={id}>{state.workspacesById[id]?.title ?? id}</option>)}
          </select>
        </label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Duplicate</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
