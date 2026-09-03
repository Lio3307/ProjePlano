"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useProjectStore } from "@/features/project/store-provider"
import type { Workspace } from "@/features/workspace/types"
import { buildProjectOverviewSummary } from "../overview"
import {
  getProjectViewHref,
  resolveProjectSelection,
  type ProjectQueryValue,
  type ProjectSelection,
} from "../query-state"
import {
  selectMissingSupportedViewTypes,
  selectProjectDocumentResources,
  selectProjectForWorkspace,
  selectProjectMilestones,
  selectProjectResources,
  selectProjectWorkItems,
  selectSupportedProjectViews,
} from "../selectors"
import { getProjectTemplate } from "../templates"
import type { SupportedProjectViewType } from "../view-definitions"
import { NewDocumentDialog } from "./new-document-dialog"
import { ProjectNavigation } from "./project-navigation"
import { ProjectOverview } from "./project-overview"
import { ProjectView } from "./project-view"

type ProjectWorkspaceProps = {
  workspace: Workspace
  projectId: string
  today: string
  viewQuery: ProjectQueryValue
  resourceQuery: ProjectQueryValue
}

export function ProjectWorkspace({
  workspace,
  projectId,
  today,
  viewQuery,
  resourceQuery,
}: ProjectWorkspaceProps) {
  const router = useRouter()
  const [actionError, setActionError] = useState<string | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const documentDialogTriggerRef = useRef<HTMLButtonElement>(null)
  const project = useProjectStore((state) =>
    selectProjectForWorkspace(state, workspace.id, projectId)
  )
  const workViews = useProjectStore(
    useShallow((state) =>
      selectSupportedProjectViews(state, projectId)
    )
  )
  const documents = useProjectStore(
    useShallow((state) =>
      selectProjectDocumentResources(state, projectId)
    )
  )
  const workItems = useProjectStore(
    useShallow((state) =>
      selectProjectWorkItems(state, projectId)
    )
  )
  const resources = useProjectStore(
    useShallow((state) =>
      selectProjectResources(state, projectId)
    )
  )
  const milestones = useProjectStore(
    useShallow((state) =>
      selectProjectMilestones(state, projectId)
    )
  )
  const missingViewTypes = useProjectStore(
    useShallow((state) =>
      selectMissingSupportedViewTypes(state, projectId)
    )
  )
  const addProjectView = useProjectStore(
    (state) => state.addProjectView
  )
  const addProjectDocument = useProjectStore(
    (state) => state.addProjectDocument
  )
  const saveProjectDocument = useProjectStore(
    (state) => state.saveProjectDocument
  )
  const selection = useMemo(
    () =>
      resolveProjectSelection(
        workViews,
        documents,
        viewQuery,
        resourceQuery
      ),
    [documents, resourceQuery, viewQuery, workViews]
  )
  const summary = useMemo(
    () =>
      buildProjectOverviewSummary({
        today,
        workItems,
        milestones,
        resources,
      }),
    [milestones, resources, today, workItems]
  )

  if (!project) {
    return <MissingProjectState workspace={workspace} />
  }

  function handleAddView(type: SupportedProjectViewType) {
    if (!addProjectView(projectId, type)) {
      setActionError("The view could not be added.")
      return
    }

    setActionError(null)
    router.push(
      getProjectViewHref(workspace.id, projectId, type)
    )
  }

  function handleAddDocument(trigger: HTMLButtonElement) {
    documentDialogTriggerRef.current = trigger
    setActionError(null)
    setDocumentDialogOpen(true)
  }

  function handleCreateDocument(title: string) {
    const resourceId =
      "resource-" +
      projectId +
      "-document-" +
      crypto.randomUUID()
    const created = addProjectDocument({
      id: resourceId,
      projectId,
      title,
    })

    if (!created) {
      return false
    }

    setActionError(null)
    router.push(
      getProjectViewHref(
        workspace.id,
        projectId,
        "documents",
        resourceId
      )
    )
    return true
  }

  const templateName =
    getProjectTemplate(project.templateId)?.name ?? "Custom project"

  return (
    <div
      data-project-workspace={project.id}
      data-project-selection={getSelectionName(selection)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="space-y-3 border-b px-4 py-4 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap overflow-hidden">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/dashboard" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbLink
                className="truncate"
                render={
                  <Link
                    href={
                      "/dashboard/workspaces/" + workspace.id
                    }
                  />
                }
              >
                {workspace.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">
                {project.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">
              {project.title}
            </h1>
            {project.description ? (
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {project.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[0.625rem] font-medium capitalize text-primary">
              {project.status}
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-[0.625rem] text-muted-foreground">
              {templateName}
            </span>
            <span className="rounded-full border px-2 py-1 text-[0.625rem] text-muted-foreground">
              Frontend demo
            </span>
          </div>
        </div>
      </header>

      <ProjectNavigation
        workspaceId={workspace.id}
        projectId={project.id}
        selection={selection}
        workViews={workViews}
        documents={documents}
        missingViewTypes={missingViewTypes}
        onAddView={handleAddView}
        onAddDocument={handleAddDocument}
      />

      <NewDocumentDialog
        open={documentDialogOpen}
        finalFocus={documentDialogTriggerRef}
        onOpenChange={setDocumentDialogOpen}
        onCreate={handleCreateDocument}
      />

      {actionError ? (
        <p
          role="alert"
          className="border-b bg-destructive/10 px-4 py-2 text-xs text-destructive sm:px-6"
        >
          {actionError}
        </p>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1">
        {selection.kind === "overview" ? (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <ProjectOverview
              workspaceId={workspace.id}
              projectId={project.id}
              summary={summary}
              missingViewTypes={missingViewTypes}
              onAddView={handleAddView}
              onAddDocument={handleAddDocument}
            />
          </div>
        ) : selection.kind === "missing-resource" ? (
          <MissingResourceState
            workspaceId={workspace.id}
            projectId={project.id}
            fallbackResourceId={documents[0]?.id ?? null}
          />
        ) : (
          <ProjectView
            selection={selection}
            today={today}
            onSaveDocument={saveProjectDocument}
          />
        )}
      </div>
    </div>
  )
}

function MissingProjectState({ workspace }: { workspace: Workspace }) {
  return (
    <div
      data-project-selection="missing-project"
      className="p-4 sm:p-6"
    >
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Project not available</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>This project is not available in the frontend demo state.</p>
          <p>
            Projects created in the browser reset after a full page reload.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            nativeButton={false}
            variant="outline"
            render={
              <Link
                href={"/dashboard/workspaces/" + workspace.id}
              />
            }
          >
            Back to {workspace.title}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function MissingResourceState({
  workspaceId,
  projectId,
  fallbackResourceId,
}: {
  workspaceId: string
  projectId: string
  fallbackResourceId: string | null
}) {
  return (
    <div className="p-4 sm:p-6">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Document not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This document does not belong to the current project.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {fallbackResourceId ? (
            <Button
              nativeButton={false}
              variant="outline"
              render={
                <Link
                  href={getProjectViewHref(
                    workspaceId,
                    projectId,
                    "documents",
                    fallbackResourceId
                  )}
                />
              }
            >
              Open project document
            </Button>
          ) : null}
          <Button
            nativeButton={false}
            variant="ghost"
            render={
              <Link
                href={getProjectViewHref(
                  workspaceId,
                  projectId,
                  "overview"
                )}
              />
            }
          >
            Back to Overview
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function getSelectionName(selection: ProjectSelection) {
  switch (selection.kind) {
    case "overview":
      return "overview"
    case "work":
      return selection.view.type
    case "document":
      return "document"
    case "missing-resource":
      return "missing-resource"
  }
}
