"use client"

import {
  DocumentView,
  type DocumentLinkedWorkLink,
} from "@/features/document/components/document-view"

import type { ProjectSelection } from "../query-state"
import { ProjectWorkView } from "./project-work-view"
import { useProjectStore } from "../store-provider"
import { useRouter } from "next/navigation"
import { getProjectViewHref } from "../query-state"

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
  onDuplicateDocument: (resourceId: string) => boolean
}

export function ProjectView({
  selection,
  today,
  linkedWorkItems,
  onAddBoard,
  onEditBoard,
  onSetLabels,
  onSaveDocument,
  onDuplicateDocument,
}: ProjectViewProps) {
  const draftContent = useProjectStore(state => selection.kind === "document"
    ? state.documentDraftsById[selection.resource.id] : undefined)
  const updateDocumentDraft = useProjectStore(state => state.updateDocumentDraft)
  const discardDocumentDraft = useProjectStore(state => state.discardDocumentDraft)
  const renameDocument = useProjectStore(state => state.renameProjectDocument)
  const pinDocument = useProjectStore(state => state.setDocumentPinned)
  const moveDocument = useProjectStore(state => state.moveProjectDocument)
  const deleteDocument = useProjectStore(state => state.deleteProjectDocument)
  const resources = useProjectStore(state => state.resourcesById)
  const project = useProjectStore(state => selection.kind === "document" ? state.projectsById[selection.resource.projectId] : undefined)
  const router = useRouter()
  if (selection.kind === "document") {
    const resource = selection.resource
    const documentIds = project?.resourceIds.filter(id => resources[id]?.type === "document") ?? []
    const index = documentIds.indexOf(resource.id)
    return (
      <DocumentView
        key={selection.resource.id}
        resourceId={selection.resource.id}
        resourceTitle={selection.resource.title}
        savedContent={selection.resource.content}
        draftContent={draftContent}
        onDraftChange={updateDocumentDraft}
        onDiscardDraft={discardDocumentDraft}
        linkedWorkItems={linkedWorkItems}
        onSave={onSaveDocument}
        onDuplicate={onDuplicateDocument}
        management={{
          pinned: resource.isPinned,
          canMoveUp: index > 0,
          canMoveDown: index >= 0 && index < documentIds.length - 1,
          rename: title => renameDocument(resource.id, title),
          setPinned: pinned => pinDocument(resource.id, pinned),
          move: direction => moveDocument(resource.id, direction),
          delete: () => {
            if (!project || !deleteDocument(resource.id)) return false
            const nextId = documentIds[index + 1] ?? documentIds[index - 1]
            router.replace(getProjectViewHref(project.workspaceId, project.id, nextId ? "documents" : "overview", { resourceId: nextId }))
            return true
          },
        }}
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
