import {
  DocumentView,
  type DocumentLinkedWorkLink,
} from "@/features/document/components/document-view"

import type { ProjectSelection } from "../query-state"
import { ProjectWorkView } from "./project-work-view"

type RendererSelection = Extract<
  ProjectSelection,
  { kind: "work" | "document" }
>

interface ProjectViewProps {
  selection: RendererSelection
  today: string
  linkedWorkItems: readonly DocumentLinkedWorkLink[]
  onAddBoard: (trigger: HTMLElement) => void
  onEditBoard: (boardId: string, trigger: HTMLElement) => void
  onSetLabels: (trigger: HTMLElement) => void
  onSaveDocument: (resourceId: string, content: string) => boolean
}

export function ProjectView({
  selection,
  today,
  linkedWorkItems,
  onAddBoard,
  onEditBoard,
  onSetLabels,
  onSaveDocument,
}: ProjectViewProps) {
  if (selection.kind === "document") {
    return (
      <DocumentView
        key={selection.resource.id}
        resourceId={selection.resource.id}
        resourceTitle={selection.resource.title}
        savedContent={selection.resource.content}
        linkedWorkItems={linkedWorkItems}
        onSave={onSaveDocument}
      />
    )
  }

  return (
    <ProjectWorkView
      key={selection.view.id}
      projectId={selection.view.projectId}
      view={selection.view}
      today={today}
      onAddBoard={onAddBoard}
      onEditBoard={onEditBoard}
      onSetLabels={onSetLabels}
    />
  )
}
