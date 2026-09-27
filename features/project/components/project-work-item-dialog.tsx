"use client"

import { useMemo, type ComponentProps } from "react"
import { useShallow } from "zustand/react/shallow"

import { WorkItemDialog } from "@/features/work-item/components/work-item-dialog"
import type { WorkItemDocumentOption } from "@/features/work-item/components/work-item-documents-field"
import type { EditableWorkItemFields } from "@/features/work-item/model"
import {
  selectBoardWorkItems,
  selectProjectBoardView,
  selectProjectById,
  selectProjectDocumentResources,
  selectProjectResolvedWorkItems,
  selectTaskBoard,
} from "../selectors"
import { getProjectViewHref } from "../query-state"
import { useProjectStore } from "../store-provider"

export type DialogSession =
  | { key: string; mode: "create"; boardId: string }
  | { key: string; mode: "view"; workItemId: string }

type ProjectWorkItemDialogProps = {
  projectId: string
  session: DialogSession
  finalFocus: ComponentProps<typeof WorkItemDialog>["finalFocus"]
  onOpenChange: (open: boolean) => void
  onDelete?: (workItemId: string) => boolean
  initialDueDate?: string
  onCreated?: (title: string) => void
}

export function ProjectWorkItemDialog({
  projectId,
  session: dialogSession,
  finalFocus,
  onOpenChange,
  onDelete,
  initialDueDate,
  onCreated,
}: ProjectWorkItemDialogProps) {
  const project = useProjectStore(state => selectProjectById(state, projectId))
  const resolvedWorkItems = useProjectStore(state => selectProjectResolvedWorkItems(state, projectId))
  const dialogWorkItem = dialogSession.mode === "view"
    ? resolvedWorkItems.find(({ workItem }) => workItem.id === dialogSession.workItemId)?.workItem ?? null
    : null
  const boardId = dialogSession.mode === "create" ? dialogSession.boardId : dialogWorkItem?.boardId ?? ""
  const dialogBoard = useProjectStore(state => selectTaskBoard(state, projectId, boardId))
  const dialogBoardView = useProjectStore(state =>
    dialogBoard ? selectProjectBoardView(state, projectId, dialogBoard.viewId) : null
  )
  const dialogBoardWorkItems = useProjectStore(useShallow(state => selectBoardWorkItems(state, projectId, boardId)))
  const projectDocuments = useProjectStore(useShallow(state => selectProjectDocumentResources(state, projectId)))
  const {
    createWorkItem, saveWorkItem, deleteWorkItem, linkWorkItemDocument,
    unlinkWorkItemDocument, createAndLinkWorkItemDocument,
  } = useProjectStore(useShallow(state => ({
    createWorkItem: state.createWorkItem,
    saveWorkItem: state.saveWorkItem,
    deleteWorkItem: state.deleteWorkItem,
    linkWorkItemDocument: state.linkWorkItemDocument,
    unlinkWorkItemDocument: state.unlinkWorkItemDocument,
    createAndLinkWorkItemDocument: state.createAndLinkWorkItemDocument,
  })))
  const workItems = useMemo(() => resolvedWorkItems.map(({ workItem }) => workItem), [resolvedWorkItems])
  const stagesByBoardId = useMemo(() =>
    Object.fromEntries(resolvedWorkItems.map(({ board }) => [board.id, board.stage])),
    [resolvedWorkItems]
  )
  const workspaceId = project?.workspaceId ?? ""
  const documents = useMemo<WorkItemDocumentOption[]>(() => projectDocuments.map(document => ({
    id: document.id,
    title: document.title,
    href: getProjectViewHref(workspaceId, projectId, "documents", { resourceId: document.id }),
  })), [projectDocuments, projectId, workspaceId])
  const dialogSessionIsAvailable = dialogSession.mode === "create" || dialogWorkItem !== null

  function createTask(fields: EditableWorkItemFields) {
    if (!dialogBoard) return false
    const created = createWorkItem({
      id: "work-item-" + crypto.randomUUID(),
      projectId,
      boardId: dialogBoard.id,
      ...fields,
      position: dialogBoardWorkItems.length,
      milestoneId: null,
      customFields: {},
    })
    if (created) onCreated?.(fields.title)
    return created
  }

  function handleCreateAndLinkDocument(workItemId: string, title: string) {
    return createAndLinkWorkItemDocument({
      id: "resource-" + projectId + "-document-" + crypto.randomUUID(),
      workItemId,
      title,
    })
  }

  if (!project || !dialogSessionIsAvailable || !dialogBoard || !dialogBoardView) return null

  return (
    <WorkItemDialog
      key={dialogSession.key}
      mode={dialogSession.mode}
      open
      projectId={projectId}
      boardTitle={dialogBoard.title}
      boardStage={dialogBoard.stage}
      boardLabels={dialogBoardView.labels}
      projectWorkItems={workItems}
      stagesByBoardId={stagesByBoardId}
      documents={documents}
      workItem={dialogWorkItem}
      initialDueDate={initialDueDate}
      finalFocus={finalFocus}
      onOpenChange={onOpenChange}
      onCreate={createTask}
      onSave={saveWorkItem}
      onDelete={onDelete ?? deleteWorkItem}
      onLinkDocument={linkWorkItemDocument}
      onUnlinkDocument={unlinkWorkItemDocument}
      onCreateAndLinkDocument={handleCreateAndLinkDocument}
    />
  )
}
