import { notFound } from "next/navigation"

import { ProjectView } from "@/features/project/components/project-view"
import { getProjectById } from "@/features/project/mock-data"
import { getWorkspaceById } from "@/features/workspace/mock-data"

interface ProjectPageProps {
  params: Promise<{
    workspaceId: string
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = await params
  const workspace = getWorkspaceById(workspaceId)
  const project = getProjectById(workspaceId, projectId)

  if (!workspace || !project) {
    notFound()
  }

  return <ProjectView workspace={workspace} project={project} />
}
