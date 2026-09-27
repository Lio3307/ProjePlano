import {
  normalizeTaskBoardFields,
  type EditableTaskBoardFields,
  type TaskBoard,
} from "../project/task-board.ts"

export type TaskBoardFormValue = EditableTaskBoardFields

export function setTaskBoardCompleted(
  value: TaskBoardFormValue,
  completed: boolean
): TaskBoardFormValue {
  return { ...value, stage: completed ? "done" : value.stage === "done" ? "todo" : value.stage }
}

export function createTaskBoardFormValue(
  board: TaskBoard | null
): TaskBoardFormValue {
  return {
    title: board?.title ?? "",
    description: board?.description ?? "",
    stage: board?.stage ?? "todo",
  }
}

export function normalizeTaskBoardFormValue(
  value: TaskBoardFormValue
): EditableTaskBoardFields | null {
  return normalizeTaskBoardFields(value)
}

export function haveSameEditableTaskBoardFields(
  left: EditableTaskBoardFields,
  right: EditableTaskBoardFields
) {
  return (
    left.title === right.title &&
    left.description === right.description &&
    left.stage === right.stage
  )
}
