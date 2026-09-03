import type { ProjectDocumentResource } from "./model"
import {
  isSupportedProjectViewType,
  type SupportedProjectView,
  type SupportedProjectViewType,
} from "./view-definitions.ts"

export type ProjectQueryValue = string | string[] | undefined

export type ProjectSelection =
  | { kind: "overview" }
  | { kind: "work"; view: SupportedProjectView }
  | { kind: "document"; resource: ProjectDocumentResource }
  | { kind: "missing-resource"; resourceId: string }

type ProjectViewTarget =
  | "overview"
  | "documents"
  | SupportedProjectViewType

export function resolveProjectSelection(
  workViews: readonly SupportedProjectView[],
  documents: readonly ProjectDocumentResource[],
  viewQuery: ProjectQueryValue,
  resourceQuery: ProjectQueryValue
): ProjectSelection {
  const view = firstQueryValue(viewQuery)

  if (view === "documents") {
    const firstDocument = documents[0]

    if (!firstDocument) {
      return { kind: "overview" }
    }

    if (resourceQuery === undefined) {
      return { kind: "document", resource: firstDocument }
    }

    const resourceId = firstQueryValue(resourceQuery) ?? ""
    const resource = documents.find(
      (document) => document.id === resourceId
    )

    return resource
      ? { kind: "document", resource }
      : { kind: "missing-resource", resourceId }
  }

  if (view && isSupportedProjectViewType(view)) {
    const projectView = workViews.find(
      (candidate) => candidate.type === view
    )

    if (projectView) {
      return { kind: "work", view: projectView }
    }
  }

  return { kind: "overview" }
}

export function getProjectViewHref(
  workspaceId: string,
  projectId: string,
  view: ProjectViewTarget,
  resourceId?: string
) {
  const pathname =
    "/dashboard/workspaces/" +
    encodeURIComponent(workspaceId) +
    "/projects/" +
    encodeURIComponent(projectId)
  const query = new URLSearchParams({ view })

  if (view === "documents" && resourceId) {
    query.set("resource", resourceId)
  }

  return pathname + "?" + query.toString()
}

function firstQueryValue(value: ProjectQueryValue) {
  return Array.isArray(value) ? value[0] : value
}
