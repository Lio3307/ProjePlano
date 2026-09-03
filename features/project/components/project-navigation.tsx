import { Plus } from "lucide-react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ProjectDocumentResource } from "../model"
import {
  getProjectViewHref,
  type ProjectSelection,
} from "../query-state"
import {
  PROJECT_VIEW_DEFINITIONS,
  SUPPORTED_PROJECT_VIEW_TYPES,
  type SupportedProjectView,
  type SupportedProjectViewType,
} from "../view-definitions"
import { ProjectDocumentNavigation } from "./project-document-navigation"

type ProjectNavigationProps = {
  workspaceId: string
  projectId: string
  selection: ProjectSelection
  workViews: readonly SupportedProjectView[]
  documents: readonly ProjectDocumentResource[]
  onAddView: (type: SupportedProjectViewType) => void
  onAddDocument: (trigger: HTMLButtonElement) => void
}

export function ProjectNavigation({
  workspaceId,
  projectId,
  selection,
  workViews,
  documents,
  onAddView,
  onAddDocument,
}: ProjectNavigationProps) {
  const activeWorkViewId =
    selection.kind === "work" ? selection.view.id : null
  const activeDocument =
    selection.kind === "document"
      ? selection.resource
      : documents[0] ?? null
  const workIsActive =
    selection.kind === "work" || selection.kind === "empty-work"
  const documentsAreActive =
    selection.kind === "document" ||
    selection.kind === "missing-resource"

  return (
    <div className="border-b bg-background">
      <div className="overflow-x-auto px-4 py-2">
        <nav
          aria-label="Project areas"
          data-project-tab-strip="primary"
          className="flex min-w-max divide-x border-y border-x"
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

          <ProjectTabLink
            href={getProjectViewHref(
              workspaceId,
              projectId,
              "work"
            )}
            active={workIsActive}
            current={selection.kind === "empty-work"}
          >
            Work
          </ProjectTabLink>

          {activeDocument ? (
            <ProjectTabLink
              href={getProjectViewHref(
                workspaceId,
                projectId,
                "documents",
                { resourceId: activeDocument.id }
              )}
              active={documentsAreActive}
              current={selection.kind === "document"}
            >
              Documents
            </ProjectTabLink>
          ) : null}
        </nav>
      </div>

      {workIsActive ? (
        <div className="overflow-x-auto border-t px-4 py-2">
          <nav
            aria-label="Work views"
            data-project-tab-strip="secondary"
            className="flex min-w-max divide-x border-y border-x"
          >
            {workViews.map((view) => (
              <ProjectTabLink
                key={view.id}
                href={getProjectViewHref(
                  workspaceId,
                  projectId,
                  view.type,
                  { workViewId: view.id }
                )}
                active={view.id === activeWorkViewId}
                current={view.id === activeWorkViewId}
                compact
              >
                {view.title}
              </ProjectTabLink>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-none border-0"
                    aria-label="Add work view"
                    data-add-work-view-trigger
                  />
                }
              >
                <Plus aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {SUPPORTED_PROJECT_VIEW_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => onAddView(type)}
                  >
                    {PROJECT_VIEW_DEFINITIONS[type].title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      ) : null}

      {documentsAreActive && activeDocument ? (
        <ProjectDocumentNavigation
          workspaceId={workspaceId}
          projectId={projectId}
          documents={documents}
          activeDocumentId={
            selection.kind === "document"
              ? selection.resource.id
              : undefined
          }
          onAddDocument={onAddDocument}
        />
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
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        buttonVariants({
          size: compact ? "sm" : "default",
          variant: active ? "secondary" : "ghost",
        }),
        "shrink-0 rounded-none border-0 px-3",
        active && "text-foreground"
      )}
    >
      {children}
    </Link>
  )
}
