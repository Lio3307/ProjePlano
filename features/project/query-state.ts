import type { ProjectDocumentResource } from "./model"
import {
  isSupportedProjectViewType,
  type SupportedProjectView,
  type SupportedProjectViewType,
} from "./view-definitions.ts"

export type ProjectQueryValue = string | string[] | undefined

export type ProjectSelection =
  | { kind: "overview" }
  | { kind: "empty-work" }
  | { kind: "work"; view: SupportedProjectView }
  | { kind: "document"; resource: ProjectDocumentResource }
  | { kind: "missing-resource"; resourceId: string }

type ProjectViewTarget =
  | "overview"
  | "work"
  | "documents"
  | SupportedProjectViewType

export type ProjectSelectionQuery = {
  view?: ProjectQueryValue
  workView?: ProjectQueryValue
  resource?: ProjectQueryValue
}

export type ProjectViewHrefOptions = {
  resourceId?: string
  workViewId?: string
}

export function resolveProjectSelection(
  workViews: readonly SupportedProjectView[],
  documents: readonly ProjectDocumentResource[],
  query: ProjectSelectionQuery
): ProjectSelection {
  const view = firstQueryValue(query.view)

  if (view === "work") {
    const firstWorkView = workViews[0]

    return firstWorkView
      ? { kind: "work", view: firstWorkView }
      : { kind: "empty-work" }
  }

  if (view === "documents") {
    const firstDocument = documents[0]

    if (!firstDocument) {
      return { kind: "overview" }
    }

    if (query.resource === undefined) {
      return { kind: "document", resource: firstDocument }
    }

    const resourceId = firstQueryValue(query.resource) ?? ""
    const resource = documents.find(
      (document) => document.id === resourceId
    )

    return resource
      ? { kind: "document", resource }
      : { kind: "missing-resource", resourceId }
  }

  if (view && isSupportedProjectViewType(view)) {
    const workViewId = firstQueryValue(query.workView)
    const projectView = workViews.find((candidate) => {
      if (candidate.type !== view) {
        return false
      }

      return workViewId === undefined || candidate.id === workViewId
    })

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
  options: ProjectViewHrefOptions = {}
) {
  const pathname =
    "/dashboard/workspaces/" +
    encodeURIComponent(workspaceId) +
    "/projects/" +
    encodeURIComponent(projectId)
  const query = new URLSearchParams({ view })

  if (view === "documents" && options.resourceId) {
    query.set("resource", options.resourceId)
  }

  if (isSupportedProjectViewType(view) && options.workViewId) {
    query.set("workView", options.workViewId)
  }

  return pathname + "?" + query.toString()
}

function firstQueryValue(value: ProjectQueryValue) {
  return Array.isArray(value) ? value[0] : value
}
