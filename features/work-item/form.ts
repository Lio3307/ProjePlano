import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_TYPES,
  isValidWorkItemDateRange,
  type EditableWorkItemFields,
  type WorkItem,
} from "./model.ts"

export type WorkItemFormValue = {
  title: string
  description: string
  type: WorkItem["type"]
  priority: WorkItem["priority"]
  assigneeId: string
  startDate: string
  dueDate: string
  estimate: string
  labelIds: string[]
  checklist: WorkItem["checklist"]
  dependencyIds: string[]
  linkedResourceIds: string[]
}

export type WorkItemFormValidationResult =
  | {
      ok: true
      fields: EditableWorkItemFields
    }
  | {
      ok: false
      field:
        | "title"
        | "type"
        | "priority"
        | "date-range"
        | "estimate"
        | "checklist"
        | "relationships"
      message: string
    }

export function createWorkItemFormValue(
  workItem: WorkItem | null
): WorkItemFormValue {
  if (!workItem) {
    return {
      title: "",
      description: "",
      type: "feature",
      priority: "medium",
      assigneeId: "",
      startDate: "",
      dueDate: "",
      estimate: "",
      labelIds: [],
      checklist: [],
      dependencyIds: [],
      linkedResourceIds: [],
    }
  }

  return {
    title: workItem.title,
    description: workItem.description,
    type: workItem.type,
    priority: workItem.priority,
    assigneeId: workItem.assigneeId ?? "",
    startDate: workItem.startDate ?? "",
    dueDate: workItem.dueDate ?? "",
    estimate:
      workItem.estimate === null ? "" : String(workItem.estimate),
    labelIds: [...workItem.labelIds],
    checklist: workItem.checklist.map((checklistItem) => ({
      ...checklistItem,
    })),
    dependencyIds: [...workItem.dependencyIds],
    linkedResourceIds: [...workItem.linkedResourceIds],
  }
}

export function normalizeWorkItemFormValue(
  value: WorkItemFormValue
): EditableWorkItemFields | null {
  const result = validateWorkItemFormValue(value)

  return result.ok ? result.fields : null
}

export function validateWorkItemFormValue(
  value: WorkItemFormValue
): WorkItemFormValidationResult {
  const title = value.title.trim()
  const description = value.description.trim()
  const assigneeId = value.assigneeId.trim() || null
  const startDate = value.startDate.trim() || null
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
  const labelIds = normalizeIdentityList(value.labelIds)
  const linkedResourceIds = normalizeIdentityList(
    value.linkedResourceIds
  )

  if (!title) {
    return {
      ok: false,
      field: "title",
      message: "Enter a task title.",
    }
  }

  if (!WORK_ITEM_TYPES.includes(value.type)) {
    return {
      ok: false,
      field: "type",
      message: "Select a valid task type.",
    }
  }

  if (!WORK_ITEM_PRIORITIES.includes(value.priority)) {
    return {
      ok: false,
      field: "priority",
      message: "Select a valid task priority.",
    }
  }

  if (!isValidWorkItemDateRange(startDate, dueDate)) {
    return {
      ok: false,
      field: "date-range",
      message:
        "Enter valid dates with the start date on or before the due date.",
    }
  }

  if (
    estimate !== null &&
    (!Number.isInteger(estimate) || estimate < 0)
  ) {
    return {
      ok: false,
      field: "estimate",
      message: "Enter a whole-number estimate of zero or more.",
    }
  }

  if (
    checklist.some(
      (checklistItem) =>
        !checklistItem.id ||
        !checklistItem.label ||
        typeof checklistItem.completed !== "boolean"
    ) ||
    new Set(checklistIds).size !== checklistIds.length
  ) {
    return {
      ok: false,
      field: "checklist",
      message:
        "Enter text for every checklist item and remove duplicate entries.",
    }
  }

  if (
    dependencyIds.some((dependencyId) => !dependencyId) ||
    new Set(dependencyIds).size !== dependencyIds.length
  ) {
    return {
      ok: false,
      field: "relationships",
      message:
        "Refresh task dependencies and select each dependency only once.",
    }
  }

  return {
    ok: true,
    fields: {
      title,
      description,
      type: value.type,
      priority: value.priority,
      assigneeId,
      startDate,
      dueDate,
      estimate,
      labelIds,
      checklist,
      dependencyIds,
      linkedResourceIds,
    },
  }
}

export function getEditableWorkItemFields(
  workItem: WorkItem
): EditableWorkItemFields {
  return {
    title: workItem.title,
    description: workItem.description,
    type: workItem.type,
    priority: workItem.priority,
    assigneeId: workItem.assigneeId,
    startDate: workItem.startDate,
    dueDate: workItem.dueDate,
    estimate: workItem.estimate,
    labelIds: [...workItem.labelIds],
    checklist: workItem.checklist.map((checklistItem) => ({
      ...checklistItem,
    })),
    dependencyIds: [...workItem.dependencyIds],
    linkedResourceIds: [...workItem.linkedResourceIds],
  }
}

export function haveSameEditableWorkItemFields(
  left: EditableWorkItemFields,
  right: EditableWorkItemFields
) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function normalizeIdentityList(values: readonly string[]) {
  return values
    .map((value) => value.trim())
    .filter(
      (value, index, allValues) =>
        value.length > 0 && allValues.indexOf(value) === index
    )
}
