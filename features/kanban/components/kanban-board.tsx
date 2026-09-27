import { Plus, Tags } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ProjectBoardView } from "@/features/project/model"
import { WorkItemLabelList } from "@/features/work-item/components/work-item-meta"
import type { KanbanBoardRecord } from "../model"
import { KanbanColumn } from "./kanban-column"

interface KanbanBoardProps {
  columns: KanbanBoardRecord[]
  board: ProjectBoardView
  blockingCountsByWorkItemId: Readonly<Record<string, number>>
  onOpenWorkItem: (
    workItemId: string,
    trigger: HTMLElement
  ) => void
  onAddTask: (boardId: string, trigger: HTMLElement) => void
  onAddBoard: (trigger: HTMLElement) => void
  onEditBoard: (boardId: string, trigger: HTMLElement) => void
  onSetLabels: (trigger: HTMLElement) => void
}

export function KanbanBoard({
  columns,
  board,
  blockingCountsByWorkItemId,
  onOpenWorkItem,
  onAddTask,
  onAddBoard,
  onEditBoard,
  onSetLabels,
}: KanbanBoardProps) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg font-semibold wrap-anywhere">
            {board.title}
          </h2>
          <WorkItemLabelList labels={board.labels} />
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            onClick={(event) => onSetLabels(event.currentTarget)}
          >
            <Tags aria-hidden="true" />
            Set labels
          </Button>
          <Button
            type="button"
            data-add-board-trigger
            onClick={(event) => onAddBoard(event.currentTarget)}
          >
            <Plus aria-hidden="true" />
            Add board
          </Button>
        </div>
      </header>

      {columns.length > 0 ? (
        <div
          className="w-full min-w-0 max-w-full snap-x snap-proximity overflow-x-auto overscroll-x-contain pb-4 sm:snap-none relative"
          aria-label="Kanban Boards"
        >
          <div className="flex min-w-max items-start gap-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.board.id}
                column={column}
                labels={board.labels}
                blockingCountsByWorkItemId={blockingCountsByWorkItemId}
                onOpenWorkItem={onOpenWorkItem}
                onAddTask={onAddTask}
                onEditBoard={onEditBoard}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center">
          <h3 className="text-sm font-medium">No Boards yet</h3>
          <Button
            type="button"
            className="mt-4"
            onClick={(event) => onAddBoard(event.currentTarget)}
          >
            <Plus aria-hidden="true" />
            Add board
          </Button>
        </div>
      )}
    </div>
  )
}
