import { Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ProjectResource } from "../model"
import {
  getProjectViewHref,
  type ProjectSelection,
} from "../query-state"
import {
  PROJECT_VIEW_DEFINITIONS,
  type SupportedProjectView,
  type SupportedProjectViewType,
} from "../view-definitions"

type ProjectNavigationProps = {
  workspaceId: string
  projectId: string
  selection: ProjectSelection
  workViews: readonly SupportedProjectView[]
  documents: readonly ProjectResource[]
  missingViewTypes: readonly SupportedProjectViewType[]
  onAddView: (type: SupportedProjectViewType) => void
}

export function ProjectNavigation({
  workspaceId,
  projectId,
  selection,
  workViews,
  documents,
  missingViewTypes,
  onAddView,
}: ProjectNavigationProps) {
  const activeWorkView =
    selection.kind === "work" ? selection.view : workViews[0] ?? null
  const activeDocument =
    selection.kind === "document"
      ? selection.resource
      : documents[0] ?? null
  const workIsActive = selection.kind === "work"
  const documentsAreActive =
    selection.kind === "document" ||
    selection.kind === "missing-resource"

  return (
    <div className="border-b bg-background">
      <nav
        aria-label="Project areas"
        className="flex min-w-0 gap-1 overflow-x-auto px-4 py-2"
      >
        <ProjectTabLink
          href={getProjectViewHref(
            workspaceId,
            projectId,
            "overview"
          )}
          active={selection.kind === "overview"}
          current={selection.kind === "overview"}
        >
          Overview
        </ProjectTabLink>

        {activeWorkView ? (
          <ProjectTabLink
            href={getProjectViewHref(
              workspaceId,
              projectId,
              activeWorkView.type
            )}
            active={workIsActive}
            current={false}
          >
            Work
          </ProjectTabLink>
        ) : null}

        {activeDocument ? (
          <ProjectTabLink
            href={getProjectViewHref(
              workspaceId,
              projectId,
              "documents",
              activeDocument.id
            )}
            active={documentsAreActive}
            current={selection.kind === "document"}
          >
            Documents
          </ProjectTabLink>
        ) : null}
      </nav>

      {selection.kind === "work" ? (
        <nav
          aria-label="Work views"
          className="flex min-w-0 items-center gap-1 overflow-x-auto border-t px-4 py-2"
        >
          {workViews.map((view) => (
            <ProjectTabLink
              key={view.id}
              href={getProjectViewHref(
                workspaceId,
                projectId,
                view.type
              )}
              active={view.id === selection.view.id}
              current={view.id === selection.view.id}
              compact
            >
              {view.title}
            </ProjectTabLink>
          ))}

          {missingViewTypes.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-1"
                  />
                }
              >
                <Plus aria-hidden="true" />
                Add view
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {missingViewTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => onAddView(type)}
                  >
                    {PROJECT_VIEW_DEFINITIONS[type].title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}

function ProjectTabLink({
  active,
  children,
  compact = false,
  current,
  href,
}: {
  active: boolean
  children: React.ReactNode
  compact?: boolean
  current: boolean
  href: string
}) {
  return (
    <Button
      nativeButton={false}
      size={compact ? "sm" : "default"}
      variant={active ? "secondary" : "ghost"}
      className={cn("shrink-0", active && "text-foreground")}
      render={
        <Link
          href={href}
          aria-current={current ? "page" : undefined}
        />
      }
    >
      {children}
    </Button>
  )
}
