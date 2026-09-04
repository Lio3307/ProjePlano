import {
  isWorkItemStatus,
  type WorkItemStatus,
} from "../work-item/model.ts"

export type TaskBoard = {
  id: string
  projectId: string
  viewId: string
  title: string
  description: string
  stage: WorkItemStatus
  position: number
}

export type EditableTaskBoardFields = Pick<
  TaskBoard,
  "title" | "description" | "stage"
>

export function normalizeTaskBoardFields(
  fields: EditableTaskBoardFields
): EditableTaskBoardFields | null {
  const title = fields.title.trim()

  if (title.length === 0 || !isWorkItemStatus(fields.stage)) {
    return null
  }

  return {
    title,
    description: fields.description.trim(),
    stage: fields.stage,
  }
}
