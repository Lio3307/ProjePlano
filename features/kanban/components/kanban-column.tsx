"use client"

import { useDroppable } from "@dnd-kit/react"
import { Plus, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { BoardLabel } from "@/features/project/board"
import { WorkItemStatusBadge } from "@/features/work-item/components/work-item-meta"
import { cn } from "@/lib/utils"
import {
  getKanbanBoardDropId,
  type KanbanBoardRecord,
} from "../model"
import { KanbanCard } from "./kanban-card"

interface KanbanColumnProps {
  column: KanbanBoardRecord
  labels: readonly BoardLabel[]
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
  onAddTask: (boardId: string, trigger: HTMLElement) => void
  onEditBoard: (boardId: string, trigger: HTMLElement) => void
}

export function KanbanColumn({
  column,
  labels,
  blockingCountsByWorkItemId,
  onOpenWorkItem,
  onAddTask,
  onEditBoard,
}: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id: getKanbanBoardDropId(column.board.id),
    collisionPriority: -1,
  })

  return (
    <section
      data-kanban-board={column.board.id}
      className="flex w-[min(20rem,calc(100vw-2rem))] shrink-0 snap-start flex-col rounded-xl bg-muted/55 ring-1 ring-foreground/10 sm:w-80"
    >
      <header className="space-y-2 px-3 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
              {column.board.title}
            </h2>
            {column.board.description ? (
              <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                {column.board.description}
              </p>
            ) : null}
          </div>
          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/10">
            {column.workItems.length}
            <span className="sr-only"> tasks</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <WorkItemStatusBadge status={column.board.stage} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={(event) =>
              onEditBoard(column.board.id, event.currentTarget)
            }
          >
            <Settings2 aria-hidden="true" />
            Board settings
          </Button>
        </div>
      </header>

      <div
        ref={ref}
        className={cn(
          "min-h-28 space-y-2 p-2 pt-0 transition-colors motion-reduce:transition-none",
          isDropTarget && "bg-primary/10"
        )}
      >
        {column.workItems.length > 0 ? (
          column.workItems.map((workItem) => (
            <KanbanCard
              key={workItem.id}
              workItem={workItem}
              labels={labels}
              blockingCount={blockingCountsByWorkItemId[workItem.id] ?? 0}
              onOpen={onOpenWorkItem}
            />
          ))
        ) : (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-background/50 px-4 text-center text-xs text-muted-foreground">
            No tasks yet
          </div>
        )}
      </div>

      <div className="p-2 pt-0">
        <Button
          type="button"
          data-work-item-delete-fallback
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={(event) =>
            onAddTask(column.board.id, event.currentTarget)
          }
        >
          <Plus aria-hidden="true" />
          Add task
        </Button>
      </div>
    </section>
  )
}
