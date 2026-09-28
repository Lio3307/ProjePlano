import {
  arrayOf, isBoolean, isId, isNumber, isPosition, isString, isRecord,
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
import { isPlanningData } from "./planning.ts"

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

const isBaseProjectSnapshot = objectOf<Omit<ProjectWorkspaceState, "planning">>({
  ...snapshotShape, workspaceIds: uniqueIds, workspacesById: recordOf(isWorkspace),
  projectsById: recordOf(isProject),
})

export function isProjectSnapshot(value: unknown): value is ProjectWorkspaceState {
  if (!isRecord(value)) return false
  if (!Object.hasOwn(value, "planning")) return isBaseProjectSnapshot(value)
  const { planning, ...base } = value
  return isBaseProjectSnapshot(base) && isPlanningData(planning)
}

export function hasValidPlanningRelationships(state: ProjectWorkspaceState) {
  const data = state.planning
  if (!data) return true
  if (!isPlanningData(data)) return false
  for (const [id, plan] of Object.entries(data.tasks)) {
    const task = state.workItemsById[id]
    if (!Object.hasOwn(state.workItemsById, id) || !task || (plan.recurrence &&
      (!Object.hasOwn(state.taskBoardsById, plan.recurrence.boardId) || state.taskBoardsById[plan.recurrence.boardId]?.projectId !== task.projectId))) return false
  }
  return Object.entries(data.entries).every(([id, entry]) => id === entry.id && Object.hasOwn(state.workItemsById, entry.taskId)) &&
    Object.entries(data.templates).every(([id, template]) => id === template.id) &&
    Object.entries(data.views).every(([id, view]) => id === view.id && (!view.projectId || Object.hasOwn(state.projectsById, view.projectId)))
}

type LegacyProjectSnapshot = Omit<ProjectWorkspaceState, "workspaceIds" | "workspacesById" | "projectsById" | "planning"> & {
  projectsById: Record<string, Omit<ProjectRecord, "archived">>
}

export const isLegacyProjectSnapshot = objectOf<LegacyProjectSnapshot>({
  ...snapshotShape, projectsById: recordOf(isLegacyProject),
})
