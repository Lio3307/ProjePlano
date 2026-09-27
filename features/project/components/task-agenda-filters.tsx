"use client"

import { useRef } from "react"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import { WORK_ITEM_PRIORITIES } from "@/features/work-item/model"
import { WORK_ITEM_PRIORITY_LABELS } from "@/features/work-item/components/work-item-meta"
import { selectProjectsByWorkspaceId, selectWorkspaces, type AgendaFilters } from "../selectors"
import { useProjectStore } from "../store-provider"

const SELECT_CLASS = "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm"

export function TaskAgendaFilters({ value, onChange, matchingCount, totalCount }: {
  value: AgendaFilters
  onChange: (value: AgendaFilters) => void
  matchingCount: number
  totalCount: number
}) {
  const workspaceRef = useRef<HTMLSelectElement>(null)
  const workspaces = useProjectStore(useShallow(selectWorkspaces))
  const projects = useProjectStore(useShallow(state => workspaces
    .filter(workspace => !value.workspaceId || workspace.id === value.workspaceId)
    .flatMap(workspace => selectProjectsByWorkspaceId(state, workspace.id).filter(project => !project.archived))))

  return (
    <section aria-label="Agenda filters" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Workspace
          <select ref={workspaceRef} className={SELECT_CLASS} value={value.workspaceId}
            onChange={event => onChange({ ...value, workspaceId: event.target.value, projectId: "" })}>
            <option value="">All workspaces</option>
            {value.workspaceId && !workspaces.some(workspace => workspace.id === value.workspaceId)
              ? <option value={value.workspaceId} disabled>Unavailable workspace</option> : null}
            {workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.title}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Project
          <select className={SELECT_CLASS} value={value.projectId}
            onChange={event => onChange({ ...value, projectId: event.target.value })}>
            <option value="">All projects</option>
            {value.projectId && !projects.some(project => project.id === value.projectId)
              ? <option value={value.projectId} disabled>Unavailable project</option> : null}
            {workspaces.filter(workspace => !value.workspaceId || workspace.id === value.workspaceId).map(workspace => (
              <optgroup key={workspace.id} label={workspace.title}>
                {projects.filter(project => project.workspaceId === workspace.id).map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Priority
          <select className={SELECT_CLASS} value={value.priority} onChange={event => onChange({
            ...value, priority: WORK_ITEM_PRIORITIES.find(priority => priority === event.target.value) ?? "",
          })}>
            <option value="">All priorities</option>
            {WORK_ITEM_PRIORITIES.map(priority => <option key={priority} value={priority}>{WORK_ITEM_PRIORITY_LABELS[priority]}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" aria-atomic="true" className="text-sm text-muted-foreground">{matchingCount} of {totalCount} tasks</p>
        <Button type="button" variant="ghost" disabled={!value.workspaceId && !value.projectId && !value.priority}
          onClick={() => { onChange({ workspaceId: "", projectId: "", priority: "" }); workspaceRef.current?.focus() }}>
          Clear filters
        </Button>
      </div>
    </section>
  )
}
