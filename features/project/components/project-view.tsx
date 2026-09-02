import { CalendarView } from "@/features/calendar/components/calendar-view"
import { DocumentView } from "@/features/document/components/document-view"
import { KanbanView } from "@/features/kanban/components/kanban-view"
import { TableView } from "@/features/table/components/table-view"
import type { Workspace } from "@/features/workspace/types"

import type { Project } from "../types"

interface ProjectViewProps {
  workspace: Workspace
  project: Project
}

export function ProjectView({ workspace, project }: ProjectViewProps) {
  switch (project.type) {
    case "calendar":
      return (
        <div className="min-w-0 space-y-4 p-6">
          <h1 className="text-xl font-semibold">{project.title}</h1>
          <CalendarView />
        </div>
      )
    case "document":
      return <DocumentView workspace={workspace} project={project} />
    case "kanban":
      return (
        <div className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">{project.title}</h1>
          <KanbanView />
        </div>
      )
    case "table":
      return (
        <div className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">{project.title}</h1>
          <TableView />
        </div>
      )
  }
}
