"use client"

import { useDroppable } from "@dnd-kit/react"

import { cn } from "@/lib/utils"
import {
  getKanbanColumnDropId,
  type KanbanColumnRecord,
} from "../model"
import { KanbanCard } from "./kanban-card"

interface KanbanColumnProps {
  column: KanbanColumnRecord
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
}

export function KanbanColumn({
  column,
  onOpenWorkItem,
}: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id: getKanbanColumnDropId(column.status),
    collisionPriority: -1,
  })

  return (
    <section
      data-kanban-status={column.status}
      className="flex max-h-[calc(100dvh-10rem)] w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-muted/55 ring-1 ring-foreground/10"
    >
      <header className="flex items-center justify-between px-3 py-3">
        <h2 className="text-sm font-semibold">{column.title}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/10">
          {column.workItems.length}
          <span className="sr-only"> tasks</span>
        </span>
      </header>

      <div
        ref={ref}
        className={cn(
          "min-h-28 space-y-2 overflow-y-auto p-2 pt-0 transition-colors motion-reduce:transition-none",
          isDropTarget && "bg-primary/10"
        )}
      >
        {column.workItems.length > 0 ? (
          column.workItems.map((workItem) => (
            <KanbanCard
              key={workItem.id}
              workItem={workItem}
              onOpen={onOpenWorkItem}
            />
          ))
        ) : (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-background/50 px-4 text-center text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  )
}
