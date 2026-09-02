"use client"

import {
  FolderKanban,
  LayoutDashboard,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useShallow } from "zustand/react/shallow"

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
import { selectProjectsByWorkspaceId } from "@/features/project/selectors"
import { useProjectStore } from "@/features/project/store-provider"

interface SidebarWorkspace {
  id: string
  title: string
  url: string
}

interface AppSidebarProps {
  workspace: SidebarWorkspace | null
}

export function AppSidebar({ workspace }: AppSidebarProps) {
  const pathname = usePathname()
  const workspaceId = workspace?.id ?? ""
  const projects = useProjectStore(
    useShallow((state) =>
      selectProjectsByWorkspaceId(state, workspaceId)
    )
  )

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
                {projects.map((project) => {
                  const url =
                    "/dashboard/workspaces/" +
                    project.workspaceId +
                    "/projects/" +
                    project.id

                  return (
                    <SidebarNavigationItem
                      key={project.id}
                      title={project.title}
                      url={url}
                      icon={FolderKanban}
                      isActive={pathname === url}
                    />
                  )
                })}
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
