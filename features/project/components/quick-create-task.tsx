"use client"

import Link from "next/link"
import { useId, useRef, useState, type FormEvent } from "react"
import { useShallow } from "zustand/react/shallow"

import { Button } from "@/components/ui/button"
import { getProjectViewHref } from "../query-state"
import { selectProjectsByWorkspaceId, selectProjectViews, selectTaskBoards, selectWorkspaces } from "../selectors"
import { useProjectStore } from "../store-provider"
import { ProjectWorkItemDialog } from "./project-work-item-dialog"

export function QuickCreateTask({ initialDueDate }: { initialDueDate: string }) {
  const workspaces = useProjectStore(useShallow(selectWorkspaces))
  const projects = useProjectStore(useShallow(state => workspaces.flatMap(workspace =>
    selectProjectsByWorkspaceId(state, workspace.id).filter(project => !project.archived)
  )))
  const [choosingBoard, setChoosingBoard] = useState(false)
  const [projectId, setProjectId] = useState("")
  const [boardId, setBoardId] = useState("")
  const [createdTitle, setCreatedTitle] = useState<string | null>(null)
  const [session, setSession] = useState<{ key: string; projectId: string; boardId: string } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const project = projects.find(candidate => candidate.id === projectId)
  const boards = useProjectStore(useShallow(state => project
    ? selectProjectViews(state, project.id).flatMap(view => view.type === "board"
      ? selectTaskBoards(state, project.id, view.id).filter(board => board.stage !== "done") : [])
    : []
  ))
  const board = boards.find(candidate => candidate.id === boardId)

  function continueToForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!project || !board) return
    setChoosingBoard(false)
    setSession({ key: crypto.randomUUID(), projectId: project.id, boardId: board.id })
  }

  return (
    <div className="space-y-3">
      <Button ref={triggerRef} type="button" aria-expanded={choosingBoard} aria-controls={panelId}
        onClick={() => { setChoosingBoard(open => !open); setCreatedTitle(null) }}>
        New task
      </Button>
      {choosingBoard ? (
        <form id={panelId} onSubmit={continueToForm} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <label className="grid min-w-0 flex-1 basis-52 gap-1.5 text-sm font-medium">
            Project
            <select autoFocus required className="h-11 min-w-0 rounded-md border bg-background px-3 text-sm" value={project?.id ?? ""}
              onChange={event => { setProjectId(event.target.value); setBoardId("") }}>
              <option value="">Select project</option>
              {workspaces.map(workspace => (
                <optgroup key={workspace.id} label={workspace.title}>
                  {projects.filter(candidate => candidate.workspaceId === workspace.id).map(candidate => (
                    <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 flex-1 basis-52 gap-1.5 text-sm font-medium">
            Board
            <select required disabled={!project || boards.length === 0} className="h-11 min-w-0 rounded-md border bg-background px-3 text-sm disabled:opacity-50"
              value={board?.id ?? ""} onChange={event => setBoardId(event.target.value)}>
              <option value="">{project && boards.length === 0 ? "No unfinished Boards" : "Select Board"}</option>
              {boards.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!project || !board}>Continue</Button>
          <Button type="button" variant="ghost" onClick={() => { setChoosingBoard(false); triggerRef.current?.focus() }}>Cancel</Button>
          {project && boards.length === 0 ? (
            <Link className="text-sm underline" href={getProjectViewHref(project.workspaceId, project.id, "work")}>Open project</Link>
          ) : null}
          {projects.length === 0 ? <p className="w-full text-sm text-muted-foreground">No active projects.</p> : null}
        </form>
      ) : null}
      <p role="status" className={createdTitle ? "text-sm text-muted-foreground" : "sr-only"}>
        {createdTitle ? "Task created: " + createdTitle : ""}
      </p>
      {session ? (
        <ProjectWorkItemDialog key={session.key} projectId={session.projectId}
          session={{ key: session.key, mode: "create", boardId: session.boardId }}
          initialDueDate={initialDueDate} finalFocus={triggerRef} onCreated={setCreatedTitle}
          onOpenChange={open => { if (!open) setSession(null) }} />
      ) : null}
    </div>
  )
}
