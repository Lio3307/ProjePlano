"use client"

import { useRef, useState } from "react"
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DeleteRecordDialog } from "@/components/ui/delete-record-dialog"
import { RecordDetailsDialog } from "@/components/ui/record-details-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjectStore } from "@/features/project/store-provider"
import type { Workspace } from "../types"

export function WorkspaceActions({ workspace }: { workspace: Workspace }) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const updateWorkspace = useProjectStore(state => state.updateWorkspace)
  const deleteWorkspace = useProjectStore(state => state.deleteWorkspace)
  const pathname = usePathname()
  const router = useRouter()
  const close = () => setDialog(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button ref={triggerRef} variant="ghost" size="icon" aria-label={"Open actions for " + workspace.title} />}>
          <EllipsisVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}><Pencil />Edit workspace</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}><Trash2 />Delete workspace</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog === "edit" ? (
        <RecordDetailsDialog title="Edit workspace" initialValue={workspace} finalFocus={triggerRef} onClose={close}
          onSave={(details) => (details.title === workspace.title && details.description === workspace.description) ||
            updateWorkspace(workspace.id, details)} />
      ) : null}
      {dialog === "delete" ? (
        <DeleteRecordDialog title={"Delete " + workspace.title + "?"}
          description="This deletes the workspace and all its projects, tasks, documents, and Tables from this session. This cannot be undone."
          finalFocus={triggerRef} onClose={close} onDelete={() => {
            const deleted = deleteWorkspace(workspace.id)
            const href = "/dashboard/workspaces/" + workspace.id
            if (deleted && (pathname === href || pathname.startsWith(href + "/"))) router.replace("/dashboard")
            return deleted
          }} />
      ) : null}
    </>
  )
}
