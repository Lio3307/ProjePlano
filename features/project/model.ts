import type { WorkItem } from "../work-item/model"

export type ProjectStatus = "planned" | "active" | "paused" | "completed"

export type ProjectRecord = {
  id: string
  workspaceId: string
  title: string
  description: string
  templateId: string | null
  status: ProjectStatus
  viewIds: string[]
  resourceIds: string[]
  milestoneIds: string[]
}

export type ProjectViewType = "board" | "table" | "calendar" | "timeline"

export type ProjectViewConfig = {
  id: string
  projectId: string
  title: string
  type: ProjectViewType
  visibleFieldIds: string[]
  groupBy: string | null
  filterIds: string[]
}

type ProjectResourceBase = {
  id: string
  projectId: string
  title: string
  templateId: string | null
  isPinned: boolean
}

export type ProjectDocumentResource = ProjectResourceBase & {
  type: "document"
  content: string
}

export type ProjectCanvasResource = ProjectResourceBase & {
  type: "canvas"
}

export type ProjectResource =
  | ProjectDocumentResource
  | ProjectCanvasResource

export type Milestone = {
  id: string
  projectId: string
  title: string
  description: string
  targetDate: string | null
  status: "planned" | "in-progress" | "completed"
}

export type ProjectWorkspaceState = {
  projectIdsByWorkspaceId: Record<string, string[]>
  projectsById: Record<string, ProjectRecord>
  projectViewsById: Record<string, ProjectViewConfig>
  workItemsById: Record<string, WorkItem>
  resourcesById: Record<string, ProjectResource>
  milestonesById: Record<string, Milestone>
}
