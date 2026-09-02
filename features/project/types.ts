export type ProjectType = "table" | "document" | "kanban" | "calendar"

export type Project = {
  id: string
  workspaceId: string
  title: string
  type: ProjectType
  author: string
}
