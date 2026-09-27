import { WorkspaceList } from "@/features/workspace/components/workspace-list"
import { WORKSPACES } from "@/features/workspace/mock-data"

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between gap-4 border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
        <span className="text-sm tabular-nums text-muted-foreground">
          {WORKSPACES.length} workspaces
        </span>
      </header>
      <WorkspaceList workspaces={WORKSPACES} />
    </div>
  )
}
