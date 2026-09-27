"use client"

import {
  CalendarDays,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  Search,
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
  useSidebar,
} from "@/components/ui/sidebar"
import { selectProjectsByWorkspaceId, selectWorkspaces } from "@/features/project/selectors"
import { useProjectStore } from "@/features/project/store-provider"

export function AppSidebar() {
  const workspaces = useProjectStore(useShallow(selectWorkspaces))
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const pathnameWorkspaceId = getPathnameWorkspaceId(pathname)
  const workspace = pathnameWorkspaceId
    ? workspaces.find(
        (candidate) => candidate.id === pathnameWorkspaceId
      ) ?? null
    : workspaces[0] ?? null
  const workspaceId = workspace?.id ?? ""
  const projects = useProjectStore(
    useShallow((state) =>
      selectProjectsByWorkspaceId(state, workspaceId).filter(project => !project.archived)
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
                <Link
                  href="/dashboard"
                  aria-label="ProjePlano dashboard"
                  onClick={() => setOpenMobile(false)}
                />
              }
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                P
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">
                  ProjePlano
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  A place for your next build
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
                title="Workspaces"
                url="/dashboard"
                icon={LayoutDashboard}
                isActive={pathname === "/dashboard"}
              />
              <SidebarNavigationItem
                title="Today"
                url="/dashboard/today"
                icon={CalendarDays}
                isActive={pathname === "/dashboard/today"}
              />
              <SidebarNavigationItem
                title="Upcoming"
                url="/dashboard/upcoming"
                icon={CalendarRange}
                isActive={pathname === "/dashboard/upcoming"}
              />
              <SidebarNavigationItem
                title="Search tasks"
                url="/dashboard/search"
                icon={Search}
                isActive={pathname === "/dashboard/search"}
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
                  url={"/dashboard/workspaces/" + workspace.id}
                  icon={FolderKanban}
                  isActive={pathname === "/dashboard/workspaces/" + workspace.id}
                />
              </SidebarMenu>
            </SidebarGroupContent>
            <SidebarGroupLabel className="mt-4">Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
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

function getPathnameWorkspaceId(pathname: string) {
  const match = /^\/dashboard\/workspaces\/([^/]+)(?:\/|$)/.exec(pathname)

  return match?.[1] ?? null
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
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="min-h-11 data-active:bg-primary/5 data-active:text-primary"
        tooltip={title}
        isActive={isActive}
        render={
          <Link
            href={url}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setOpenMobile(false)}
          />
        }
      >
        <Icon aria-hidden="true" />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
