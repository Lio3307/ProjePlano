import { notFound } from "next/navigation"

import { WorkspaceMembersView } from "@/features/member/components/workspace-members-view"
import { getWorkspaceById } from "@/features/workspace/mock-data"

type WorkspaceMembersPageProps = {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspaceMembersPage({
  params,
}: WorkspaceMembersPageProps) {
  const { workspaceId } = await params
  const workspace = getWorkspaceById(workspaceId)

  if (!workspace) {
    notFound()
  }

  return <WorkspaceMembersView workspace={workspace} />
}
