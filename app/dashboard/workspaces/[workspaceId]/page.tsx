import { CircleUserRound, EllipsisVertical } from "lucide-react"
import { notFound } from "next/navigation"

import { WorkspaceProjects } from "@/features/project/components/workspace-projects"
import { getWorkspaceById } from "@/features/workspace/mock-data"

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const workspace = getWorkspaceById(workspaceId)

  if (!workspace) notFound()

  return (
    <div className="mt-4 flex flex-col space-y-6 p-4">
      <div className="flex justify-between">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">{workspace.title}</h1>
          <p className="text-sm">{workspace.description}</p>
          <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <p>Created by: {workspace.author}</p>
            <p>Created at: {workspace.createdAt}</p>
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <EllipsisVertical className="size-5" />
          <CircleUserRound className="size-6" />
        </div>
      </div>
      <WorkspaceProjects workspaceId={workspace.id} />
    </div>
  )
}
