import { INITIAL_CALENDAR_TASKS } from "../calendar/mock-data.ts"
import { WORKSPACES } from "../workspace/mock-data.ts"
import { INITIAL_KANBAN_COLUMNS } from "../kanban/mock-data.ts"
import { createTableSnapshot } from "../table/snapshot.ts"
import type {
  WorkItem,
  WorkItemStatus,
} from "../work-item/model.ts"
import { PROJECTS } from "./mock-data.ts"
import type {
  ProjectDocumentResource,
  ProjectBoardView,
  ProjectRecord,
  ProjectResource,
  ProjectViewConfig,
  ProjectWorkspaceState,
} from "./model"
import type { Project } from "./types"
import { BOARD_LABEL_COLORS, type BoardLabel } from "./board.ts"
import type { TaskBoard } from "./task-board.ts"
import { createProjectViewConfig } from "./view-definitions.ts"

const KANBAN_DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  "workspace-filters": ["audit-onboarding"],
}

const CALENDAR_DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  "regression-pass": ["release-notes"],
  "readiness-review": ["regression-pass"],
}

export function createProjectSeedState(): ProjectWorkspaceState {
  const projectRecords: ProjectRecord[] = []
  const projectViews: ProjectViewConfig[] = []
  const taskBoards: TaskBoard[] = []
  const resources: ProjectResource[] = []
  const workItems: WorkItem[] = []

  for (const project of PROJECTS) {
    const views = createLegacyProjectViews(project)
    const projectTaskBoards = createLegacyTaskBoards(project, views)
    const projectResources = createLegacyProjectResources(project)

    projectViews.push(...views)
    taskBoards.push(...projectTaskBoards)

    resources.push(...projectResources)

    projectRecords.push({
      id: project.id,
      workspaceId: project.workspaceId,
      title: project.title,
      description: "",
      templateId: null,
      status: "active",
      archived: false,
      viewIds: views.map((view) => view.id),
      resourceIds: projectResources.map((resource) => resource.id),
      milestoneIds: [],
    })

    workItems.push(
      ...createLegacyWorkItems(project, views, projectTaskBoards)
    )
  }

  return {
    workspaceIds: WORKSPACES.map(workspace => workspace.id),
    workspacesById: indexById(structuredClone(WORKSPACES)),
    tablesByViewId: Object.fromEntries(
      projectViews.filter(view => view.type === "table")
        .map(view => [view.id, createTableSnapshot()])
    ),
    projectIdsByWorkspaceId: groupProjectIdsByWorkspace(PROJECTS),
    projectsById: indexById(projectRecords),
    projectViewsById: indexById(projectViews),
    taskBoardsById: indexById(taskBoards),
    workItemsById: indexById(workItems),
    resourcesById: indexById(resources),
    milestonesById: {},
  }
}

function createLegacyTaskBoards(
  project: Project,
  views: ProjectViewConfig[]
): TaskBoard[] {
  const boardView = views.find(
    (view): view is ProjectBoardView => view.type === "board"
  )

  if (!boardView) {
    return []
  }

  const definitions =
    project.type === "kanban"
      ? INITIAL_KANBAN_COLUMNS.map((column) => ({
          stage: getKanbanStatus(column.id),
          title: column.title,
        }))
      : project.type === "calendar"
        ? getCalendarBoardDefinitions()
        : []

  const boards = definitions.map(({ stage, title }, position) => ({
    id: `task-board-${project.id}-${stage}`,
    projectId: project.id,
    viewId: boardView.id,
    title,
    description: "",
    stage,
    position,
  }))

  boardView.boardIds = boards.map((board) => board.id)
  return boards
}

function getCalendarBoardDefinitions() {
  const stages = new Set(
    INITIAL_CALENDAR_TASKS.map((task) => task.status)
  )

  return (
    ["backlog", "todo", "in-progress", "review", "testing", "done"] as const
  )
    .filter((stage) => stages.has(stage))
    .map((stage) => ({ stage, title: getStageTitle(stage) }))
}

function getStageTitle(stage: WorkItemStatus) {
  switch (stage) {
    case "backlog":
      return "Backlog"
    case "todo":
      return "To Do"
    case "in-progress":
      return "In Progress"
    case "review":
      return "Review"
    case "testing":
      return "Testing"
    case "done":
      return "Done"
  }
}

