"use client"

import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import { Button } from "@/components/ui/button"
import { CalendarView } from "@/features/calendar/components/calendar-view"
import { KanbanView } from "@/features/kanban/components/kanban-view"
import { TableView } from "@/features/table/components/table-view"
import { WorkItemDialog } from "@/features/work-item/components/work-item-dialog"
import type {
  EditableWorkItemFields,
  WorkItem,
} from "@/features/work-item/model"
import { selectProjectWorkItems } from "../selectors"
import { useProjectStore } from "../store-provider"
import type { SupportedProjectViewType } from "../view-definitions"

type DialogSession =
  | { key: string; mode: "create" }
  | { key: string; mode: "edit"; workItem: WorkItem }

interface ProjectWorkViewProps {
  projectId: string
  viewType: SupportedProjectViewType
  today: string
}

type SharedWorkItemViewProps = Omit<ProjectWorkViewProps, "viewType"> & {
  viewType: Exclude<SupportedProjectViewType, "table">
}

export function ProjectWorkView({
  projectId,
  viewType,
  today,
}: ProjectWorkViewProps) {
  if (viewType === "table") {
    return (
      <div
        data-project-work-view="table"
        className="min-w-0 p-4 sm:p-6"
      >
        <TableView />
      </div>
    )
  }

  return (
    <SharedWorkItemView
      projectId={projectId}
      viewType={viewType}
      today={today}
    />
  )
}

function SharedWorkItemView({
  projectId,
  viewType,
  today,
}: SharedWorkItemViewProps) {
  const workItems = useProjectStore(
    useShallow((state) => selectProjectWorkItems(state, projectId))
  )
  const {
    createWorkItem,
    saveWorkItem,
    moveWorkItem,
    updateWorkItemDateRange,
    deleteWorkItem,
  } = useProjectStore(
    useShallow((state) => ({
      createWorkItem: state.createWorkItem,
      saveWorkItem: state.saveWorkItem,
      moveWorkItem: state.moveWorkItem,
      updateWorkItemDateRange: state.updateWorkItemDateRange,
      deleteWorkItem: state.deleteWorkItem,
    }))
  )
  const [dialogSession, setDialogSession] =
    useState<DialogSession | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const newTaskRef = useRef<HTMLButtonElement | null>(null)
  const dialogTriggerRef = useRef<HTMLElement | null>(null)

  function openCreateDialog() {
    dialogTriggerRef.current = newTaskRef.current
    setDialogSession({ key: crypto.randomUUID(), mode: "create" })
  }

  function openEditDialog(workItemId: string, trigger: HTMLElement) {
    const workItem = workItems.find(
      (candidate) => candidate.id === workItemId
    )

    if (!workItem) {
      return
    }

    dialogTriggerRef.current = trigger
    setDialogSession({
      key: crypto.randomUUID(),
      mode: "edit",
      workItem,
    })
  }

  function createTask(fields: EditableWorkItemFields) {
    const position = workItems.filter(
      (workItem) => workItem.status === fields.status
    ).length

    return createWorkItem({
      id: "work-item-" + crypto.randomUUID(),
      projectId,
      ...fields,
      startDate: null,
      position,
      milestoneId: null,
      dependencyIds: [],
      linkedResourceIds: [],
      customFields: {},
    })
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

  const finalFocus = () =>
    dialogTriggerRef.current?.isConnected
      ? dialogTriggerRef.current
      : newTaskRef.current

  return (
    <div
      data-project-work-view={viewType}
      className="min-w-0 space-y-4 p-4 sm:p-6"
    >
      <div className="flex justify-end">
        <Button
          ref={newTaskRef}
          type="button"
          data-new-work-item-trigger
          onClick={openCreateDialog}
        >
          <Plus aria-hidden="true" />
          New task
        </Button>
      </div>

      <p
        role="alert"
        aria-live="polite"
        className="min-h-5 text-sm text-destructive"
      >
        {actionError}
      </p>

      {viewType === "board" ? (
        <KanbanView
          workItems={workItems}
          onOpenWorkItem={openEditDialog}
          onMoveWorkItem={(workItemId, status, index) => {
            moveWorkItem(workItemId, status, index)
          }}
        />
      ) : (
        <CalendarView
          workItems={workItems}
          todayIsoDate={today}
          onOpenWorkItem={openEditDialog}
          onMoveWorkItemDate={moveWorkItemDate}
        />
      )}

      {dialogSession ? (
        <WorkItemDialog
          key={dialogSession.key}
          mode={dialogSession.mode}
          open
          workItem={
            dialogSession.mode === "edit"
              ? dialogSession.workItem
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
          onDelete={deleteWorkItem}
        />
      ) : null}
    </div>
  )
}
