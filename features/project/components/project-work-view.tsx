"use client"

import { useMemo, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { CalendarView } from "@/features/calendar/components/calendar-view"
import { KanbanView } from "@/features/kanban/components/kanban-view"
import { TableView } from "@/features/table/components/table-view"
import { WorkItemDialog } from "@/features/work-item/components/work-item-dialog"
import { WorkItemFiltersToolbar } from "@/features/work-item/components/work-item-filters"
import { createWorkItemFilters, filterWorkItems } from "@/features/work-item/filters"
import type { WorkItemDocumentOption } from "@/features/work-item/components/work-item-documents-field"
import type { EditableWorkItemFields } from "@/features/work-item/model"
import {
  selectBoardWorkItems,
  selectProjectById,
  selectProjectDocumentResources,
  selectProjectResolvedWorkItems,
  selectSupportedProjectViews,
  selectTaskBoards,
} from "../selectors"
import { getProjectViewHref } from "../query-state"
import { useProjectStore } from "../store-provider"
import type {
  SupportedProjectView,
  SupportedProjectViewType,
} from "../view-definitions"

type DialogSession =
  | { key: string; mode: "create"; boardId: string }
  | { key: string; mode: "view"; workItemId: string }

interface ProjectWorkViewProps {
  projectId: string
  view: SupportedProjectView
  today: string
  onAddBoard: (trigger: HTMLElement) => void
  onEditBoard: (boardId: string, trigger: HTMLElement) => void
  onSetLabels: (trigger: HTMLElement) => void
}

type SharedWorkItemViewProps = Omit<ProjectWorkViewProps, "view"> & {
  view: Extract<
    SupportedProjectView,
    { type: Exclude<SupportedProjectViewType, "table"> }
  >
}

export function ProjectWorkView({
  projectId,
  view,
  today,
  onAddBoard,
  onEditBoard,
  onSetLabels,
}: ProjectWorkViewProps) {
  if (view.type === "table") {
    return (
      <div
        data-project-work-view="table"
        className="min-w-0 p-4 sm:p-6"
      >
        <ProjectTableView viewId={view.id} />
      </div>
    )
  }

  return (
    <SharedWorkItemView
      projectId={projectId}
      view={view}
      today={today}
      onAddBoard={onAddBoard}
      onEditBoard={onEditBoard}
      onSetLabels={onSetLabels}
    />
  )
}

function ProjectTableView({ viewId }: { viewId: string }) {
  const data = useProjectStore(state => state.tablesByViewId[viewId])
  const updateTable = useProjectStore(state => state.updateTable)
  if (!data) return null
  return <TableView data={data} onUpdate={update => { updateTable(viewId, update) }} />
}

function SharedWorkItemView({
  projectId,
  view,
  today,
  onAddBoard,
  onEditBoard,
  onSetLabels,
}: SharedWorkItemViewProps) {
  const project = useProjectStore((state) =>
    selectProjectById(state, projectId)
  )
  const workspaceId = project?.workspaceId ?? ""
  const projectViews = useProjectStore(
    useShallow((state) => selectSupportedProjectViews(state, projectId))
  )
  const resolvedWorkItems = useProjectStore(
    useShallow((state) =>
      selectProjectResolvedWorkItems(state, projectId)
    )
  )
  const taskBoards = useProjectStore(
    useShallow((state) =>
      selectSupportedProjectViews(state, projectId).flatMap(
        (candidate) =>
          candidate.type === "board"
            ? selectTaskBoards(state, projectId, candidate.id)
            : []
      )
    )
  )
  const projectDocuments = useProjectStore(
    useShallow((state) =>
      selectProjectDocumentResources(state, projectId)
    )
  )
  const {
    createWorkItem,
    saveWorkItem,
    moveWorkItem,
    updateWorkItemDateRange,
    linkWorkItemDocument,
    unlinkWorkItemDocument,
    createAndLinkWorkItemDocument,
    deleteWorkItem,
  } = useProjectStore(
    useShallow((state) => ({
      createWorkItem: state.createWorkItem,
      saveWorkItem: state.saveWorkItem,
      moveWorkItem: state.moveWorkItem,
      updateWorkItemDateRange: state.updateWorkItemDateRange,
      linkWorkItemDocument: state.linkWorkItemDocument,
      unlinkWorkItemDocument: state.unlinkWorkItemDocument,
      createAndLinkWorkItemDocument:
        state.createAndLinkWorkItemDocument,
      deleteWorkItem: state.deleteWorkItem,
    }))
  )
  const [dialogSession, setDialogSession] =
    useState<DialogSession | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filters, setFilters] = useState(createWorkItemFilters)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dialogTriggerRef = useRef<HTMLElement | null>(null)
  const deleteFallbackRef = useRef<HTMLElement | null>(null)
  const boardViews = projectViews.filter(
    (candidate) => candidate.type === "board"
  )
  const workItems = useMemo(
    () => resolvedWorkItems.map(({ workItem }) => workItem),
    [resolvedWorkItems]
  )
  const stagesByBoardId = useMemo(
    () =>
      Object.fromEntries(
        taskBoards.map((taskBoard) => [taskBoard.id, taskBoard.stage])
      ),
    [taskBoards]
  )
  const activeBoards =
    view.type === "board"
      ? taskBoards.filter((taskBoard) => taskBoard.viewId === view.id)
      : []
  const visibleWorkItemIds = useMemo(
    () => new Set(
      filterWorkItems(workItems, stagesByBoardId, filters).map((workItem) => workItem.id)
    ),
    [workItems, stagesByBoardId, filters]
  )
  const dialogResolvedWorkItem =
    dialogSession?.mode === "view"
      ? (resolvedWorkItems.find(
          ({ workItem }) => workItem.id === dialogSession.workItemId
        ) ?? null)
      : null
  const dialogBoard =
    dialogSession?.mode === "create"
      ? (taskBoards.find(
          (taskBoard) => taskBoard.id === dialogSession.boardId
        ) ?? null)
      : (dialogResolvedWorkItem?.board ?? null)
  const dialogBoardView = dialogBoard
    ? (boardViews.find(
        (boardView) => boardView.id === dialogBoard.viewId
      ) ?? null)
    : null
  const dialogWorkItem = dialogResolvedWorkItem?.workItem ?? null
  const dialogSessionIsAvailable =
    dialogSession?.mode === "create"
      ? dialogBoard !== null
      : dialogWorkItem !== null
  const dialogBoardId = dialogBoard?.id ?? ""
  const dialogBoardWorkItems = useProjectStore(
    useShallow((state) =>
      dialogBoardId
        ? selectBoardWorkItems(state, projectId, dialogBoardId)
        : []
    )
  )
  const documents = useMemo<WorkItemDocumentOption[]>(
    () =>
      projectDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        href: getProjectViewHref(
          workspaceId,
          projectId,
          "documents",
          { resourceId: document.id }
        ),
      })),
    [projectDocuments, projectId, workspaceId]
  )

  function openCreateDialog(boardId: string, trigger: HTMLElement) {
    dialogTriggerRef.current = trigger
    deleteFallbackRef.current = null
    setActionError(null)
    setDialogSession({
      key: crypto.randomUUID(),
      mode: "create",
      boardId,
    })
  }

  function openViewDialog(workItemId: string, trigger: HTMLElement) {
    const workItem = workItems.find(
      (candidate) => candidate.id === workItemId
    )

    if (!workItem) {
      return
    }

    dialogTriggerRef.current = trigger
    deleteFallbackRef.current = null
    setDialogSession({
      key: crypto.randomUUID(),
      mode: "view",
      workItemId: workItem.id,
    })
  }

  function createTask(fields: EditableWorkItemFields) {
    if (!dialogBoard) {
      return false
    }

    return createWorkItem({
      id: "work-item-" + crypto.randomUUID(),
      projectId,
      boardId: dialogBoard.id,
      ...fields,
      position: dialogBoardWorkItems.length,
      milestoneId: null,
      customFields: {},
    })
  }

  function handleCreateAndLinkDocument(
    workItemId: string,
    title: string
  ) {
    return createAndLinkWorkItemDocument({
      id:
        "resource-" +
        projectId +
        "-document-" +
        crypto.randomUUID(),
      workItemId,
      title,
    })
  }

  function getDeleteFocusFallback(workItemId: string) {
    const triggers = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-work-item-open-trigger]"
      )
    )
    const currentTrigger = triggers.find(
      (trigger) =>
        trigger.dataset.workItemOpenTrigger === workItemId
    )
    const focusScope =
      currentTrigger?.closest<HTMLElement>("[data-kanban-board]") ??
      currentTrigger?.closest<HTMLElement>(
        "[data-project-work-view=calendar]"
      )

    if (!currentTrigger || !focusScope) {
      return null
    }

    const scopedTriggers = Array.from(
      focusScope.querySelectorAll<HTMLElement>(
        "[data-work-item-open-trigger]"
      )
    )
    const currentIndex = scopedTriggers.indexOf(currentTrigger)

    return (
      scopedTriggers[currentIndex + 1] ??
      scopedTriggers[currentIndex - 1] ??
      focusScope.querySelector<HTMLElement>(
        "[data-work-item-delete-fallback]"
      )
    )
  }

  function deleteTask(workItemId: string) {
    deleteFallbackRef.current =
      getDeleteFocusFallback(workItemId)
    const deleted = deleteWorkItem(workItemId)

    if (deleted) {
      setDialogSession(null)
    } else {
      deleteFallbackRef.current = null
    }

    return deleted
  }

  function moveWorkItemDate(workItemId: string, dueDate: string) {
    const workItem = workItems.find(
      (candidate) => candidate.id === workItemId
    )

    if (!workItem) {
      setActionError("The task is no longer available.")
      return
    }

    if (
      !updateWorkItemDateRange(
        workItemId,
        workItem.startDate,
        dueDate
      )
    ) {
      setActionError("The due date could not be changed.")
      return
    }

    setActionError(null)
  }

  function finalFocus() {
    if (dialogTriggerRef.current?.isConnected) {
      return dialogTriggerRef.current
    }

    if (dialogSession?.mode !== "view") {
      return null
    }

    const remountedTrigger = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-work-item-open-trigger]"
      )
    ).find(
      (trigger) =>
        trigger.dataset.workItemOpenTrigger ===
        dialogSession.workItemId
    )

    if (remountedTrigger) {
      return remountedTrigger
    }

    if (deleteFallbackRef.current?.isConnected) {
      return deleteFallbackRef.current
    }

    return searchInputRef.current
  }

  return (
    <div
      data-project-work-view={view.type}
      className="min-w-0 space-y-4 p-4 sm:p-6"
    >
      <WorkItemFiltersToolbar
        value={filters}
        labels={boardViews[0]?.labels ?? []}
        matchingCount={visibleWorkItemIds.size}
        totalCount={workItems.length}
        searchInputRef={searchInputRef}
        onChange={setFilters}
      />
      <p
        role="alert"
        aria-live="polite"
        className={actionError ? "text-sm text-destructive" : "sr-only"}
      >
        {actionError}
      </p>

      {view.type === "board" ? (
        <KanbanView
          workItems={workItems}
          visibleWorkItemIds={visibleWorkItemIds}
          board={view}
          boards={activeBoards}
          onOpenWorkItem={openViewDialog}
          onAddTask={openCreateDialog}
          onAddBoard={onAddBoard}
          onEditBoard={onEditBoard}
          onSetLabels={onSetLabels}
          onMoveWorkItem={(workItemId, targetBoardId, index) => {
            moveWorkItem(workItemId, targetBoardId, index)
          }}
        />
      ) : (
        <CalendarView
          workItems={workItems}
          visibleWorkItemIds={visibleWorkItemIds}
          labels={boardViews[0]?.labels ?? []}
          stagesByBoardId={stagesByBoardId}
          todayIsoDate={today}
          onOpenWorkItem={openViewDialog}
          onMoveWorkItemDate={moveWorkItemDate}
        />
      )}

      {dialogSession && dialogSessionIsAvailable && dialogBoard ? (
        <WorkItemDialog
          key={dialogSession.key}
          mode={dialogSession.mode}
          open
          projectId={projectId}
          boardTitle={dialogBoard.title}
          boardStage={dialogBoard.stage}
          boardLabels={dialogBoardView?.labels ?? []}
          projectWorkItems={workItems}
          stagesByBoardId={stagesByBoardId}
          documents={documents}
          workItem={
            dialogSession.mode === "view"
              ? dialogWorkItem
              : null
          }
          finalFocus={finalFocus}
          onOpenChange={(open) => {
            if (!open) {
              setDialogSession(null)
            }
          }}
          onCreate={createTask}
          onSave={saveWorkItem}
          onDelete={deleteTask}
          onLinkDocument={linkWorkItemDocument}
          onUnlinkDocument={unlinkWorkItemDocument}
          onCreateAndLinkDocument={handleCreateAndLinkDocument}
        />
      ) : null}
    </div>
  )
}
