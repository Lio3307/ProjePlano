"use client"

import {
  EllipsisVertical,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react"
import Link from "next/link"
import { useShallow } from "zustand/react/shallow"

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
import type { WorkspaceMember } from "@/features/member/model"
import { selectWorkspaceMembers } from "@/features/project/selectors"
import { useProjectStore } from "@/features/project/store-provider"
import { cn } from "@/lib/utils"
import type { Workspace } from "../types"

const MEMBER_PREVIEW_LIMIT = 5

type WorkspaceOverviewHeaderProps = {
  workspace: Workspace
}

export function WorkspaceOverviewHeader({
  workspace,
}: WorkspaceOverviewHeaderProps) {
  const members = useProjectStore(
    useShallow((state) =>
      selectWorkspaceMembers(state, workspace.id)
    )
  )
  const membersHref =
    "/dashboard/workspaces/" + workspace.id + "/members"

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
            <span>Created by {workspace.author}</span>
            <span aria-hidden="true">/</span>
            <time dateTime={workspace.createdAt}>
              Created {workspace.createdAt}
            </time>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start lg:shrink-0">
          <WorkspaceMemberPreview
            workspace={workspace}
            members={members}
            href={membersHref}
          />
          <WorkspaceActionsMenu
            workspace={workspace}
            membersHref={membersHref}
          />
        </div>
      </div>
    </header>
  )
}

function WorkspaceMemberPreview({
  workspace,
  members,
  href,
}: {
  workspace: Workspace
  members: readonly WorkspaceMember[]
  href: string
}) {
  const visibleMembers = members.slice(0, MEMBER_PREVIEW_LIMIT)
  const hiddenMemberCount = members.length - visibleMembers.length
  const memberCountLabel =
    members.length === 1 ? "1 member" : members.length + " members"
  const previewNames = visibleMembers
    .map((member) => member.name)
    .join(", ")
  const accessibleLabel =
    members.length === 0
      ? `View members for ${workspace.title}. No members yet.`
      : `View ${memberCountLabel} in ${workspace.title}. Preview: ${previewNames}.`

  return (
    <Link
      href={href}
      aria-label={accessibleLabel}
      className="group flex min-w-0 items-center gap-3 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      {visibleMembers.length > 0 ? (
        <span aria-hidden="true" className="flex shrink-0 -space-x-2">
          {visibleMembers.map((member) => (
            <span
              key={member.id}
              title={member.name}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full text-[0.625rem] font-semibold ring-2 ring-background",
                member.status === "inactive"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {member.initials}
            </span>
          ))}
          {hiddenMemberCount > 0 ? (
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-[0.625rem] font-semibold text-muted-foreground ring-2 ring-background">
              +{hiddenMemberCount}
            </span>
          ) : null}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <UsersRound className="size-3.5" />
        </span>
      )}

      <span className="min-w-0">
        <span className="block text-[0.625rem] text-muted-foreground">
          Members
        </span>
        <span className="block truncate text-xs font-medium group-hover:text-foreground">
          {members.length === 0 ? "No members yet" : memberCountLabel}
        </span>
      </span>
    </Link>
  )
}

function WorkspaceActionsMenu({
  workspace,
  membersHref,
}: {
  workspace: Workspace
  membersHref: string
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
        <DropdownMenuItem render={<Link href={membersHref} />}>
          <UsersRound aria-hidden="true" />
          Manage members
        </DropdownMenuItem>
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
