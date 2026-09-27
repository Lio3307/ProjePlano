"use client"

import { ArrowUpRight, Check, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useId, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  formatWorkItemDate,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
} from "@/features/work-item/components/work-item-meta"
import { getProjectViewHref } from "../query-state"
import { selectTaskBoards, selectTodayWorkItems, selectUpcomingWorkItems, type DatedWorkItem } from "../selectors"
import { useProjectStore } from "../store-provider"
import { useLocalToday } from "../use-local-today"
import { ProjectWorkItemDialog } from "./project-work-item-dialog"

type AgendaMode = "today" | "upcoming"

export function TaskAgendaDashboard({ mode }: { mode: AgendaMode }) {
  const today = useLocalToday()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{mode === "today" ? "Today" : "Upcoming"}</h1>
        {today ? (
          <p className="text-sm text-muted-foreground">
            {mode === "today" ? (
              <time dateTime={today}>{formatWorkItemDate(today)}</time>
            ) : "Next 7 days"}
            <span aria-hidden="true"> · </span>
            All workspaces
          </p>
        ) : null}
      </header>
      {today ? (
        <AgendaTasks key={mode} mode={mode} today={today} />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">Loading tasks…</p>
      )}
    </div>
  )
}

function AgendaTasks({ today, mode }: { today: string; mode: AgendaMode }) {
  const items = useProjectStore(state => mode === "today"
    ? selectTodayWorkItems(state, today)
    : selectUpcomingWorkItems(state, today))
  const completion = useProjectStore(state => state.lastWorkItemCompletion)
  const completeWorkItem = useProjectStore(state => state.completeWorkItem)
  const undoCompleteWorkItem = useProjectStore(state => state.undoCompleteWorkItem)
  const [undoneTitle, setUndoneTitle] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [selectedTask, setSelectedTask] = useState<{
    key: string; projectId: string; workItemId: string
  } | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const sections = mode === "today" ? [
    { id: "overdue-tasks", title: "Overdue", items: items.filter(item => item.workItem.dueDate < today), emptyMessage: "No overdue tasks." },
    { id: "due-today-tasks", title: "Due today", items: items.filter(item => item.workItem.dueDate === today), emptyMessage: "No tasks due today." },
  ] : Array.from(new Set(items.map(item => item.workItem.dueDate)), date => ({
    id: "due-" + date,
    title: formatWorkItemDate(date),
    items: items.filter(item => item.workItem.dueDate === date),
    emptyMessage: "",
  }))

  function openTask(projectId: string, workItemId: string, trigger: HTMLElement) {
    triggerRef.current = trigger
    setSelectedTask({ key: crypto.randomUUID(), projectId, workItemId })
  }

  function completeTask(workItemId: string, targetBoardId: string) {
    if (!completeWorkItem(workItemId, targetBoardId)) {
      setActionError("Could not complete the task because the task or its Completed Board changed.")
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setUndoneTitle(null)
    setActionError(null)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  function undoCompletion() {
    if (!completion) return
    if (!undoCompleteWorkItem()) {
      setActionError("Could not undo completion because the task or its Boards changed. No data was changed.")
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setUndoneTitle(completion.title)
    setActionError(null)
    requestAnimationFrame(() => {
      const trigger = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-work-item-open-trigger]") ?? [])
        .find(element => element.dataset.workItemOpenTrigger === completion.workItemId)
      ;(trigger ?? statusRef.current)?.focus()
    })
  }

  function finalFocus() {
    if (triggerRef.current?.isConnected) return triggerRef.current
    const remountedTrigger = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>("[data-work-item-open-trigger]") ?? []
    ).find(trigger => trigger.dataset.workItemOpenTrigger === selectedTask?.workItemId)
    return remountedTrigger ?? listRef.current
  }

  return (
    <div ref={listRef} role="region" tabIndex={-1} aria-label={mode === "today" ? "Today's tasks" : "Upcoming tasks"} className="space-y-8">
      <div className={completion || undoneTitle ? "flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4" : "sr-only"}>
        <p ref={statusRef} role="status" aria-atomic="true" tabIndex={-1} className="min-w-0 flex-1 break-words text-sm">
          {completion ? "Task completed: " + completion.title : undoneTitle ? "Task reopened: " + undoneTitle : ""}
        </p>
        {completion ? <Button type="button" variant="outline" onClick={undoCompletion}>Undo completion</Button> : null}
      </div>
      <p ref={errorRef} role="alert" tabIndex={-1} className={actionError ? "text-sm text-destructive" : "sr-only"}>{actionError}</p>
      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No tasks due in the next 7 days.
        </p>
      ) : sections.map(section => (
        <DatedTaskSection key={section.id} {...section} onOpenTask={openTask} onCompleteTask={completeTask} />
      ))}
      {selectedTask ? (
        <ProjectWorkItemDialog
          key={selectedTask.key}
          projectId={selectedTask.projectId}
          session={{ key: selectedTask.key, mode: "view", workItemId: selectedTask.workItemId }}
          finalFocus={finalFocus}
          onOpenChange={open => { if (!open) setSelectedTask(null) }}
        />
      ) : null}
    </div>
  )
}

