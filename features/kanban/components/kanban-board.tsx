import type { WorkspaceMember } from "@/features/member/model"
import type { KanbanColumnRecord } from "../model"
import { KanbanColumn } from "./kanban-column"

interface KanbanBoardProps {
  columns: KanbanColumnRecord[]
  membersById: Readonly<Record<string, WorkspaceMember>>
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
}

export function KanbanBoard({
  columns,
  membersById,
  blockingCountsByWorkItemId,
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
            membersById={membersById}
            blockingCountsByWorkItemId={blockingCountsByWorkItemId}
            onOpenWorkItem={onOpenWorkItem}
          />
        ))}
      </div>
    </div>
  )
}
