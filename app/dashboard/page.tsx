import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { WorkspaceList } from "@/features/workspace/components/workspace-list"
import { WORKSPACES } from "@/features/workspace/mock-data"

export default function DashboardPage() {
  return (
    <div className="mt-4 space-y-6 p-4">
      <div className="flex justify-between">
        <h1 className="font-semibold">Your Workspaces</h1>
        <Button size="lg">
          <Plus /> New
        </Button>
      </div>
      <WorkspaceList workspaces={WORKSPACES} />
    </div>
  )
}
