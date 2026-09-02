import { notFound } from "next/navigation"

import { ProjectWorkspace } from "@/features/project/components/project-workspace"
import { getLocalDateKey } from "@/features/project/overview"
import type { ProjectQueryValue } from "@/features/project/query-state"
import { getWorkspaceById } from "@/features/workspace/mock-data"

interface ProjectPageProps {
  params: Promise<{
    workspaceId: string
    projectId: string
  }>
  searchParams: Promise<{
    view?: ProjectQueryValue
    resource?: ProjectQueryValue
  }>
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const [{ workspaceId, projectId }, query] = await Promise.all([
    params,
    searchParams,
  ])
  const workspace = getWorkspaceById(workspaceId)

  if (!workspace) {
    notFound()
  }

  return (
    <ProjectWorkspace
      workspace={workspace}
      projectId={projectId}
      today={getLocalDateKey(new Date())}
      viewQuery={query.view}
      resourceQuery={query.resource}
    />
  )
}
