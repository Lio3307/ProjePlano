export type ProjectType = "table" | "document" | "kanban" | "calendar"

export type Project = {
  id: string
  workspaceId: string
  title: string
  type: ProjectType
  author: string
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  table: "Table",
  document: "Document",
  kanban: "Kanban",
  calendar: "Calendar",
}
