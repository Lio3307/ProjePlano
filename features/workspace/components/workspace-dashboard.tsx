"use client"

import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import { RecordDetailsDialog } from "@/components/ui/record-details-dialog"
import { getLocalDateKey } from "@/features/project/overview"
import { selectWorkspaces } from "@/features/project/selectors"
import { useProjectStore } from "@/features/project/store-provider"
import { WorkspaceList } from "./workspace-list"

export function WorkspaceDashboard() {
  const workspaces = useProjectStore(useShallow(selectWorkspaces))
  const createWorkspace = useProjectStore(state => state.createWorkspace)
  const [creating, setCreating] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-sm tabular-nums text-muted-foreground">{workspaces.length} workspaces</p>
        </div>
        <Button ref={triggerRef} onClick={() => setCreating(true)}><Plus />New workspace</Button>
      </header>
      <WorkspaceList workspaces={workspaces} />
      {creating ? (
        <RecordDetailsDialog title="New workspace" submitLabel="Create workspace"
          initialValue={{ title: "", description: "" }} finalFocus={triggerRef} onClose={() => setCreating(false)}
          onSave={(details) => {
            const id = "workspace-" + crypto.randomUUID()
            const created = createWorkspace({ ...details, id, createdAt: getLocalDateKey(new Date()) })
            if (created) router.push("/dashboard/workspaces/" + id)
            return created
          }} />
      ) : null}
    </div>
  )
}
