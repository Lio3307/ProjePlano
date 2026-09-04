import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_STATUSES,
  WORK_ITEM_TYPES,
  isValidWorkItemDate,
  type EditableWorkItemFields,
  type WorkItem,
} from "./model.ts"

export type WorkItemFormValue = {
  title: string
  description: string
  type: WorkItem["type"]
  status: WorkItem["status"]
  priority: WorkItem["priority"]
  assigneeId: string
  dueDate: string
  estimate: string
  labels: string
  checklist: WorkItem["checklist"]
  dependencyIds: string[]
}

export function createWorkItemFormValue(
  workItem: WorkItem | null
): WorkItemFormValue {
  if (!workItem) {
    return {
      title: "",
      description: "",
      type: "feature",
      status: "todo",
      priority: "medium",
      assigneeId: "",
      dueDate: "",
      estimate: "",
      labels: "",
      checklist: [],
      dependencyIds: [],
    }
  }

  return {
    title: workItem.title,
    description: workItem.description,
    type: workItem.type,
    status: workItem.status,
    priority: workItem.priority,
    assigneeId: workItem.assigneeId ?? "",
    dueDate: workItem.dueDate ?? "",
    estimate:
      workItem.estimate === null ? "" : String(workItem.estimate),
    labels: workItem.labels.join(", "),
    checklist: workItem.checklist.map((checklistItem) => ({
      ...checklistItem,
    })),
    dependencyIds: [...workItem.dependencyIds],
  }
}

export function normalizeWorkItemFormValue(
  value: WorkItemFormValue
): EditableWorkItemFields | null {
  const title = value.title.trim()
  const description = value.description.trim()
  const assigneeId = value.assigneeId.trim() || null
  const dueDate = value.dueDate.trim() || null
  const estimateText = value.estimate.trim()
  const estimate = estimateText === "" ? null : Number(estimateText)
  const checklist = value.checklist.map((checklistItem) => ({
    id: checklistItem.id.trim(),
    label: checklistItem.label.trim(),
    completed: checklistItem.completed,
  }))
  const checklistIds = checklist.map((checklistItem) => checklistItem.id)
  const dependencyIds = value.dependencyIds.map((dependencyId) =>
    dependencyId.trim()
  )

  if (
    !title ||
    !WORK_ITEM_TYPES.includes(value.type) ||
    !WORK_ITEM_STATUSES.includes(value.status) ||
    !WORK_ITEM_PRIORITIES.includes(value.priority) ||
    (dueDate !== null && !isValidWorkItemDate(dueDate)) ||
    (estimate !== null &&
      (!Number.isInteger(estimate) || estimate < 0)) ||
    checklist.some(
      (checklistItem) =>
        !checklistItem.id ||
        !checklistItem.label ||
        typeof checklistItem.completed !== "boolean"
    ) ||
    new Set(checklistIds).size !== checklistIds.length ||
    dependencyIds.some((dependencyId) => !dependencyId) ||
    new Set(dependencyIds).size !== dependencyIds.length
  ) {
    return null
  }

  const labels = value.labels
    .split(",")
    .map((label) => label.trim())
    .filter(
      (label, index, allLabels) =>
        label.length > 0 && allLabels.indexOf(label) === index
    )

  return {
    title,
    description,
    type: value.type,
    status: value.status,
    priority: value.priority,
    assigneeId,
    dueDate,
    estimate,
    labels,
    checklist,
    dependencyIds,
  }
}

export function getEditableWorkItemFields(
  workItem: WorkItem
): EditableWorkItemFields {
  return {
    title: workItem.title,
    description: workItem.description,
    type: workItem.type,
    status: workItem.status,
    priority: workItem.priority,
    assigneeId: workItem.assigneeId,
    dueDate: workItem.dueDate,
    estimate: workItem.estimate,
    labels: [...workItem.labels],
    checklist: workItem.checklist.map((checklistItem) => ({
      ...checklistItem,
    })),
    dependencyIds: [...workItem.dependencyIds],
  }
}

export function haveSameEditableWorkItemFields(
  left: EditableWorkItemFields,
  right: EditableWorkItemFields
) {
  return JSON.stringify(left) === JSON.stringify(right)
}
