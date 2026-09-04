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
import { BoardDialog } from "@/features/kanban/components/board-dialog"
import { LabelManagerDialog } from "@/features/kanban/components/label-manager-dialog"
import type { BoardLabel } from "@/features/project/board"
import { useProjectStore } from "@/features/project/store-provider"
import type { EditableTaskBoardFields } from "@/features/project/task-board"
import type { Workspace } from "@/features/workspace/types"
import { buildProjectOverviewSummary } from "../overview"
import {
  getProjectViewHref,
  resolveProjectSelection,
  type ProjectQueryValue,
  type ProjectSelection,
} from "../query-state"
import {
  selectDocumentLinkedWorkItems,
  selectProjectDocumentResources,
  selectProjectForWorkspace,
  selectProjectMilestones,
  selectProjectResolvedWorkItems,
  selectProjectResources,
  selectSupportedProjectViews,
  selectTaskBoards,
} from "../selectors"
import { getProjectTemplate } from "../templates"
import type { GenericProjectViewType } from "../project-state"
import { NewDocumentDialog } from "./new-document-dialog"
import { ProjectNavigation } from "./project-navigation"
import { ProjectOverview } from "./project-overview"
import { ProjectView } from "./project-view"

type ProjectWorkspaceProps = {
  workspace: Workspace
  projectId: string
  today: string
  viewQuery: ProjectQueryValue
  workViewQuery: ProjectQueryValue
  resourceQuery: ProjectQueryValue
}

type BoardDialogSession =
  | { key: string; mode: "create" }
  | { key: string; mode: "edit"; boardId: string }

