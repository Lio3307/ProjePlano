import type { ProjectViewConfig, ProjectViewType } from "./model"

export type SupportedProjectViewType = Exclude<
  ProjectViewType,
  "timeline"
>

export type SupportedProjectView = Omit<ProjectViewConfig, "type"> & {
  type: SupportedProjectViewType
}

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
      "priority",
      "assignee",
      "dueDate",
      "labels",
      "checklist",
    ],
    groupBy: "status",
    filterIds: [],
  },
  table: {
    title: "Table",
    type: "table",
    visibleFieldIds: [
      "title",
      "status",
      "priority",
      "dueDate",
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

  return {
    ...definition,
    id: "view-" + projectId + "-" + type,
    projectId,
    visibleFieldIds: [...definition.visibleFieldIds],
    filterIds: [...definition.filterIds],
  }
}
