"use client"

import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  formatWorkItemDate,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
} from "@/features/work-item/components/work-item-meta"
import { getProjectViewHref } from "../query-state"
import { selectTodayWorkItems, selectUpcomingWorkItems, type DatedWorkItem } from "../selectors"
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

  function finalFocus() {
    if (triggerRef.current?.isConnected) return triggerRef.current
    const remountedTrigger = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>("[data-work-item-open-trigger]") ?? []
    ).find(trigger => trigger.dataset.workItemOpenTrigger === selectedTask?.workItemId)
    return remountedTrigger ?? listRef.current
  }

  return (
    <div ref={listRef} role="region" tabIndex={-1} aria-label={mode === "today" ? "Today's tasks" : "Upcoming tasks"} className="space-y-8">
      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No tasks due in the next 7 days.
        </p>
      ) : sections.map(section => (
        <DatedTaskSection key={section.id} {...section} onOpenTask={openTask} />
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
}: {
  id: string
  title: string
  items: readonly DatedWorkItem[]
  emptyMessage: string
  onOpenTask: (projectId: string, workItemId: string, trigger: HTMLElement) => void
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