export function ProjectWorkspace({
  workspace,
  projectId,
  today,
  viewQuery,
  workViewQuery,
  resourceQuery,
}: ProjectWorkspaceProps) {
  const router = useRouter()
  const [actionError, setActionError] = useState<string | null>(null)
  const [boardDialogSession, setBoardDialogSession] =
    useState<BoardDialogSession | null>(null)
  const [labelManagerOpen, setLabelManagerOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const boardDialogTriggerRef = useRef<HTMLElement | null>(null)
  const labelManagerTriggerRef = useRef<HTMLElement | null>(null)
  const documentDialogTriggerRef = useRef<HTMLButtonElement>(null)
  const project = useProjectStore((state) =>
    selectProjectForWorkspace(state, workspace.id, projectId)
  )
  const workViews = useProjectStore(
    useShallow((state) =>
      selectSupportedProjectViews(state, projectId)
    )
  )
  const boardView = workViews.find((view) => view.type === "board") ?? null
  const taskBoards = useProjectStore(
    useShallow((state) =>
      boardView
        ? selectTaskBoards(state, projectId, boardView.id)
        : []
    )
  )
  const documents = useProjectStore(
    useShallow((state) =>
      selectProjectDocumentResources(state, projectId)
    )
  )
  const resolvedWorkItems = useProjectStore(
    useShallow((state) =>
      selectProjectResolvedWorkItems(state, projectId)
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
  const addProjectView = useProjectStore(
    (state) => state.addProjectView
  )
  const createFirstTaskBoard = useProjectStore(
    (state) => state.createFirstTaskBoard
  )
  const addTaskBoard = useProjectStore((state) => state.addTaskBoard)
  const updateTaskBoard = useProjectStore(
    (state) => state.updateTaskBoard
  )
  const updateBoardLabels = useProjectStore(
    (state) => state.updateBoardLabels
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
        {
          view: viewQuery,
          workView: workViewQuery,
          resource: resourceQuery,
        }
      ),
    [documents, resourceQuery, viewQuery, workViewQuery, workViews]
  )
  const documentLinkedWorkItems = useProjectStore(
    useShallow((state) =>
      selection.kind === "document"
        ? selectDocumentLinkedWorkItems(
            state,
            projectId,
            selection.resource.id
          )
        : []
    )
  )
  const linkedWorkItems = useMemo(
    () =>
      documentLinkedWorkItems.map((linkedWorkItem) => ({
        ...linkedWorkItem,
        href: getProjectViewHref(
          workspace.id,
          projectId,
          "board",
          { workViewId: linkedWorkItem.boardViewId }
        ),
      })),
    [documentLinkedWorkItems, projectId, workspace.id]
  )
  const summary = useMemo(
    () =>
      buildProjectOverviewSummary({
        today,
        workItems: resolvedWorkItems,
        milestones,
        resources,
      }),
    [milestones, resolvedWorkItems, resources, today]
  )
  const boardDialogBoard =
    boardDialogSession?.mode === "edit"
      ? (taskBoards.find(
          (taskBoard) => taskBoard.id === boardDialogSession.boardId
        ) ?? null)
      : null

  if (!project) {
    return <MissingProjectState workspace={workspace} />
  }

  function handleAddView(type: GenericProjectViewType) {
    const viewId =
      "view-" +
      projectId +
      "-" +
      type +
      "-" +
      crypto.randomUUID()
    const created = addProjectView({
      id: viewId,
      projectId,
      type,
    })

    if (!created) {
      setActionError("The view could not be added.")
      return
    }

    setActionError(null)
    router.push(
      getProjectViewHref(workspace.id, projectId, type, {
        workViewId: viewId,
      })
    )
  }

  function openCreateBoardDialog(trigger: HTMLElement) {
    boardDialogTriggerRef.current = trigger
    setActionError(null)
    setBoardDialogSession({
      key: crypto.randomUUID(),
      mode: "create",
    })
  }

  function openEditBoardDialog(boardId: string, trigger: HTMLElement) {
    const board = taskBoards.find(
      (taskBoard) => taskBoard.id === boardId
    )

    if (!board) {
      setActionError("The Board is no longer available.")
      return
    }

    boardDialogTriggerRef.current = trigger
    setActionError(null)
    setBoardDialogSession({
      key: crypto.randomUUID(),
      mode: "edit",
      boardId,
    })
  }

  function openLabelManagerDialog(trigger: HTMLElement) {
    if (!boardView) {
      setActionError("The Kanban view is no longer available.")
      return
    }

    labelManagerTriggerRef.current = trigger
    setActionError(null)
    setLabelManagerOpen(true)
  }

  function handleCreateBoard(fields: EditableTaskBoardFields) {
    const boardId = "board-" + projectId + "-" + crypto.randomUUID()

    if (boardView) {
      const created = addTaskBoard({
        id: boardId,
        projectId,
        viewId: boardView.id,
        ...fields,
      })

      if (created) {
        setActionError(null)
      }

      return created
    }

    const viewId = "view-" + projectId + "-board-" + crypto.randomUUID()
    const created = createFirstTaskBoard({
      viewId,
      board: {
        id: boardId,
        projectId,
        ...fields,
      },
    })

    if (!created) {
      return false
    }

    setActionError(null)
    router.push(
      getProjectViewHref(workspace.id, projectId, "board", {
        workViewId: viewId,
      })
    )
    return true
  }

  function handleSaveBoard(
    boardId: string,
    fields: EditableTaskBoardFields
  ) {
    return updateTaskBoard({ boardId, ...fields })
  }

  function handleSaveLabels(labels: BoardLabel[]) {
    if (!boardView) {
      return false
    }

    return updateBoardLabels({ viewId: boardView.id, labels })
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
        { resourceId }
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
      className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col"
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
        onAddBoard={openCreateBoardDialog}
        onAddView={handleAddView}
        onAddDocument={handleAddDocument}
      />

      {boardDialogSession &&
      (boardDialogSession.mode === "create" || boardDialogBoard) ? (
        <BoardDialog
          key={boardDialogSession.key}
          open
          mode={boardDialogSession.mode}
          board={boardDialogBoard}
          finalFocus={() =>
            boardDialogTriggerRef.current?.isConnected
              ? boardDialogTriggerRef.current
              : null
          }
          onOpenChange={(open) => {
            if (!open) {
              setBoardDialogSession(null)
            }
          }}
          onCreate={handleCreateBoard}
          onSave={handleSaveBoard}
        />
      ) : null}

      {labelManagerOpen && boardView ? (
        <LabelManagerDialog
          open
          labels={boardView.labels}
          finalFocus={() =>
            labelManagerTriggerRef.current?.isConnected
              ? labelManagerTriggerRef.current
              : null
          }
          onOpenChange={setLabelManagerOpen}
          onSave={handleSaveLabels}
        />
      ) : null}

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
              workViews={workViews}
              onAddDocument={handleAddDocument}
            />
          </div>
        ) : selection.kind === "empty-work" ? (
          <EmptyWorkState onAddBoard={openCreateBoardDialog} />
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
            linkedWorkItems={linkedWorkItems}
            onAddBoard={openCreateBoardDialog}
            onEditBoard={openEditBoardDialog}
            onSetLabels={openLabelManagerDialog}
            onSaveDocument={saveProjectDocument}
          />
        )}
      </div>
    </div>
  )
}

function EmptyWorkState({
  onAddBoard,
}: {
  onAddBoard: (trigger: HTMLElement) => void
}) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <Card data-empty-work-state className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>No work views yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-prose text-muted-foreground">
            Add a Board to organize project tasks, or use the + menu for a
            Table or Calendar view.
          </p>
          <Button
            type="button"
            onClick={(event) => onAddBoard(event.currentTarget)}
          >
            Add board
          </Button>
        </CardContent>
      </Card>
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
                    { resourceId: fallbackResourceId }
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
    case "empty-work":
      return "empty-work"
    case "work":
      return selection.view.type
    case "document":
      return "document"
    case "missing-resource":
      return "missing-resource"
  }
}
