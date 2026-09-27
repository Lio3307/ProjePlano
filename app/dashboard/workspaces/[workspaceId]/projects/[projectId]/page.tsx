import { ProjectWorkspace } from "@/features/project/components/project-workspace"
import { getLocalDateKey } from "@/features/project/overview"
import type { ProjectQueryValue } from "@/features/project/query-state"

interface ProjectPageProps {
  params: Promise<{
    workspaceId: string
    projectId: string
  }>
  searchParams: Promise<{
    view?: ProjectQueryValue
    workView?: ProjectQueryValue
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

  return (
    <ProjectWorkspace
      workspaceId={workspaceId}
      projectId={projectId}
      today={getLocalDateKey(new Date())}
      viewQuery={query.view}
      workViewQuery={query.workView}
      resourceQuery={query.resource}
    />
  )
}
