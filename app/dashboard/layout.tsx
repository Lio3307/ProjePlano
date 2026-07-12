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
      <main className="flex-1">
        <div className="sticky top-0 z-10 bg-background">
          <SidebarTrigger/>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
