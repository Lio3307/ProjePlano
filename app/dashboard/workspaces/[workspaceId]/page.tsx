import { notFound } from "next/navigation"

import { WorkspaceProjects } from "@/features/project/components/workspace-projects"
import { WorkspaceOverviewHeader } from "@/features/workspace/components/workspace-overview-header"
import { getWorkspaceById } from "@/features/workspace/mock-data"

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const workspace = getWorkspaceById(workspaceId)

  if (!workspace) notFound()

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6">
      <WorkspaceOverviewHeader workspace={workspace} />
      <WorkspaceProjects workspaceId={workspace.id} />
    </div>
  )
}
