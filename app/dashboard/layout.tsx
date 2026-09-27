import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ProjectStoreProvider } from "@/features/project/store-provider"
import { BackupDialog } from "@/features/project/components/backup-dialog"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ProjectStoreProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex min-h-svh w-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center gap-3 border-b bg-background px-3 sm:px-5">
            <SidebarTrigger size="icon" />
            <span className="text-sm font-medium">ProjePlano</span>
            <BackupDialog />
          </header>
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </main>
      </SidebarProvider>
    </ProjectStoreProvider>
  )
}
