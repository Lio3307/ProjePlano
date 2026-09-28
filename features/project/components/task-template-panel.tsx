"use client"

import { useRef, useState, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { DeleteRecordDialog } from "@/components/ui/delete-record-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WORK_ITEM_PRIORITIES, WORK_ITEM_TYPES, type WorkItem, type WorkItemPriority, type WorkItemType } from "@/features/work-item/model"
import { isTaskTemplate, type TaskTemplate } from "../planning"
import type { PlanningAction } from "../planning-state"

type TaskTemplatePanelProps = {
  templates: readonly TaskTemplate[]
  tasks: readonly WorkItem[]
  boardId: string
  onPlan: (action: PlanningAction) => boolean
}

type TemplateForm = {
  name: string
  title: string
  description: string
  type: WorkItemType
  priority: WorkItemPriority
  estimate: string
  checklist: string
}

const SELECT_CLASS = "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm"

function formFromTemplate(template?: TaskTemplate): TemplateForm {
  return {
    name: template?.name ?? "",
    title: template?.title ?? "",
    description: template?.description ?? "",
    type: template?.type ?? "feature",
    priority: template?.priority ?? "medium",
    estimate: template?.estimate === null || template === undefined ? "" : String(template.estimate),
    checklist: template?.checklist.join("\n") ?? "",
  }
}

function TaskTemplateFormDialog({ template, tasks, finalFocus, onClose, onSave }: {
  template?: TaskTemplate
  tasks: readonly WorkItem[]
  finalFocus: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onSave: (template: TaskTemplate) => boolean
}) {
  const [form, setForm] = useState(() => formFromTemplate(template))
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  function save() {
    const estimateText = form.estimate.trim()
    if (estimateText && !/^(0|[1-9]\d*)$/.test(estimateText)) {
      setError("Enter a whole-number estimate of zero or more.")
      return
    }
    const estimate = estimateText ? Number(estimateText) : null
    const value: TaskTemplate = {
      id: template?.id ?? `task-template-${crypto.randomUUID()}`,
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      priority: form.priority,
      estimate,
      checklist: form.checklist.split(/\r?\n/).map(label => label.trim()).filter(Boolean),
    }
    if (!isTaskTemplate(value)) {
      setError("Enter a template name, task title, and a valid whole-number estimate.")
      return
    }
    if (onSave(value)) onClose()
    else setError("The template could not be saved. Try again.")
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent initialFocus={nameRef} finalFocus={finalFocus} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>{template ? "Edit task template" : "Create task template"}</DialogTitle>
          <DialogDescription>Templates can be used on any project board.</DialogDescription>
        </DialogHeader>
        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-2">
          {!template && tasks.length ? (
            <label className="grid gap-1.5 text-sm font-medium">
              Start from an existing task
              <select className={SELECT_CLASS} defaultValue="" onChange={event => {
                const task = tasks.find(item => item.id === event.target.value)
                if (!task) {
                  setForm(formFromTemplate())
                  setError(null)
                  return
                }
                setForm({ name: task.title, title: task.title, description: task.description,
                  type: task.type, priority: task.priority,
                  estimate: task.estimate === null ? "" : String(task.estimate),
                  checklist: task.checklist.map(item => item.label).join("\n") })
                setError(null)
              }}>
                <option value="">Start manually</option>
                {tasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1.5 text-sm font-medium">Template name
            <Input ref={nameRef} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Task title
            <Input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Description
            <Textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">Type
              <select className={SELECT_CLASS} value={form.type} onChange={event => {
                const type = WORK_ITEM_TYPES.find(value => value === event.target.value)
                if (type) setForm(current => ({ ...current, type }))
              }}>
                {WORK_ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">Priority
              <select className={SELECT_CLASS} value={form.priority} onChange={event => {
                const priority = WORK_ITEM_PRIORITIES.find(value => value === event.target.value)
                if (priority) setForm(current => ({ ...current, priority }))
              }}>
                {WORK_ITEM_PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">Estimate
            <Input type="number" min="0" step="1" inputMode="numeric" value={form.estimate}
              onChange={event => setForm(current => ({ ...current, estimate: event.target.value }))} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Checklist, one item per line
            <Textarea value={form.checklist} onChange={event => setForm(current => ({ ...current, checklist: event.target.value }))} />
          </label>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={save}>{template ? "Save template" : "Create template"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TaskTemplatePanel({ templates, tasks, boardId, onPlan }: TaskTemplatePanelProps) {
  const [editing, setEditing] = useState<TaskTemplate | null | "create">(null)
  const [deleting, setDeleting] = useState<TaskTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  function applyTemplate(template: TaskTemplate) {
    setError(null)
    setMessage(null)
    if (!boardId || !onPlan({ type: "use-template", templateId: template.id, boardId, id: `work-item-${crypto.randomUUID()}` })) {
      setError("The task could not be created. Check the destination board and try again.")
      return
    }
    setMessage(`Created a task from ${template.name}.`)
  }

  return (
    <section aria-label="Task templates" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Task templates</h2>
        <Button ref={createButtonRef} type="button" onClick={() => { setError(null); setMessage(null); setEditing("create") }}>Create template</Button>
      </div>
      {templates.length ? (
        <ul className="divide-y rounded-md border">
          {templates.map(template => (
            <li key={template.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={!boardId} onClick={() => applyTemplate(template)}>Use template</Button>
                <Button type="button" variant="outline" onClick={() => { setError(null); setMessage(null); setEditing(template) }} aria-label={`Edit ${template.name}`}>Edit</Button>
                <Button type="button" variant="destructive" onClick={() => { setError(null); setMessage(null); setDeleting(template) }} aria-label={`Delete ${template.name}`}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">No task templates yet.</p>}
      {!boardId && templates.length ? <p className="text-sm text-muted-foreground">Select a destination board to use a template.</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      {editing ? <TaskTemplateFormDialog template={editing === "create" ? undefined : editing} tasks={tasks}
        finalFocus={createButtonRef} onClose={() => setEditing(null)} onSave={template => {
          if (editing !== "create" && JSON.stringify(editing) === JSON.stringify(template)) return true
          const saved = onPlan({ type: "template", template })
          if (saved) setMessage(editing === "create" ? "Template created." : "Template updated.")
          return saved
        }} /> : null}
      {deleting ? <DeleteRecordDialog title={`Delete ${deleting.name}?`}
        description="This removes the template. Tasks already created from it stay in place."
        finalFocus={createButtonRef} onClose={() => setDeleting(null)} onDelete={() => {
          const deleted = onPlan({ type: "delete-template", id: deleting.id })
          if (deleted) setMessage("Template deleted.")
          return deleted
        }} /> : null}
    </section>
  )
}
