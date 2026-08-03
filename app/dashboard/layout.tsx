import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col min-w-0 min-h-svh">
        <div className="sticky top-0 z-10 bg-background px-2 py-1">
          <SidebarTrigger/>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
