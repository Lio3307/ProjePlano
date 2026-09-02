import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { PROJECTS } from "@/features/project/mock-data"

const recentProjects = PROJECTS.slice(0, 3).map((project) => ({
  title: project.title,
  url: `/dashboard/workspaces/${project.workspaceId}/projects/${project.id}`,
}))

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar recentProjects={recentProjects} />
      <main className="flex flex-1 flex-col min-w-0 min-h-svh">
        <div className="sticky top-0 z-10 bg-background px-2 py-1">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 min-w-0 flex-col">{children}</div>
      </main>
    </SidebarProvider>
  )
}
