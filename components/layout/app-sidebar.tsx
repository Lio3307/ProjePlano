"use client"

import type { LucideIcon } from "lucide-react"
import {
  CalendarDays,
  Columns3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Table2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { ProjectType } from "@/features/project/types"

const PROJECT_TYPE_ICONS: Record<ProjectType, LucideIcon> = {
  document: FileText,
  kanban: Columns3,
  table: Table2,
  calendar: CalendarDays,
}

interface SidebarWorkspace {
  title: string
  url: string
}

interface SidebarProject {
  title: string
  type: ProjectType
  url: string
}

interface AppSidebarProps {
  workspace: SidebarWorkspace | null
  projects: SidebarProject[]
}

export function AppSidebar({ workspace, projects }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="ProjePlano"
              render={
                <Link href="/dashboard" aria-label="ProjePlano dashboard" />
              }
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                P
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">
                  ProjePlano
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/60">
                  Project workspace
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNavigationItem
                title="Overview"
                url="/dashboard"
                icon={LayoutDashboard}
                isActive={pathname === "/dashboard"}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {workspace ? (
          <SidebarGroup>
            <SidebarGroupLabel>{workspace.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNavigationItem
                  title="Workspace overview"
                  url={workspace.url}
                  icon={FolderKanban}
                  isActive={pathname === workspace.url}
                />
                {projects.map((project) => (
                  <SidebarNavigationItem
                    key={project.url}
                    title={project.title}
                    url={project.url}
                    icon={PROJECT_TYPE_ICONS[project.type]}
                    isActive={pathname === project.url}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

function SidebarNavigationItem({
  icon: Icon,
  isActive,
  title,
  url,
}: {
  icon: LucideIcon
  isActive: boolean
  title: string
  url: string
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={title}
        isActive={isActive}
        render={
          <Link
            href={url}
            aria-current={isActive ? "page" : undefined}
          />
        }
      >
        <Icon aria-hidden="true" />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
