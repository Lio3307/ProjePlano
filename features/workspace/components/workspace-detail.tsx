"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WorkspaceProjects } from "@/features/project/components/workspace-projects"
import { useProjectStore } from "@/features/project/store-provider"
import { selectWorkspaceById } from "@/features/project/selectors"
import { WorkspaceOverviewHeader } from "./workspace-overview-header"

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const workspace = useProjectStore(state => selectWorkspaceById(state, workspaceId))
  if (!workspace) return <MissingWorkspaceState />
  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6">
      <WorkspaceOverviewHeader workspace={workspace} />
      <WorkspaceProjects workspaceId={workspace.id} />
    </div>
  )
}

export function MissingWorkspaceState() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Workspace not available</h1>
      <p className="text-sm text-muted-foreground">This workspace is not available in the current session.</p>
      <Button nativeButton={false} variant="outline" render={<Link href="/dashboard" />}>Back to workspaces</Button>
    </div>
  )
}
