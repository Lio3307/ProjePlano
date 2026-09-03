import { DocumentView } from "@/features/document/components/document-view"

import type { ProjectSelection } from "../query-state"
import { ProjectWorkView } from "./project-work-view"

type RendererSelection = Extract<
  ProjectSelection,
  { kind: "work" | "document" }
>

interface ProjectViewProps {
  selection: RendererSelection
  today: string
  onSaveDocument: (resourceId: string, content: string) => boolean
}

export function ProjectView({
  selection,
  today,
  onSaveDocument,
}: ProjectViewProps) {
  if (selection.kind === "document") {
    return (
      <DocumentView
        key={selection.resource.id}
        resourceId={selection.resource.id}
        resourceTitle={selection.resource.title}
        savedContent={selection.resource.content}
        onSave={onSaveDocument}
      />
    )
  }

  return (
    <ProjectWorkView
      key={selection.view.id}
      projectId={selection.view.projectId}
      viewType={selection.view.type}
      today={today}
    />
  )
}
