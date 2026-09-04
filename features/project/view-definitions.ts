import type { ProjectViewConfig, ProjectViewType } from "./model"

export type SupportedProjectViewType = Exclude<
  ProjectViewType,
  "timeline"
>

export type SupportedProjectView = Extract<
  ProjectViewConfig,
  { type: SupportedProjectViewType }
>

type ProjectViewDefinition = {
  title: string
  type: SupportedProjectViewType
  visibleFieldIds: readonly string[]
  groupBy: string | null
  filterIds: readonly string[]
}

export const SUPPORTED_PROJECT_VIEW_TYPES = [
  "board",
  "table",
  "calendar",
] as const satisfies readonly SupportedProjectViewType[]

export const PROJECT_VIEW_DEFINITIONS = {
  board: {
    title: "Board",
    type: "board",
    visibleFieldIds: [
      "title",
      "type",
      "priority",
      "assignee",
      "dueDate",
      "labels",
      "checklist",
    ],
    groupBy: "board",
    filterIds: [],
  },
  table: {
    title: "Table",
    type: "table",
    visibleFieldIds: [
      "name",
      "status",
      "priority",
      "due",
      "attachments",
    ],
    groupBy: null,
    filterIds: [],
  },
  calendar: {
    title: "Calendar",
    type: "calendar",
    visibleFieldIds: [
      "title",
      "status",
      "priority",
      "assignee",
      "dueDate",
    ],
    groupBy: null,
    filterIds: [],
  },
} as const satisfies Record<SupportedProjectViewType, ProjectViewDefinition>

export function isSupportedProjectViewType(
  value: string
): value is SupportedProjectViewType {
  return SUPPORTED_PROJECT_VIEW_TYPES.some((type) => type === value)
}

export function createProjectViewConfig(
  projectId: string,
  type: SupportedProjectViewType
): SupportedProjectView {
  const definition = PROJECT_VIEW_DEFINITIONS[type]
  const view = {
    ...definition,
    id: "view-" + projectId + "-" + type,
    projectId,
    visibleFieldIds: [...definition.visibleFieldIds],
    filterIds: [...definition.filterIds],
  }

  if (type === "board") {
    return {
      ...view,
      type,
      boardIds: [],
      labels: [],
    }
  }

  return { ...view, type }
}
