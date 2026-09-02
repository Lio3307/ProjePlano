"use client"

import { useDraggable, useDroppable } from "@dnd-kit/react"
import { CalendarDays, CheckSquare, GripVertical } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { KanbanCard as KanbanCardRecord } from "../model"
import {
  formatKanbanDate,
  getChecklistProgress,
  KanbanLabelList,
  KanbanPriorityBadge,
} from "./kanban-card-meta"

interface KanbanCardProps {
  card: KanbanCardRecord
  onOpen: (cardId: string, trigger: HTMLButtonElement) => void
}

export function KanbanCard({ card, onOpen }: KanbanCardProps) {
  const {
    ref: dragRef,
    handleRef,
    isDragging,
  } = useDraggable({
    id: card.id,
    type: "kanban-card",
  })
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: card.id,
    collisionPriority: 1,
  })
  const progress = getChecklistProgress(card.checklist)

  return (
    <div
      ref={dropRef}
      className={cn(
        "rounded-lg transition-colors motion-reduce:transition-none",
        isDropTarget && "bg-primary/10 ring-2 ring-primary/40"
      )}
    >
      <Card
        ref={dragRef}
        size="sm"
        className={cn(
          "gap-0 py-0 shadow-sm transition-opacity motion-reduce:transition-none",
          isDragging && "opacity-45"
        )}
      >
        <div className="flex items-start">
          <button
            type="button"
            className="min-w-0 flex-1 space-y-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            aria-label={"Open details for " + card.title}
            onClick={(event) => onOpen(card.id, event.currentTarget)}
          >
            <KanbanLabelList labels={card.labels} />
            <div className="space-y-1">
              <h3 className="text-sm leading-5 font-medium">{card.title}</h3>
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {card.description}
              </p>
            </div>
            <KanbanPriorityBadge priority={card.priority} />
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatKanbanDate(card.dueDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckSquare className="size-3.5" aria-hidden="true" />
                {progress.completed}/{progress.total}
              </span>
              <span
                className="ml-auto inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
                title={card.assignee.name}
              >
                {card.assignee.initials}
              </span>
            </div>
          </button>
          <button
            ref={handleRef}
            type="button"
            className="m-2 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={"Drag " + card.title}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  )
}
