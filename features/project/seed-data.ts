import { INITIAL_CALENDAR_TASKS } from "../calendar/mock-data.ts"
import { INITIAL_KANBAN_COLUMNS } from "../kanban/mock-data.ts"
import { INITIAL_ROWS } from "../table/mock-data.ts"
import type { Row } from "../table/model"
import type {
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
} from "../work-item/model"
import { PROJECTS } from "./mock-data.ts"
import type {
  ProjectDocumentResource,
  ProjectRecord,
  ProjectResource,
  ProjectViewConfig,
  ProjectWorkspaceState,
} from "./model"
import type { Project } from "./types"
import { createProjectViewConfig } from "./view-definitions.ts"

export function createProjectSeedState(): ProjectWorkspaceState {
  const projectRecords: ProjectRecord[] = []
  const projectViews: ProjectViewConfig[] = []
  const resources: ProjectResource[] = []
  const workItems: WorkItem[] = []

  for (const project of PROJECTS) {
    const view = createLegacyProjectView(project)
    const projectResources = createLegacyProjectResources(project)

    if (view) {
      projectViews.push(view)
    }

    resources.push(...projectResources)

    projectRecords.push({
      id: project.id,
      workspaceId: project.workspaceId,
      title: project.title,
      description: "",
      templateId: null,
      status: "active",
      viewIds: view ? [view.id] : [],
      resourceIds: projectResources.map((resource) => resource.id),
      milestoneIds: [],
    })

    workItems.push(...createLegacyWorkItems(project))
  }

  return {
    projectIdsByWorkspaceId: groupProjectIdsByWorkspace(PROJECTS),
    projectsById: indexById(projectRecords),
    projectViewsById: indexById(projectViews),
    workItemsById: indexById(workItems),
    resourcesById: indexById(resources),
    milestonesById: {},
  }
}

function createLegacyProjectView(project: Project) {
  if (project.type === "document") {
    return null
  }

  const viewType = project.type === "kanban" ? "board" : project.type

  return createProjectViewConfig(project.id, viewType)
}

function createLegacyProjectResources(
  project: Project
): ProjectDocumentResource[] {
  if (project.type !== "document") {
    return []
  }

  if (project.id === "1") {
    return [
      createDocumentResource(
        "resource-1-document",
        project.id,
        "API Design",
        "<h1>API Design</h1><p>Capture endpoints, payloads, and response contracts.</p>"
      ),
      createDocumentResource(
        "resource-1-endpoint-guidelines",
        project.id,
        "Endpoint guidelines",
        "<h1>Endpoint guidelines</h1><p>Keep routes predictable and errors consistent.</p>"
      ),
      createDocumentResource(
        "resource-1-decision-log",
        project.id,
        "Decision log",
        "<h1>Decision log</h1><p>Record technical decisions and their trade-offs.</p>"
      ),
    ]
  }

  return [
    createDocumentResource(
      `resource-${project.id}-document`,
      project.id,
      project.title,
      `<h1>${project.title}</h1><p>Keep shared project knowledge in one place.</p>`
    ),
  ]
}

function createDocumentResource(
  id: string,
  projectId: string,
  title: string,
  content: string
): ProjectDocumentResource {
  return {
    id,
    projectId,
    title,
    type: "document",
    templateId: null,
    isPinned: false,
    content,
  }
}

function createLegacyWorkItems(project: Project): WorkItem[] {
  switch (project.type) {
    case "kanban":
      return createKanbanWorkItems(project.id)
    case "calendar":
      return createCalendarWorkItems(project.id)
    case "table":
      return createTableWorkItems(project.id)
    case "document":
      return []
    default:
      return assertNever(project.type)
  }
}

