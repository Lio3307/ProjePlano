import {
  arrayOf, isBoolean, isId, isNumber, isPosition, isString,
  nullable, objectOf, oneOf, recordOf, uniqueIds,
} from "../../lib/json-validation.ts"
import { isPortableAttachment, isTableMap } from "../table/snapshot.ts"
import {
  isValidWorkItem, isValidWorkItemDate,
  WORK_ITEM_PRIORITIES, WORK_ITEM_STATUSES, WORK_ITEM_TYPES,
  type ChecklistItem, type FieldValue, type WorkItem,
} from "../work-item/model.ts"
import { BOARD_LABEL_COLORS, type BoardLabel } from "./board.ts"
import type {
  Milestone, ProjectBoardView, ProjectCalendarView, ProjectCanvasResource,
  ProjectDocumentResource, ProjectRecord, ProjectResource, ProjectTableView,
  ProjectTimelineView, ProjectViewConfig, ProjectWorkspaceState,
} from "./model"
import type { TaskBoard } from "./task-board"
import type { Workspace } from "../workspace/types"

const isDate = (value: unknown): value is string =>
  isString(value) && isValidWorkItemDate(value)
const isTitle = (value: unknown): value is string =>
  isString(value) && value.trim().length > 0
const isLabel = objectOf<BoardLabel>({
  id: isId, name: isTitle, color: oneOf(...BOARD_LABEL_COLORS),
})
const projectShape = {
  id: isId, workspaceId: isId, title: isTitle, description: isString,
  templateId: nullable(isString), status: oneOf("planned", "active", "paused", "completed"),
  viewIds: uniqueIds, resourceIds: uniqueIds, milestoneIds: uniqueIds,
}
const isProject = objectOf<ProjectRecord>({ ...projectShape, archived: isBoolean })
const isLegacyProject = objectOf<Omit<ProjectRecord, "archived">>(projectShape)
const isWorkspace = objectOf<Workspace>({
  id: isId, title: isTitle, description: isString, createdAt: isDate,
})
const viewBase = {
  id: isId, projectId: isId, title: isTitle, visibleFieldIds: uniqueIds,
  groupBy: nullable(isString), filterIds: uniqueIds,
}
const isBoardView = objectOf<ProjectBoardView>({
  ...viewBase, type: oneOf("board"), boardIds: uniqueIds, labels: arrayOf(isLabel),
})
const isTableView = objectOf<ProjectTableView>({ ...viewBase, type: oneOf("table") })
const isCalendarView = objectOf<ProjectCalendarView>({ ...viewBase, type: oneOf("calendar") })
const isTimelineView = objectOf<ProjectTimelineView>({ ...viewBase, type: oneOf("timeline") })
const isView = (value: unknown): value is ProjectViewConfig =>
  isBoardView(value) || isTableView(value) || isCalendarView(value) || isTimelineView(value)
const isBoard = objectOf<TaskBoard>({
  id: isId, projectId: isId, viewId: isId, title: isTitle,
  description: isString, stage: oneOf(...WORK_ITEM_STATUSES), position: isPosition,
})
const resourceBase = {
  id: isId, projectId: isId, title: isTitle,
  templateId: nullable(isString), isPinned: isBoolean,
}
const isDocument = objectOf<ProjectDocumentResource>({
  ...resourceBase, type: oneOf("document"), content: isString,
})
const isCanvas = objectOf<ProjectCanvasResource>({ ...resourceBase, type: oneOf("canvas") })
const isResource = (value: unknown): value is ProjectResource =>
  isDocument(value) || isCanvas(value)
const isMilestone = objectOf<Milestone>({
  id: isId, projectId: isId, title: isTitle, description: isString,
  targetDate: nullable(isDate), status: oneOf("planned", "in-progress", "completed"),
})
const isChecklistItem = objectOf<ChecklistItem>({
  id: isId, label: isTitle, completed: isBoolean,
})
const isFieldValue = (value: unknown): value is FieldValue =>
  value === null || isString(value) || isNumber(value) || isBoolean(value) ||
  arrayOf(isString)(value) || arrayOf(isPortableAttachment)(value)
const taskShape = {
  id: isId, projectId: isId, boardId: isId, title: isTitle, description: isString,
  type: oneOf(...WORK_ITEM_TYPES), priority: oneOf(...WORK_ITEM_PRIORITIES),
  startDate: nullable(isDate), dueDate: nullable(isDate), estimate: nullable(isPosition),
  position: isPosition, labelIds: uniqueIds, checklist: arrayOf(isChecklistItem),
  milestoneId: nullable(isId), dependencyIds: uniqueIds, linkedResourceIds: uniqueIds,
  customFields: recordOf(isFieldValue),
}
const isTaskShape = objectOf<Omit<WorkItem, "archived">>(taskShape)
const isArchivedTaskShape = objectOf<Required<WorkItem>>({ ...taskShape, archived: isBoolean })
const isTask = (value: unknown): value is WorkItem =>
  (isTaskShape(value) || isArchivedTaskShape(value)) && isValidWorkItem(value)

const snapshotShape = {
  projectIdsByWorkspaceId: recordOf(uniqueIds),
  projectViewsById: recordOf(isView), taskBoardsById: recordOf(isBoard),
  workItemsById: recordOf(isTask), resourcesById: recordOf(isResource),
  milestonesById: recordOf(isMilestone), tablesByViewId: isTableMap,
}

export const isProjectSnapshot = objectOf<ProjectWorkspaceState>({
  ...snapshotShape, workspaceIds: uniqueIds, workspacesById: recordOf(isWorkspace),
  projectsById: recordOf(isProject),
})

type LegacyProjectSnapshot = Omit<ProjectWorkspaceState, "workspaceIds" | "workspacesById" | "projectsById"> & {
  projectsById: Record<string, Omit<ProjectRecord, "archived">>
}

export const isLegacyProjectSnapshot = objectOf<LegacyProjectSnapshot>({
  ...snapshotShape, projectsById: recordOf(isLegacyProject),
})
