"use client"

import {
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Workspace } from "../types"

type WorkspaceOverviewHeaderProps = {
  workspace: Workspace
}

export function WorkspaceOverviewHeader({
  workspace,
}: WorkspaceOverviewHeaderProps) {
  return (
    <header
      data-workspace-overview-header={workspace.id}
      className="space-y-4 border-b pb-5"
    >
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap overflow-hidden">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard" />}>
              Workspaces
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">
              {workspace.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-semibold tracking-tight wrap-anywhere">
            {workspace.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {workspace.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={workspace.createdAt}>
              Created {workspace.createdAt}
            </time>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start lg:shrink-0">
          <WorkspaceActionsMenu workspace={workspace} />
        </div>
      </div>
    </header>
  )
}

function WorkspaceActionsMenu({
  workspace,
}: {
  workspace: Workspace
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={"Open actions for " + workspace.title}
          />
        }
      >
        <EllipsisVertical aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem disabled>
          <Pencil aria-hidden="true" />
          Edit workspace
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled>
          <Trash2 aria-hidden="true" />
          Delete workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
