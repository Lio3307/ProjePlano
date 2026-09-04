import type { WorkItem } from "../work-item/model"
import type { WorkspaceMember } from "../member/model"
import type { BoardLabel } from "./board"
import type { TaskBoard } from "./task-board"

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

type ProjectViewBase = {
  id: string
  projectId: string
  title: string
  visibleFieldIds: string[]
  groupBy: string | null
  filterIds: string[]
}

export type ProjectBoardView = ProjectViewBase & {
  type: "board"
  boardIds: string[]
  labels: BoardLabel[]
}

export type ProjectTableView = ProjectViewBase & { type: "table" }
export type ProjectCalendarView = ProjectViewBase & { type: "calendar" }
export type ProjectTimelineView = ProjectViewBase & { type: "timeline" }

export type ProjectViewConfig =
  | ProjectBoardView
  | ProjectTableView
  | ProjectCalendarView
  | ProjectTimelineView

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
  memberIdsByWorkspaceId: Record<string, string[]>
  membersById: Record<string, WorkspaceMember>
  projectIdsByWorkspaceId: Record<string, string[]>
  projectsById: Record<string, ProjectRecord>
  projectViewsById: Record<string, ProjectViewConfig>
  taskBoardsById: Record<string, TaskBoard>
  workItemsById: Record<string, WorkItem>
  resourcesById: Record<string, ProjectResource>
  milestonesById: Record<string, Milestone>
}
