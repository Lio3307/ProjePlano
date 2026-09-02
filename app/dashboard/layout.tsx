import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { getProjectsByWorkspaceId } from "@/features/project/mock-data"
import { getWorkspaceById } from "@/features/workspace/mock-data"

const PRIMARY_WORKSPACE_ID = "project-alpha"
const primaryWorkspace = getWorkspaceById(PRIMARY_WORKSPACE_ID)

const sidebarWorkspace = primaryWorkspace
  ? {
      title: primaryWorkspace.title,
      url: `/dashboard/workspaces/${primaryWorkspace.id}`,
    }
  : null

const sidebarProjects = primaryWorkspace
  ? getProjectsByWorkspaceId(primaryWorkspace.id).map((project) => ({
      title: project.title,
      type: project.type,
      url: `/dashboard/workspaces/${project.workspaceId}/projects/${project.id}`,
    }))
  : []

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar
        workspace={sidebarWorkspace}
        projects={sidebarProjects}
      />
      <main className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center border-b bg-background px-3">
          <SidebarTrigger />
        </header>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </main>
    </SidebarProvider>
  )
}
