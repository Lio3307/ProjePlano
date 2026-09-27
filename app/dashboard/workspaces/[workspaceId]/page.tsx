import { WorkspaceDetail } from "@/features/workspace/components/workspace-detail"

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  return <WorkspaceDetail workspaceId={workspaceId} />
}
