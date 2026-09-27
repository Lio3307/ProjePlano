"use client"

import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  formatWorkItemDate,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
} from "@/features/work-item/components/work-item-meta"
import { getProjectViewHref } from "../query-state"
import { selectTodayWorkItems, type TodayWorkItem } from "../selectors"
import { useProjectStore } from "../store-provider"
import { useLocalToday } from "../use-local-today"

export function TodayDashboard() {
  const today = useLocalToday()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        {today ? (
          <p className="text-sm text-muted-foreground">
            <time dateTime={today}>{formatWorkItemDate(today)}</time>
            <span aria-hidden="true"> · </span>
            All workspaces
          </p>
        ) : null}
      </header>
      {today ? (
        <TodayTasks today={today} />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">Loading tasks…</p>
      )}
    </div>
  )
}

function TodayTasks({ today }: { today: string }) {
  const items = useProjectStore(state => selectTodayWorkItems(state, today))
  const overdue = items.filter(item => item.workItem.dueDate < today)
  const dueToday = items.filter(item => item.workItem.dueDate === today)

  return (
    <div className="space-y-8">
      <TodayTaskSection
        id="overdue-tasks"
        title="Overdue"
        items={overdue}
        emptyMessage="No overdue tasks."
      />
      <TodayTaskSection
        id="due-today-tasks"
        title="Due today"
        items={dueToday}
        emptyMessage="No tasks due today."
      />
    </div>
  )
}

function TodayTaskSection({
  id,
  title,
  items,
  emptyMessage,
}: {
  id: string
  title: string
  items: readonly TodayWorkItem[]
  emptyMessage: string
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
                <h3 className="break-words text-sm font-medium">{workItem.title}</h3>
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
