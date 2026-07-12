import WorkspaceList from "@/components/dashboard/workspaces"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between">
      <h4 className="font-semibold">Your Workspaces</h4>
      <Button size={"lg"}>New</Button>
      </div>
      <WorkspaceList/>
    </div>
  )
}