function createLegacyProjectViews(project: Project): ProjectViewConfig[] {
  switch (project.type) {
    case "kanban":
      return [
        createSeedBoard(
          project.id,
          INITIAL_KANBAN_COLUMNS.flatMap((column) =>
            column.cards.flatMap((card) => card.labels)
          )
        ),
      ]
    case "table":
      return [createProjectViewConfig(project.id, "table")]
    case "calendar":
      return [
        createSeedBoard(
          project.id,
          INITIAL_CALENDAR_TASKS.flatMap((task) => task.labels)
        ),
        createProjectViewConfig(project.id, "calendar"),
      ]
    case "document":
      return []
    default:
      return assertNever(project.type)
  }
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

function createLegacyWorkItems(
  project: Project,
  views: ProjectViewConfig[],
  taskBoards: TaskBoard[]
): WorkItem[] {
  const board = views.find(
    (view): view is ProjectBoardView => view.type === "board"
  )

  switch (project.type) {
    case "kanban":
      return board
        ? createKanbanWorkItems(project.id, board, taskBoards)
        : []
    case "calendar":
      return board
        ? createCalendarWorkItems(project.id, board, taskBoards)
        : []
    case "table":
    case "document":
      return []
    default:
      return assertNever(project.type)
  }
}

function createKanbanWorkItems(
  projectId: string,
  boardView: ProjectBoardView,
  taskBoards: TaskBoard[]
) {
  const workItems = INITIAL_KANBAN_COLUMNS.flatMap((column) => {
    const status = getKanbanStatus(column.id)

    return column.cards.map((card) => {
      const workItemId = `work-item-${projectId}-${card.id}`

      return {
        id: workItemId,
        projectId,
        boardId: getTaskBoardId(taskBoards, status),
        title: card.title,
        description: card.description,
        type: "feature" as const,
        priority: card.priority,
        startDate: null,
        dueDate: card.dueDate,
        estimate: null,
        position: 0,
        labelIds: getBoardLabelIds(boardView, card.labels),
        checklist: card.checklist.map((checklistItem) => ({
          ...checklistItem,
          id: `${workItemId}-${checklistItem.id}`,
        })),
        milestoneId: null,
        dependencyIds: createSeedDependencyIds(
          projectId,
          KANBAN_DEPENDENCIES[card.id]
        ),
        linkedResourceIds: [],
        customFields: {},
      }
    })
  })

  return normalizeBoardPositions(workItems)
}

function createCalendarWorkItems(
  projectId: string,
  boardView: ProjectBoardView,
  taskBoards: TaskBoard[]
) {
  const workItems: WorkItem[] = INITIAL_CALENDAR_TASKS.map((task) => ({
    id: `work-item-${projectId}-${task.id}`,
    projectId,
    boardId: getTaskBoardId(taskBoards, task.status),
    title: task.title,
    description: task.description,
    type: "feature",
    priority: task.priority,
    startDate: null,
    dueDate: task.dueDate,
    estimate: null,
    position: 0,
    labelIds: getBoardLabelIds(boardView, task.labels),
    checklist: task.checklist.map((checklistItem) => ({
      ...checklistItem,
      id: `work-item-${projectId}-${task.id}-${checklistItem.id}`,
    })),
    milestoneId: null,
    dependencyIds: createSeedDependencyIds(
      projectId,
      CALENDAR_DEPENDENCIES[task.id]
    ),
    linkedResourceIds: [],
    customFields: {},
  }))

  return normalizeBoardPositions(workItems)
}

function normalizeBoardPositions(workItems: WorkItem[]) {
  const nextPositionByGroup = new Map<string, number>()

  return workItems.map((workItem) => {
    const position = nextPositionByGroup.get(workItem.boardId) ?? 0
    nextPositionByGroup.set(workItem.boardId, position + 1)

    return { ...workItem, position }
  })
}

function getTaskBoardId(
  taskBoards: readonly TaskBoard[],
  stage: WorkItemStatus
) {
  const board = taskBoards.find((candidate) => candidate.stage === stage)

  if (!board) {
    throw new Error(`Missing seeded Board for stage: ${stage}`)
  }

  return board.id
}

function createSeedDependencyIds(
  projectId: string,
  dependencyIds: readonly string[] | undefined
) {
  return (dependencyIds ?? []).map(
    (dependencyId) => `work-item-${projectId}-${dependencyId}`
  )
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

function createSeedBoard(
  projectId: string,
  fixtureLabelNames: readonly string[]
): ProjectBoardView {
  const board = createProjectViewConfig(projectId, "board")

  if (board.type !== "board") {
    throw new Error("Expected Board view configuration")
  }

  const seenNames = new Set<string>()
  const labels: BoardLabel[] = []

  for (const name of fixtureLabelNames) {
    const normalizedName = name.trim()
    const lookupName = normalizedName.toLowerCase()

    if (!normalizedName || seenNames.has(lookupName)) {
      continue
    }

    seenNames.add(lookupName)
    const index = labels.length
    labels.push({
      id: `${board.id}-label-${index + 1}`,
      name: normalizedName,
      color: BOARD_LABEL_COLORS[index % BOARD_LABEL_COLORS.length],
    })
  }

  return { ...board, labels }
}

function getBoardLabelIds(
  board: ProjectBoardView,
  fixtureLabelNames: readonly string[]
) {
  const labelIdByName = new Map(
    board.labels.map((label) => [label.name.toLowerCase(), label.id])
  )

  return fixtureLabelNames.map((name) => {
    const labelId = labelIdByName.get(name.trim().toLowerCase())

    if (!labelId) {
      throw new Error(`Missing Board label for fixture value: ${name}`)
    }

    return labelId
  })
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
