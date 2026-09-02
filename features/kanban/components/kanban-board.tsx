import type { KanbanColumn as KanbanColumnRecord } from "../model"
import { KanbanColumn } from "./kanban-column"

interface KanbanBoardProps {
  columns: KanbanColumnRecord[]
  onOpenCard: (cardId: string, trigger: HTMLButtonElement) => void
}

export function KanbanBoard({
  columns,
  onOpenCard,
}: KanbanBoardProps) {
  return (
    <div
      className="min-w-0 overflow-x-auto overscroll-x-contain pb-4"
      aria-label="Kanban board"
    >
      <div className="flex min-w-max items-start gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onOpenCard={onOpenCard}
          />
        ))}
      </div>
    </div>
  )
}
