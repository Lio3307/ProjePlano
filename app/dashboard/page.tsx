import WorkspaceList from "@/components/dashboard/workspaces"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="mt-4 p-4 space-y-6">
      <div className="flex justify-between">
      <h4 className="font-semibold">Your Workspaces</h4>
      <Button size={"lg"}><Plus /> New</Button>
      </div>
      <WorkspaceList/>
    </div>
  )
}