function DatedTaskSection({
  id,
  title,
  items,
  emptyMessage,
  onOpenTask,
  onCompleteTask,
}: {
  id: string
  title: string
  items: readonly DatedWorkItem[]
  emptyMessage: string
  onOpenTask: (projectId: string, workItemId: string, trigger: HTMLElement) => void
  onCompleteTask: (workItemId: string, targetBoardId: string) => void
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
        {title}
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {items.map(({ workItem, board, project, workspace }) => (
            <li key={workItem.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-sm font-medium">
                  <button
                    type="button"
                    className="min-h-11 max-w-full rounded-sm text-left break-words hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    data-work-item-open-trigger={workItem.id}
                    onClick={(event) => onOpenTask(project.id, workItem.id, event.currentTarget)}
                  >
                    {workItem.title}
                  </button>
                </h3>
                <p className="break-words text-xs text-muted-foreground">
                  {workspace.title} / {project.title} / {board.title}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <WorkItemStatusBadge status={board.stage} />
                  <WorkItemPriorityBadge priority={workItem.priority} />
                  <span className="text-xs text-muted-foreground">
                    Due <time dateTime={workItem.dueDate}>{formatWorkItemDate(workItem.dueDate)}</time>
                  </span>
                </div>
              </div>
              <CompleteTaskAction projectId={project.id} viewId={board.viewId} workItemId={workItem.id} title={workItem.title} onComplete={onCompleteTask} />
              <Button
                nativeButton={false}
                variant="outline"
                className="self-start sm:self-auto"
                render={
                  <Link
                    href={getProjectViewHref(workspace.id, project.id, "board", { workViewId: board.viewId })}
                    aria-label={"Open board for " + workItem.title}
                  />
                }
              >
                Open board
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CompleteTaskAction({ projectId, viewId, workItemId, title, onComplete }: {
  projectId: string
  viewId: string
  workItemId: string
  title: string
  onComplete: (workItemId: string, targetBoardId: string) => void
}) {
  const boards = useProjectStore(useShallow(state =>
    selectTaskBoards(state, projectId, viewId).filter(board => board.stage === "done")
  ))
  const unavailableId = useId()

  if (boards.length <= 1) {
    return (
      <div className="self-start space-y-1 sm:self-auto">
        <Button type="button" variant="outline" disabled={boards.length === 0}
          aria-label={"Complete " + title} aria-describedby={boards.length === 0 ? unavailableId : undefined}
          onClick={() => { if (boards[0]) onComplete(workItemId, boards[0].id) }}>
          <Check aria-hidden="true" />Complete
        </Button>
        {boards.length === 0 ? <p id={unavailableId} className="text-xs text-muted-foreground">No completed Board</p> : null}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="self-start sm:self-auto" render={<Button variant="outline" aria-label={"Complete " + title} />}>
        <Check aria-hidden="true" />Complete<ChevronDown aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" aria-label="Choose Completed Board">
        {boards.map(board => (
          <DropdownMenuItem key={board.id} className="min-h-11 break-words text-sm" onClick={() => onComplete(workItemId, board.id)}>
            {board.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
