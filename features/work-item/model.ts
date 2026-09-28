export const WORK_ITEM_TYPES = ["feature", "bug", "chore", "spike"] as const

export const WORK_ITEM_STATUSES = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "testing",
  "done",
] as const

export const WORK_ITEM_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const

export type WorkItemType = (typeof WORK_ITEM_TYPES)[number]
export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number]
export type WorkItemPriority = (typeof WORK_ITEM_PRIORITIES)[number]

export type ChecklistItem = {
  id: string
  label: string
  completed: boolean
}

export type WorkItemAttachment = {
  id: string
  name: string
  type: string
  url: string
  kind: "file" | "link"
}

export type FieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | WorkItemAttachment[]

export type WorkItem = {
  archived?: boolean
  id: string
  projectId: string
  boardId: string
  title: string
  description: string
  type: WorkItemType
  priority: WorkItemPriority
  startDate: string | null
  dueDate: string | null
  estimate: number | null
  position: number
  labelIds: string[]
  checklist: ChecklistItem[]
  milestoneId: string | null
  dependencyIds: string[]
  linkedResourceIds: string[]
  customFields: Record<string, FieldValue>
}

export type EditableWorkItemFields = Pick<
  WorkItem,
  | "title"
  | "description"
  | "type"
  | "priority"
  | "startDate"
  | "dueDate"
  | "estimate"
  | "labelIds"
  | "checklist"
  | "dependencyIds"
  | "linkedResourceIds"
>

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function isWorkItemStatus(value: string): value is WorkItemStatus {
  return WORK_ITEM_STATUSES.some((status) => status === value)
}

export function isValidWorkItemDate(value: string) {
  const match = ISO_DATE_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  if (year < 1000 || month < 0 || month > 11 || day < 1) {
    return false
  }

  const date = new Date(Date.UTC(year, month, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
  )
}

export function isValidWorkItemDateRange(
  startDate: string | null,
  dueDate: string | null
) {
  if (startDate !== null && !isValidWorkItemDate(startDate)) {
    return false
  }

  if (dueDate !== null && !isValidWorkItemDate(dueDate)) {
    return false
  }

  return startDate === null || dueDate === null || startDate <= dueDate
}

export function isValidWorkItem(item: WorkItem) {
  const typeIsValid = WORK_ITEM_TYPES.some((type) => type === item.type)
  const priorityIsValid = WORK_ITEM_PRIORITIES.some(
    (priority) => priority === item.priority
  )
  const estimateIsValid =
    item.estimate === null ||
    (Number.isInteger(item.estimate) && item.estimate >= 0)
  const labelIdsAreValid =
    Array.isArray(item.labelIds) &&
    item.labelIds.every(
      (labelId) =>
        typeof labelId === "string" &&
        labelId.length > 0 &&
        labelId.trim() === labelId
    ) &&
    new Set(item.labelIds).size === item.labelIds.length
  const checklistIsValid =
    Array.isArray(item.checklist) &&
    item.checklist.every(
      (checklistItem) =>
        typeof checklistItem.id === "string" &&
        checklistItem.id.length > 0 &&
        checklistItem.id.trim() === checklistItem.id &&
        typeof checklistItem.label === "string" &&
        checklistItem.label.length > 0 &&
        checklistItem.label.trim() === checklistItem.label &&
        typeof checklistItem.completed === "boolean"
    ) &&
    new Set(
      item.checklist.map((checklistItem) => checklistItem.id)
    ).size === item.checklist.length
  const linkedResourceIdsAreValid =
    Array.isArray(item.linkedResourceIds) &&
    item.linkedResourceIds.every(
      (resourceId) =>
        typeof resourceId === "string" &&
        resourceId.length > 0 &&
        resourceId.trim() === resourceId
    ) &&
    new Set(item.linkedResourceIds).size ===
      item.linkedResourceIds.length

  return (
    (item.archived === undefined || typeof item.archived === "boolean") &&
    isNormalizedIdentity(item.id) &&
    isNormalizedIdentity(item.projectId) &&
    isNormalizedIdentity(item.boardId) &&
    item.title.trim().length > 0 &&
    typeIsValid &&
    priorityIsValid &&
    estimateIsValid &&
    Number.isInteger(item.position) &&
    item.position >= 0 &&
    labelIdsAreValid &&
    checklistIsValid &&
    Array.isArray(item.dependencyIds) &&
    linkedResourceIdsAreValid &&
    item.customFields !== null &&
    typeof item.customFields === "object" &&
    isValidWorkItemDateRange(item.startDate, item.dueDate)
  )
}

function isNormalizedIdentity(value: string) {
  return value.length > 0 && value.trim() === value
}

export function wouldCreateDependencyCycle(
  workItemsById: Readonly<Record<string, WorkItem>>,
  itemId: string,
  dependencyIds: readonly string[]
) {
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(currentId: string): boolean {
    if (visiting.has(currentId)) {
      return true
    }

    if (visited.has(currentId)) {
      return false
    }

    visiting.add(currentId)

    const currentDependencies =
      currentId === itemId
        ? dependencyIds
        : (workItemsById[currentId]?.dependencyIds ?? [])

    for (const dependencyId of currentDependencies) {
      if (visit(dependencyId)) {
        return true
      }
    }

    visiting.delete(currentId)
    visited.add(currentId)
    return false
  }

  return visit(itemId)
}
