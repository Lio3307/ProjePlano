import type { SupportedProjectViewType } from "./view-definitions"

type ProjectTemplateDefinition = {
  id: string
  name: string
  description: string
  viewTypes: readonly SupportedProjectViewType[]
  documentTitle: string | null
}

export const PROJECT_TEMPLATES = [
  {
    id: "web-application",
    name: "Web Application",
    description: "Plan product work, implementation details, and releases.",
    viewTypes: ["board", "table", "calendar"],
    documentTitle: "Project Brief",
  },
  {
    id: "mobile-application",
    name: "Mobile Application",
    description: "Organize product work and release dates for a mobile app.",
    viewTypes: ["board", "calendar"],
    documentTitle: "Product Brief",
  },
  {
    id: "api-service",
    name: "API Service",
    description: "Track endpoint work, technical decisions, and delivery.",
    viewTypes: ["board", "table"],
    documentTitle: "API Brief",
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Plan content, implementation work, and launch timing.",
    viewTypes: ["board", "calendar"],
    documentTitle: "Content Brief",
  },
  {
    id: "empty-project",
    name: "Empty Project",
    description: "Start with Overview and add only the views you need.",
    viewTypes: [],
    documentTitle: null,
  },
] as const satisfies readonly ProjectTemplateDefinition[]

export type ProjectTemplate = (typeof PROJECT_TEMPLATES)[number]
export type ProjectTemplateId = ProjectTemplate["id"]

export function getProjectTemplate(value: string | null | undefined) {
  return PROJECT_TEMPLATES.find((template) => template.id === value) ?? null
}
