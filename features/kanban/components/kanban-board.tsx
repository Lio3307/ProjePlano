import type { KanbanColumnRecord } from "../model"
import { KanbanColumn } from "./kanban-column"

interface KanbanBoardProps {
  columns: KanbanColumnRecord[]
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
}

export function KanbanBoard({
  columns,
  onOpenWorkItem,
}: KanbanBoardProps) {
  return (
    <div
      className="min-w-0 overflow-x-auto overscroll-x-contain pb-4"
      aria-label="Kanban board"
    >
      <div className="flex min-w-max items-start gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            onOpenWorkItem={onOpenWorkItem}
          />
        ))}
      </div>
    </div>
  )
}