function createKanbanWorkItems(projectId: string) {
  const workItems = INITIAL_KANBAN_COLUMNS.flatMap((column) => {
    const status = getKanbanStatus(column.id)

    return column.cards.map((card) => {
      const workItemId = `work-item-${projectId}-${card.id}`

      return {
        id: workItemId,
        projectId,
        title: card.title,
        description: card.description,
        type: "feature" as const,
        status,
        priority: card.priority,
        assignee: { ...card.assignee },
        startDate: null,
        dueDate: card.dueDate,
        estimate: null,
        position: 0,
        labels: [...card.labels],
        checklist: card.checklist.map((checklistItem) => ({
          ...checklistItem,
          id: `${workItemId}-${checklistItem.id}`,
        })),
        milestoneId: null,
        dependencyIds: [],
        linkedResourceIds: [],
        customFields: {},
      }
    })
  })

  return normalizeStatusPositions(workItems)
}

function createCalendarWorkItems(projectId: string) {
  const workItems: WorkItem[] = INITIAL_CALENDAR_TASKS.map((task) => ({
    id: `work-item-${projectId}-${task.id}`,
    projectId,
    title: task.title,
    description: task.description,
    type: "feature",
    status: task.status,
    priority: task.priority,
    assignee: { ...task.assignee },
    startDate: null,
    dueDate: task.dueDate,
    estimate: null,
    position: 0,
    labels: [...task.labels],
    checklist: task.checklist.map((checklistItem) => ({
      ...checklistItem,
      id: `work-item-${projectId}-${task.id}-${checklistItem.id}`,
    })),
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
  }))

  return normalizeStatusPositions(workItems)
}

function createTableWorkItems(projectId: string) {
  const workItems: WorkItem[] = INITIAL_ROWS.map((row) => {
    const attachmentValue = row.cells.attachments
    const dueDate = getStringCell(row, "due")

    return {
      id: `work-item-${projectId}-${row.id}`,
      projectId,
      title: getStringCell(row, "name"),
      description: "",
      type: "chore",
      status: getTableStatus(getStringCell(row, "status")),
      priority: getTablePriority(getStringCell(row, "priority")),
      assignee: null,
      startDate: null,
      dueDate: dueDate || null,
      estimate: null,
      position: 0,
      labels: [],
      checklist: [],
      milestoneId: null,
      dependencyIds: [],
      linkedResourceIds: [],
      customFields: {
        attachments: Array.isArray(attachmentValue)
          ? attachmentValue.map((attachment) => ({ ...attachment }))
          : [],
      },
    }
  })

  return normalizeStatusPositions(workItems)
}

function normalizeStatusPositions(workItems: WorkItem[]) {
  const nextPositionByStatus: Partial<Record<WorkItemStatus, number>> = {}

  return workItems.map((workItem) => {
    const position = nextPositionByStatus[workItem.status] ?? 0
    nextPositionByStatus[workItem.status] = position + 1

    return { ...workItem, position }
  })
}

function getKanbanStatus(columnId: string): WorkItemStatus {
  switch (columnId) {
    case "backlog":
    case "todo":
    case "in-progress":
    case "review":
    case "testing":
    case "done":
      return columnId
    default:
      throw new Error(`Unsupported Kanban status: ${columnId}`)
  }
}

function getTableStatus(value: string): WorkItemStatus {
  switch (value) {
    case "todo":
    case "in-progress":
    case "done":
      return value
    default:
      throw new Error(`Unsupported Table status: ${value}`)
  }
}

function getTablePriority(value: string): WorkItemPriority {
  switch (value) {
    case "low":
    case "medium":
    case "high":
      return value
    default:
      throw new Error(`Unsupported Table priority: ${value}`)
  }
}

function getStringCell(row: Row, columnId: string) {
  const value = row.cells[columnId]

  if (typeof value !== "string") {
    throw new Error(`Expected a string in ${columnId} for row ${row.id}`)
  }

  return value
}

function groupProjectIdsByWorkspace(projects: Project[]) {
  const grouped: Record<string, string[]> = {}

  for (const project of projects) {
    const projectIds = grouped[project.workspaceId] ?? []
    grouped[project.workspaceId] = [...projectIds, project.id]
  }

  return grouped
}

function indexById<T extends { id: string }>(records: T[]) {
  const indexed: Record<string, T> = {}

  for (const record of records) {
    indexed[record.id] = record
  }

  return indexed
}

function assertNever(value: never): never {
  throw new Error(`Unsupported project type: ${value}`)
}
