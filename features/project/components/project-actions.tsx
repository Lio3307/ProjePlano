"use client"

import { useRef, useState } from "react"
import { Archive, ArchiveRestore, EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DeleteRecordDialog } from "@/components/ui/delete-record-dialog"
import { RecordDetailsDialog } from "@/components/ui/record-details-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjectStore } from "../store-provider"
import type { ProjectRecord, ProjectStatus } from "../model"

const PROJECT_STATUSES: ProjectStatus[] = ["planned", "active", "paused", "completed"]

export function ProjectActions({ project }: { project: ProjectRecord }) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null)
  const [status, setStatus] = useState(project.status)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const updateProject = useProjectStore(state => state.updateProject)
  const setProjectArchived = useProjectStore(state => state.setProjectArchived)
  const deleteProject = useProjectStore(state => state.deleteProject)
  const pathname = usePathname()
  const router = useRouter()
  const close = () => setDialog(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button ref={triggerRef} variant="ghost" size="icon" aria-label={"Open actions for " + project.title} />}>
          <EllipsisVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setStatus(project.status); setDialog("edit") }}><Pencil />Edit project</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setProjectArchived(project.id, !project.archived)}>
            {project.archived ? <ArchiveRestore /> : <Archive />}
            {project.archived ? "Restore project" : "Archive project"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}><Trash2 />Delete project</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog === "edit" ? (
        <RecordDetailsDialog title="Edit project" initialValue={project} finalFocus={triggerRef} onClose={close}
          onSave={(details) => (details.title === project.title && details.description === project.description && status === project.status) ||
            updateProject(project.id, { ...details, status })}>
          <label className="grid gap-1.5 text-sm font-medium">
            Project status
            <select className="h-11 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => {
              const next = PROJECT_STATUSES.find(value => value === event.target.value)
              if (next) setStatus(next)
            }}>
              {PROJECT_STATUSES.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
            </select>
          </label>
        </RecordDetailsDialog>
      ) : null}
      {dialog === "delete" ? (
        <DeleteRecordDialog title={"Delete " + project.title + "?"}
          description="This deletes the project and all its tasks, views, documents, and Tables from this session. This cannot be undone."
          finalFocus={triggerRef} onClose={close} onDelete={() => {
            const deleted = deleteProject(project.id)
            const workspaceHref = "/dashboard/workspaces/" + project.workspaceId
            if (deleted && pathname === workspaceHref + "/projects/" + project.id) router.replace(workspaceHref)
            return deleted
          }} />
      ) : null}
    </>
  )
}
