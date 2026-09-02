import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ProjectStoreProvider } from "@/features/project/store-provider"
import { getWorkspaceById } from "@/features/workspace/mock-data"

const PRIMARY_WORKSPACE_ID = "project-alpha"
const primaryWorkspace = getWorkspaceById(PRIMARY_WORKSPACE_ID)

const sidebarWorkspace = primaryWorkspace
  ? {
      id: primaryWorkspace.id,
      title: primaryWorkspace.title,
      url: "/dashboard/workspaces/" + primaryWorkspace.id,
    }
  : null

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ProjectStoreProvider>
      <SidebarProvider>
        <AppSidebar workspace={sidebarWorkspace} />
        <main className="flex min-h-svh min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center border-b bg-background px-3">
            <SidebarTrigger />
          </header>
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </main>
      </SidebarProvider>
    </ProjectStoreProvider>
  )
}
