import { CalendarView } from "@/features/calendar/components/calendar-view"
import { DocumentView } from "@/features/document/components/document-view"
import { KanbanView } from "@/features/kanban/components/kanban-view"
import { TableView } from "@/features/table/components/table-view"

import type { ProjectSelection } from "../query-state"

type RendererSelection = Extract<
  ProjectSelection,
  { kind: "work" | "document" }
>

type WorkRendererSelection = Extract<
  ProjectSelection,
  { kind: "work" }
>

interface ProjectViewProps {
  selection: RendererSelection
}

export function ProjectView({ selection }: ProjectViewProps) {
  if (selection.kind === "document") {
    return (
      <DocumentView
        resourceTitle={selection.resource.title}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-4 p-4 sm:p-6">
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Demo view data. Shared project work items arrive in the next migration
        phases.
      </p>
      {renderWorkView(selection.view.type)}
    </div>
  )
}

function renderWorkView(
  type: WorkRendererSelection["view"]["type"]
) {
  switch (type) {
    case "board":
      return <KanbanView />
    case "table":
      return <TableView />
    case "calendar":
      return <CalendarView />
    default:
      return assertNever(type)
  }
}

function assertNever(value: never): never {
  throw new Error("Unsupported Phase 2 project view: " + value)
}
